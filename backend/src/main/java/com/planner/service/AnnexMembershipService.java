package com.planner.service;

import com.planner.dto.AnnexGroupDto;
import com.planner.dto.AnnexTeacherDto;
import com.planner.entity.*;
import com.planner.repository.AnnexGroupRepository;
import com.planner.repository.AnnexTeacherRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AnnexMembershipService {

    private static final LocalTime DEFAULT_SCHEDULE_START = LocalTime.of(6, 0);
    private static final LocalTime DEFAULT_SCHEDULE_END = LocalTime.of(20, 0);

    private final AnnexGroupRepository annexGroupRepository;
    private final AnnexTeacherRepository annexTeacherRepository;
    private final AnnexService annexService;
    private final GroupService groupService;
    private final TeacherService teacherService;

    // ── Groups ───────────────────────────────────────────────────────────────

    public List<AnnexGroupDto> findGroupsByAnnex(Integer annexId) {
        return annexGroupRepository.findByAnnexId(annexId).stream().map(this::toGroupDto).toList();
    }

    public AnnexGroupDto addGroup(Integer annexId, AnnexGroupDto dto) {
        Annex annex = annexService.getOrThrow(annexId);
        Group group = groupService.getOrThrow(dto.groupId());
        AnnexGroup ag = new AnnexGroup();
        ag.setAnnex(annex);
        ag.setGroup(group);
        return toGroupDto(annexGroupRepository.save(ag));
    }

    public AnnexGroupDto updateGroup(Integer annexId, Integer annexGroupId, AnnexGroupDto dto) {
        AnnexGroup ag = annexGroupRepository.findById(annexGroupId)
                .filter(a -> a.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("AnnexGroup not found: " + annexGroupId));
        ag.setScheduleStartTime(dto.scheduleStartTime());
        ag.setScheduleEndTime(dto.scheduleEndTime());
        ag.getTags().clear();
        if (dto.tags() != null) {
            ag.getTags().addAll(dto.tags());
        }
        return toGroupDto(annexGroupRepository.save(ag));
    }

    public void removeGroup(Integer annexId, Integer annexGroupId) {
        AnnexGroup ag = annexGroupRepository.findById(annexGroupId)
                .filter(a -> a.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("AnnexGroup not found: " + annexGroupId));
        annexGroupRepository.delete(ag);
    }

    // ── Teachers ─────────────────────────────────────────────────────────────

    public List<AnnexTeacherDto> findTeachersByAnnex(Integer annexId) {
        return annexTeacherRepository.findByAnnexId(annexId).stream().map(this::toTeacherDto).toList();
    }

    public AnnexTeacherDto addTeacher(Integer annexId, AnnexTeacherDto dto) {
        Annex annex = annexService.getOrThrow(annexId);
        Teacher teacher = teacherService.getOrThrow(dto.teacherId());
        AnnexTeacher at = new AnnexTeacher();
        at.setAnnex(annex);
        at.setTeacher(teacher);
        if (dto.defaultGroupId() != null) {
            at.setDefaultGroup(groupService.getOrThrow(dto.defaultGroupId()));
        }
        return toTeacherDto(annexTeacherRepository.save(at));
    }

    public AnnexTeacherDto updateTeacher(Integer annexId, Integer annexTeacherId, AnnexTeacherDto dto) {
        AnnexTeacher at = annexTeacherRepository.findById(annexTeacherId)
                .filter(a -> a.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("AnnexTeacher not found: " + annexTeacherId));
        if (dto.defaultGroupId() != null) {
            at.setDefaultGroup(groupService.getOrThrow(dto.defaultGroupId()));
        } else {
            at.setDefaultGroup(null);
        }
        return toTeacherDto(annexTeacherRepository.save(at));
    }

    public void removeTeacher(Integer annexId, Integer annexTeacherId) {
        AnnexTeacher at = annexTeacherRepository.findById(annexTeacherId)
                .filter(a -> a.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("AnnexTeacher not found: " + annexTeacherId));
        annexTeacherRepository.delete(at);
    }

    private AnnexGroupDto toGroupDto(AnnexGroup ag) {
        LocalTime groupStart = ag.getGroup().getScheduleStartTime();
        LocalTime groupEnd = ag.getGroup().getScheduleEndTime();
        LocalTime effectiveStart = ag.getScheduleStartTime() != null ? ag.getScheduleStartTime()
                : groupStart != null ? groupStart : DEFAULT_SCHEDULE_START;
        LocalTime effectiveEnd = ag.getScheduleEndTime() != null ? ag.getScheduleEndTime()
                : groupEnd != null ? groupEnd : DEFAULT_SCHEDULE_END;
        return new AnnexGroupDto(
                ag.getId(),
                ag.getAnnex().getId(),
                ag.getGroup().getId(),
                ag.getGroup().getName(),
                ag.getScheduleStartTime(),
                ag.getScheduleEndTime(),
                effectiveStart,
                effectiveEnd,
                Set.copyOf(ag.getTags())
        );
    }

    private AnnexTeacherDto toTeacherDto(AnnexTeacher at) {
        return new AnnexTeacherDto(
                at.getId(),
                at.getAnnex().getId(),
                at.getTeacher().getId(),
                at.getTeacher().getFirstName(),
                at.getTeacher().getLastName(),
                at.getDefaultGroup() != null ? at.getDefaultGroup().getId() : null,
                at.getDefaultGroup() != null ? at.getDefaultGroup().getName() : null
        );
    }
}
