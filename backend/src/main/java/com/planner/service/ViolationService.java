package com.planner.service;

import com.planner.dto.ViolationDto;
import com.planner.entity.*;
import com.planner.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ViolationService {

    private final AnnexService annexService;
    private final AnnexTeacherRepository annexTeacherRepository;
    private final AnnexGroupRepository annexGroupRepository;
    private final AnnexTimeBlockRepository annexTimeBlockRepository;
    private final TimeBlockModificationRepository modificationRepository;
    private final ClosedDayRepository closedDayRepository;
    private final RuleResolutionService ruleResolutionService;

    public List<ViolationDto> findViolations(Integer annexId, int year, int month) {
        Annex annex = annexService.getOrThrow(annexId);

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();

        // Clamp to annex date range if known
        if (annex.getStartDate() != null && monthStart.isBefore(annex.getStartDate())) {
            monthStart = annex.getStartDate();
        }
        if (annex.getEndDate() != null && monthEnd.isAfter(annex.getEndDate())) {
            monthEnd = annex.getEndDate();
        }

        // Closed days in range
        Set<LocalDate> closedDays = closedDayRepository.findByDateBetween(monthStart, monthEnd)
                .stream().map(ClosedDay::getDate).collect(Collectors.toSet());

        // Working days (Mon–Fri, not closed)
        List<LocalDate> workingDays = monthStart.datesUntil(monthEnd.plusDays(1))
                .filter(d -> d.getDayOfWeek() != DayOfWeek.SATURDAY
                        && d.getDayOfWeek() != DayOfWeek.SUNDAY
                        && !closedDays.contains(d))
                .collect(Collectors.toList());

        if (workingDays.isEmpty()) return List.of();

        // Load template blocks once
        List<AnnexTimeBlock> templateBlocks = annexTimeBlockRepository.findByAnnexId(annexId);

        // Load all modifications in the month range
        List<TimeBlockModification> allModifications =
                modificationRepository.findByModificationGroupAnnexIdAndDateBetween(annexId, monthStart, monthEnd);

        // Build effective blocks per day
        Map<LocalDate, List<BlockInfo>> blocksByDay = buildBlocksByDay(workingDays, templateBlocks, allModifications);

        List<ViolationDto> violations = new ArrayList<>();

        List<AnnexTeacher> annexTeachers = annexTeacherRepository.findByAnnexId(annexId);
        List<AnnexGroup> annexGroups = annexGroupRepository.findByAnnexId(annexId);

        // Check teacher rules
        for (AnnexTeacher at : annexTeachers) {
            Teacher teacher = at.getTeacher();
            int teacherId = teacher.getId();
            String teacherName = teacher.getFirstName() + " " + teacher.getLastName();

            // TEACHER_MONTHLY_HOURS_MIN
            Integer minHours = ruleResolutionService.resolveForTeacher(annexId, teacherId, RuleType.TEACHER_MONTHLY_HOURS_MIN);
            if (minHours != null) {
                int totalMinutes = workingDays.stream()
                        .flatMap(d -> blocksByDay.getOrDefault(d, List.of()).stream())
                        .filter(b -> b.teacherId == teacherId)
                        .mapToInt(BlockInfo::durationMinutes)
                        .sum();
                int actualHours = totalMinutes / 60;
                if (actualHours < minHours) {
                    violations.add(new ViolationDto(
                            ViolationType.TEACHER_MONTHLY_HOURS_TOO_LOW, "ERROR",
                            teacherId, teacherName, null, null, null, null, null,
                            minHours, actualHours
                    ));
                }
            }

            // TEACHER_MAX_HOURS_PER_DAY
            Integer maxPerDay = ruleResolutionService.resolveForTeacher(annexId, teacherId, RuleType.TEACHER_MAX_HOURS_PER_DAY);
            if (maxPerDay != null) {
                for (LocalDate day : workingDays) {
                    int dayMinutes = blocksByDay.getOrDefault(day, List.of()).stream()
                            .filter(b -> b.teacherId == teacherId)
                            .mapToInt(BlockInfo::durationMinutes)
                            .sum();
                    int dayHours = dayMinutes / 60;
                    if (dayHours > maxPerDay) {
                        violations.add(new ViolationDto(
                                ViolationType.TEACHER_DAILY_HOURS_EXCEEDED, "WARNING",
                                teacherId, teacherName, null, null, day, null, null,
                                maxPerDay, dayHours
                        ));
                    }
                }
            }

            // TEACHER_MAX_FREE_HOURS_MONTHLY
            Integer maxFree = ruleResolutionService.resolveForTeacher(annexId, teacherId, RuleType.TEACHER_MAX_FREE_HOURS_MONTHLY);
            if (maxFree != null) {
                long scheduleMinutesPerDay = Duration.between(annex.getScheduleStartTime(), annex.getScheduleEndTime()).toMinutes();
                int totalCapacityMinutes = workingDays.size() * (int) scheduleMinutesPerDay;
                int workedMinutes = workingDays.stream()
                        .flatMap(d -> blocksByDay.getOrDefault(d, List.of()).stream())
                        .filter(b -> b.teacherId == teacherId)
                        .mapToInt(BlockInfo::durationMinutes)
                        .sum();
                int freeHours = (totalCapacityMinutes - workedMinutes) / 60;
                if (freeHours > maxFree) {
                    violations.add(new ViolationDto(
                            ViolationType.TEACHER_FREE_HOURS_EXCEEDED, "WARNING",
                            teacherId, teacherName, null, null, null, null, null,
                            maxFree, freeHours
                    ));
                }
            }
        }

        // Check group rules
        for (AnnexGroup ag : annexGroups) {
            int groupId = ag.getGroup().getId();
            String groupName = ag.getGroup().getName();

            Integer minTeachers = ruleResolutionService.resolveForGroup(annexId, groupId, RuleType.GROUP_MIN_TEACHERS);
            if (minTeachers == null) continue;

            for (LocalDate day : workingDays) {
                List<BlockInfo> dayBlocks = blocksByDay.getOrDefault(day, List.of()).stream()
                        .filter(b -> b.groupId == groupId)
                        .collect(Collectors.toList());

                if (dayBlocks.isEmpty()) {
                    violations.add(new ViolationDto(
                            ViolationType.GROUP_UNDERSTAFFED, "ERROR",
                            null, null, groupId, groupName, day,
                            annex.getScheduleStartTime(), annex.getScheduleEndTime(),
                            minTeachers, 0
                    ));
                    continue;
                }

                // Find all time points to check coverage intervals
                Set<LocalTime> timePoints = new TreeSet<>();
                timePoints.add(annex.getScheduleStartTime());
                timePoints.add(annex.getScheduleEndTime());
                for (BlockInfo b : dayBlocks) {
                    timePoints.add(b.startTime);
                    timePoints.add(b.endTime);
                }

                List<LocalTime> sorted = new ArrayList<>(timePoints);
                for (int i = 0; i < sorted.size() - 1; i++) {
                    LocalTime intervalStart = sorted.get(i);
                    LocalTime intervalEnd = sorted.get(i + 1);
                    if (!intervalStart.isBefore(intervalEnd)) continue;

                    LocalTime mid = intervalStart.plusMinutes(Duration.between(intervalStart, intervalEnd).toMinutes() / 2);
                    long teacherCount = dayBlocks.stream()
                            .filter(b -> !b.startTime.isAfter(mid) && b.endTime.isAfter(mid))
                            .map(b -> b.teacherId)
                            .distinct()
                            .count();

                    if (teacherCount < minTeachers) {
                        violations.add(new ViolationDto(
                                ViolationType.GROUP_UNDERSTAFFED, "ERROR",
                                null, null, groupId, groupName, day,
                                intervalStart, intervalEnd,
                                minTeachers, (int) teacherCount
                        ));
                    }
                }
            }
        }

        return violations;
    }

    private Map<LocalDate, List<BlockInfo>> buildBlocksByDay(
            List<LocalDate> workingDays,
            List<AnnexTimeBlock> templateBlocks,
            List<TimeBlockModification> modifications) {

        Map<LocalDate, List<BlockInfo>> result = new HashMap<>();
        for (LocalDate day : workingDays) {
            result.put(day, new ArrayList<>());
        }

        // Build removed key set
        Set<String> removedKeys = modifications.stream()
                .filter(m -> m.getType() == ModificationType.REMOVE)
                .map(m -> m.getTimeBlock().getId() + "_" + m.getDate())
                .collect(Collectors.toSet());

        // Template blocks
        for (AnnexTimeBlock atb : templateBlocks) {
            TimeBlock tb = atb.getTimeBlock();
            for (LocalDate day : workingDays) {
                if (day.getDayOfWeek() != tb.getDayOfWeek()) continue;
                String key = tb.getId() + "_" + day;
                if (!removedKeys.contains(key)) {
                    result.get(day).add(new BlockInfo(
                            tb.getTeacher().getId(),
                            tb.getGroup().getId(),
                            tb.getStartTime(),
                            tb.getEndTime()
                    ));
                }
            }
        }

        // ADD modification blocks
        for (TimeBlockModification mod : modifications) {
            if (mod.getType() != ModificationType.ADD) continue;
            LocalDate day = mod.getDate();
            if (!result.containsKey(day)) continue;
            TimeBlock tb = mod.getTimeBlock();
            result.get(day).add(new BlockInfo(
                    tb.getTeacher().getId(),
                    tb.getGroup().getId(),
                    tb.getStartTime(),
                    tb.getEndTime()
            ));
        }

        return result;
    }

    private record BlockInfo(int teacherId, int groupId, LocalTime startTime, LocalTime endTime) {
        int durationMinutes() {
            return (int) Duration.between(startTime, endTime).toMinutes();
        }
    }
}
