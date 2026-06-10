package com.planner.service;

import com.planner.dto.GeneratePlanResultDto;
import com.planner.dto.TemplateViolationDto;
import com.planner.entity.*;
import com.planner.repository.AnnexGroupRepository;
import com.planner.repository.AnnexTeacherRepository;
import com.planner.repository.AnnexTimeBlockRepository;
import com.planner.repository.TimeBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanGeneratorService {

    private static final LocalTime DEFAULT_SCHEDULE_START = LocalTime.of(6, 0);
    private static final LocalTime DEFAULT_SCHEDULE_END = LocalTime.of(20, 0);
    private static final List<DayOfWeek> WEEKDAYS = List.of(
            DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY);

    private static final int SA_MAX_STEPS = 5000;
    private static final double SA_INITIAL_TEMP = 10.0;
    private static final double SA_COOLING_RATE = 0.995;
    private static final double SA_MIN_TEMP = 0.01;
    private final AnnexService annexService;
    private final AnnexTimeBlockService annexTimeBlockService;
    private final AnnexTeacherRepository annexTeacherRepository;
    private final AnnexGroupRepository annexGroupRepository;
    private final AnnexTimeBlockRepository annexTimeBlockRepository;
    private final TimeBlockRepository timeBlockRepository;
    private final RuleResolutionService ruleResolutionService;
    private final ViolationService violationService;

    private record TimeBlockDraft(int teacherId, int groupId, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime) {}

    private record CostContext(
            Map<Integer, Integer> teacherMinWeekly,
            Map<Integer, Integer> teacherMaxDaily,
            Map<Integer, Integer> groupMinTeachers,
            Map<Integer, Integer> groupMaxTeachers,
            Map<Integer, LocalTime> groupEffStart,
            Map<Integer, LocalTime> groupEffEnd
    ) {}

    @Transactional
    public GeneratePlanResultDto generate(Integer annexId) {
        Annex annex = annexService.getOrThrow(annexId);
        if (annex.getState() != AnnexState.DRAFT) {
            throw new IllegalStateException("Plan generation is only allowed for DRAFT annexes");
        }

        annexTimeBlockService.deleteAllForAnnex(annexId);

        List<AnnexTeacher> annexTeachers = annexTeacherRepository.findByAnnexId(annexId);
        List<AnnexGroup> annexGroups = annexGroupRepository.findByAnnexId(annexId);

        if (annexTeachers.isEmpty() || annexGroups.isEmpty()) {
            return new GeneratePlanResultDto(0, violationService.findTemplateViolations(annexId));
        }

        List<Integer> teacherIds = annexTeachers.stream()
                .map(at -> at.getTeacher().getId())
                .collect(Collectors.toList());
        List<Integer> groupIds = annexGroups.stream()
                .map(ag -> ag.getGroup().getId())
                .collect(Collectors.toList());

        Map<Integer, LocalTime> groupEffStart = new HashMap<>();
        Map<Integer, LocalTime> groupEffEnd = new HashMap<>();
        for (AnnexGroup ag : annexGroups) {
            int groupId = ag.getGroup().getId();
            groupEffStart.put(groupId, effectiveStart(ag));
            groupEffEnd.put(groupId, effectiveEnd(ag));
        }

        Map<Integer, Integer> teacherMinWeekly = new HashMap<>();
        Map<Integer, Integer> teacherMaxDaily = new HashMap<>();
        for (AnnexTeacher at : annexTeachers) {
            int teacherId = at.getTeacher().getId();
            Integer minW = ruleResolutionService.resolveForTeacher(annexId, teacherId, RuleType.TEACHER_WEEKLY_HOURS_MIN);
            Integer maxD = ruleResolutionService.resolveForTeacher(annexId, teacherId, RuleType.TEACHER_MAX_HOURS_PER_DAY);
            if (minW != null) teacherMinWeekly.put(teacherId, minW);
            if (maxD != null) teacherMaxDaily.put(teacherId, maxD);
        }

        Map<Integer, Integer> groupMinTeachers = new HashMap<>();
        Map<Integer, Integer> groupMaxTeachers = new HashMap<>();
        for (AnnexGroup ag : annexGroups) {
            int groupId = ag.getGroup().getId();
            Integer minT = ruleResolutionService.resolveForGroup(annexId, groupId, RuleType.GROUP_MIN_TEACHERS);
            Integer maxT = ruleResolutionService.resolveForGroup(annexId, groupId, RuleType.GROUP_MAX_TEACHERS);
            if (minT != null) groupMinTeachers.put(groupId, minT);
            if (maxT != null) groupMaxTeachers.put(groupId, maxT);
        }

        CostContext ctx = new CostContext(teacherMinWeekly, teacherMaxDaily, groupMinTeachers, groupMaxTeachers, groupEffStart, groupEffEnd);

        // Greedy initialization
        List<TimeBlockDraft> currentSchedule = buildGreedySchedule(annexTeachers, groupEffStart, groupEffEnd, teacherMaxDaily);
        double currentCost = computeCost(currentSchedule, ctx);

        // Simulated Annealing
        Random random = new Random();
        double temperature = SA_INITIAL_TEMP;

        for (int step = 0; step < SA_MAX_STEPS && currentCost > 0 && temperature > SA_MIN_TEMP; step++) {
            List<TimeBlockDraft> candidate = applyRandomMove(currentSchedule, random, teacherIds, groupIds, groupEffStart, groupEffEnd, ctx);
            double candidateCost = computeCost(candidate, ctx);
            double delta = candidateCost - currentCost;

            if (delta < 0 || random.nextDouble() < Math.exp(-delta / temperature)) {
                currentSchedule = candidate;
                currentCost = candidateCost;
            }
            temperature *= SA_COOLING_RATE;
        }

        List<TimeBlockDraft> finalSchedule = enforceDefaultGroupBlocks(
                mergeOverlappingBlocks(currentSchedule), annexTeachers, groupEffStart, groupEffEnd, teacherMaxDaily);
        persistSchedule(annex, finalSchedule, annexTeachers, annexGroups);

        List<TemplateViolationDto> remaining = violationService.findTemplateViolations(annexId);
        return new GeneratePlanResultDto(finalSchedule.size(), remaining);
    }

    private List<TimeBlockDraft> buildGreedySchedule(
            List<AnnexTeacher> annexTeachers,
            Map<Integer, LocalTime> groupEffStart,
            Map<Integer, LocalTime> groupEffEnd,
            Map<Integer, Integer> teacherMaxDaily) {

        List<TimeBlockDraft> schedule = new ArrayList<>();
        for (AnnexTeacher at : annexTeachers) {
            if (at.getDefaultGroup() == null) continue;
            int teacherId = at.getTeacher().getId();
            int groupId = at.getDefaultGroup().getId();
            LocalTime start = groupEffStart.getOrDefault(groupId, DEFAULT_SCHEDULE_START);
            LocalTime end = groupEffEnd.getOrDefault(groupId, DEFAULT_SCHEDULE_END);

            Integer maxD = teacherMaxDaily.get(teacherId);
            if (maxD != null && Duration.between(start, end).toMinutes() > maxD * 60L) {
                end = start.plusMinutes(maxD * 60L);
            }

            LocalTime finalEnd = end;
            WEEKDAYS.forEach(dow -> schedule.add(new TimeBlockDraft(teacherId, groupId, dow, start, finalEnd)));
        }
        return mergeOverlappingBlocks(schedule);
    }

    private List<TimeBlockDraft> enforceDefaultGroupBlocks(
            List<TimeBlockDraft> schedule,
            List<AnnexTeacher> annexTeachers,
            Map<Integer, LocalTime> groupEffStart,
            Map<Integer, LocalTime> groupEffEnd,
            Map<Integer, Integer> teacherMaxDaily) {

        List<TimeBlockDraft> result = new ArrayList<>(schedule);
        for (AnnexTeacher at : annexTeachers) {
            if (at.getDefaultGroup() == null) continue;
            int teacherId = at.getTeacher().getId();
            int groupId = at.getDefaultGroup().getId();

            for (DayOfWeek dow : WEEKDAYS) {
                boolean hasBlock = result.stream().anyMatch(
                        b -> b.teacherId() == teacherId && b.groupId() == groupId && b.dayOfWeek() == dow);
                if (hasBlock) continue;

                LocalTime start = groupEffStart.getOrDefault(groupId, DEFAULT_SCHEDULE_START);
                LocalTime end = groupEffEnd.getOrDefault(groupId, DEFAULT_SCHEDULE_END);
                Integer maxD = teacherMaxDaily.get(teacherId);
                if (maxD != null && Duration.between(start, end).toMinutes() > maxD * 60L) {
                    end = start.plusMinutes(maxD * 60L);
                }
                result.add(new TimeBlockDraft(teacherId, groupId, dow, start, end));
            }
        }
        return mergeOverlappingBlocks(result);
    }

    private void persistSchedule(Annex annex, List<TimeBlockDraft> schedule,
                                  List<AnnexTeacher> annexTeachers, List<AnnexGroup> annexGroups) {
        Map<Integer, Teacher> teacherMap = annexTeachers.stream()
                .collect(Collectors.toMap(at -> at.getTeacher().getId(), AnnexTeacher::getTeacher));
        Map<Integer, Group> groupMap = annexGroups.stream()
                .collect(Collectors.toMap(ag -> ag.getGroup().getId(), AnnexGroup::getGroup));

        for (TimeBlockDraft draft : schedule) {
            Teacher teacher = teacherMap.get(draft.teacherId());
            Group group = groupMap.get(draft.groupId());
            if (teacher == null || group == null) continue;

            TimeBlock tb = new TimeBlock();
            tb.setType(TimeBlockType.TEMPLATE);
            tb.setTeacher(teacher);
            tb.setGroup(group);
            tb.setDayOfWeek(draft.dayOfWeek());
            tb.setStartTime(draft.startTime());
            tb.setEndTime(draft.endTime());
            timeBlockRepository.save(tb);

            AnnexTimeBlock atb = new AnnexTimeBlock();
            atb.setAnnex(annex);
            atb.setTimeBlock(tb);
            annexTimeBlockRepository.save(atb);
        }
    }

    private double computeCost(List<TimeBlockDraft> schedule, CostContext ctx) {
        double cost = 0;

        for (Map.Entry<Integer, Integer> e : ctx.teacherMinWeekly().entrySet()) {
            int teacherId = e.getKey();
            int minHours = e.getValue();
            int actualMinutes = schedule.stream()
                    .filter(b -> b.teacherId() == teacherId)
                    .mapToInt(b -> (int) Duration.between(b.startTime(), b.endTime()).toMinutes())
                    .sum();
            if (actualMinutes / 60 < minHours) {
                cost += (minHours - actualMinutes / 60.0) * 100.0;
            }
        }

        for (Map.Entry<Integer, Integer> e : ctx.teacherMaxDaily().entrySet()) {
            int teacherId = e.getKey();
            int maxHours = e.getValue();
            for (DayOfWeek dow : WEEKDAYS) {
                int dayMinutes = schedule.stream()
                        .filter(b -> b.teacherId() == teacherId && b.dayOfWeek() == dow)
                        .mapToInt(b -> (int) Duration.between(b.startTime(), b.endTime()).toMinutes())
                        .sum();
                if (dayMinutes / 60 > maxHours) {
                    cost += (dayMinutes / 60.0 - maxHours) * 50.0;
                }
            }
        }

        for (int groupId : ctx.groupEffStart().keySet()) {
            LocalTime groupStart = ctx.groupEffStart().get(groupId);
            LocalTime groupEnd = ctx.groupEffEnd().get(groupId);
            Integer minTeachers = ctx.groupMinTeachers().get(groupId);
            Integer maxTeachers = ctx.groupMaxTeachers().get(groupId);
            if (minTeachers == null && maxTeachers == null) continue;

            for (DayOfWeek dow : WEEKDAYS) {
                List<TimeBlockDraft> dayBlocks = schedule.stream()
                        .filter(b -> b.groupId() == groupId && b.dayOfWeek() == dow)
                        .collect(Collectors.toList());

                if (dayBlocks.isEmpty()) {
                    if (minTeachers != null) cost += minTeachers * 200.0;
                    continue;
                }

                Set<LocalTime> timePoints = new TreeSet<>();
                timePoints.add(groupStart);
                timePoints.add(groupEnd);
                dayBlocks.forEach(b -> { timePoints.add(b.startTime()); timePoints.add(b.endTime()); });

                List<LocalTime> sorted = new ArrayList<>(timePoints);
                for (int i = 0; i < sorted.size() - 1; i++) {
                    LocalTime iStart = sorted.get(i);
                    LocalTime iEnd = sorted.get(i + 1);
                    if (!iStart.isBefore(iEnd)) continue;

                    LocalTime mid = iStart.plusMinutes(Duration.between(iStart, iEnd).toMinutes() / 2);
                    if (mid.isBefore(groupStart) || !mid.isBefore(groupEnd)) continue;

                    long teacherCount = dayBlocks.stream()
                            .filter(b -> !b.startTime().isAfter(mid) && b.endTime().isAfter(mid))
                            .map(TimeBlockDraft::teacherId)
                            .distinct()
                            .count();

                    if (minTeachers != null && teacherCount < minTeachers) {
                        cost += (minTeachers - teacherCount) * 200.0;
                    }
                    if (maxTeachers != null && teacherCount > maxTeachers) {
                        cost += (teacherCount - maxTeachers) * 200.0;
                    }
                }
            }
        }

        for (TimeBlockDraft b : schedule) {
            LocalTime groupStart = ctx.groupEffStart().getOrDefault(b.groupId(), DEFAULT_SCHEDULE_START);
            LocalTime groupEnd = ctx.groupEffEnd().getOrDefault(b.groupId(), DEFAULT_SCHEDULE_END);
            if (b.startTime().isBefore(groupStart) || b.endTime().isAfter(groupEnd)) {
                cost += 200.0;
            }
        }

        return cost;
    }

    private List<TimeBlockDraft> applyRandomMove(
            List<TimeBlockDraft> schedule, Random rand,
            List<Integer> teacherIds, List<Integer> groupIds,
            Map<Integer, LocalTime> groupEffStart, Map<Integer, LocalTime> groupEffEnd,
            CostContext ctx) {

        List<TimeBlockDraft> result = new ArrayList<>(schedule);

        if (result.isEmpty()) {
            return addRandomBlock(result, rand, teacherIds, groupIds, groupEffStart, groupEffEnd, ctx);
        }

        // Weighted: SHIFT=3, RESIZE=3, REASSIGN=2, ADD=2, REMOVE=1
        int r = rand.nextInt(11);

        if (r < 3) {
            int idx = rand.nextInt(result.size());
            TimeBlockDraft b = result.get(idx);
            int shiftMins = (rand.nextBoolean() ? 1 : -1) * (15 * (1 + rand.nextInt(4)));
            LocalTime newStart = clampTime(b.startTime().plusMinutes(shiftMins));
            LocalTime newEnd = clampTime(b.endTime().plusMinutes(shiftMins));
            if (newStart.isBefore(newEnd)) {
                result.set(idx, new TimeBlockDraft(b.teacherId(), b.groupId(), b.dayOfWeek(), newStart, newEnd));
            }
        } else if (r < 6) {
            int idx = rand.nextInt(result.size());
            TimeBlockDraft b = result.get(idx);
            int deltaMins = (rand.nextBoolean() ? 1 : -1) * (15 * (1 + rand.nextInt(4)));
            LocalTime newEnd = clampTime(b.endTime().plusMinutes(deltaMins));
            if (newEnd.isAfter(b.startTime().plusMinutes(30))) {
                result.set(idx, new TimeBlockDraft(b.teacherId(), b.groupId(), b.dayOfWeek(), b.startTime(), newEnd));
            }
        } else if (r < 8) {
            if (groupIds.size() > 1) {
                int idx = rand.nextInt(result.size());
                TimeBlockDraft b = result.get(idx);
                List<Integer> others = groupIds.stream().filter(g -> g != b.groupId()).collect(Collectors.toList());
                int newGroupId = others.get(rand.nextInt(others.size()));
                LocalTime start = groupEffStart.getOrDefault(newGroupId, DEFAULT_SCHEDULE_START);
                LocalTime end = groupEffEnd.getOrDefault(newGroupId, DEFAULT_SCHEDULE_END);
                Integer maxD = ctx.teacherMaxDaily().get(b.teacherId());
                if (maxD != null && Duration.between(start, end).toMinutes() > maxD * 60L) {
                    end = start.plusMinutes(maxD * 60L);
                }
                result.set(idx, new TimeBlockDraft(b.teacherId(), newGroupId, b.dayOfWeek(), start, end));
            }
        } else if (r < 10) {
            result = addRandomBlock(result, rand, teacherIds, groupIds, groupEffStart, groupEffEnd, ctx);
        } else {
            result.remove(rand.nextInt(result.size()));
        }

        return mergeOverlappingBlocks(result);
    }

    private List<TimeBlockDraft> addRandomBlock(
            List<TimeBlockDraft> schedule, Random rand,
            List<Integer> teacherIds, List<Integer> groupIds,
            Map<Integer, LocalTime> groupEffStart, Map<Integer, LocalTime> groupEffEnd,
            CostContext ctx) {

        int teacherId = teacherIds.get(rand.nextInt(teacherIds.size()));
        int groupId = groupIds.get(rand.nextInt(groupIds.size()));
        DayOfWeek dow = WEEKDAYS.get(rand.nextInt(WEEKDAYS.size()));
        LocalTime start = groupEffStart.getOrDefault(groupId, DEFAULT_SCHEDULE_START);
        LocalTime end = groupEffEnd.getOrDefault(groupId, DEFAULT_SCHEDULE_END);
        Integer maxD = ctx.teacherMaxDaily().get(teacherId);
        if (maxD != null && Duration.between(start, end).toMinutes() > maxD * 60L) {
            end = start.plusMinutes(maxD * 60L);
        }
        List<TimeBlockDraft> result = new ArrayList<>(schedule);
        result.add(new TimeBlockDraft(teacherId, groupId, dow, start, end));
        return result;
    }

    private List<TimeBlockDraft> mergeOverlappingBlocks(List<TimeBlockDraft> schedule) {
        Map<String, List<TimeBlockDraft>> grouped = schedule.stream()
                .collect(Collectors.groupingBy(
                        b -> b.teacherId() + "_" + b.groupId() + "_" + b.dayOfWeek()));

        List<TimeBlockDraft> result = new ArrayList<>();
        for (List<TimeBlockDraft> group : grouped.values()) {
            if (group.size() == 1) {
                result.add(group.get(0));
                continue;
            }
            List<TimeBlockDraft> sorted = group.stream()
                    .sorted(Comparator.comparing(TimeBlockDraft::startTime))
                    .collect(Collectors.toList());

            TimeBlockDraft current = sorted.get(0);
            for (int i = 1; i < sorted.size(); i++) {
                TimeBlockDraft next = sorted.get(i);
                if (!next.startTime().isAfter(current.endTime())) {
                    LocalTime mergedEnd = current.endTime().isAfter(next.endTime())
                            ? current.endTime() : next.endTime();
                    current = new TimeBlockDraft(current.teacherId(), current.groupId(), current.dayOfWeek(), current.startTime(), mergedEnd);
                } else {
                    result.add(current);
                    current = next;
                }
            }
            result.add(current);
        }
        return result;
    }

    private LocalTime clampTime(LocalTime t) {
        if (t.equals(LocalTime.MIDNIGHT)) return LocalTime.of(23, 59);
        return t;
    }

    private LocalTime effectiveStart(AnnexGroup ag) {
        if (ag.getScheduleStartTime() != null) return ag.getScheduleStartTime();
        if (ag.getGroup().getScheduleStartTime() != null) return ag.getGroup().getScheduleStartTime();
        return DEFAULT_SCHEDULE_START;
    }

    private LocalTime effectiveEnd(AnnexGroup ag) {
        if (ag.getScheduleEndTime() != null) return ag.getScheduleEndTime();
        if (ag.getGroup().getScheduleEndTime() != null) return ag.getGroup().getScheduleEndTime();
        return DEFAULT_SCHEDULE_END;
    }
}
