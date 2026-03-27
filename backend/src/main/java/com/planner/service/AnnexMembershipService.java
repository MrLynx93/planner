package com.planner.service;

import com.planner.dto.AnnexGroupDto;
import com.planner.dto.AnnexTeacherDto;
import com.planner.entity.*;
import com.planner.repository.AnnexGroupRepository;
import com.planner.repository.AnnexTeacherRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnexMembershipService {

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
        Group defaultGroup = dto.defaultGroupId() != null ? groupService.getOrThrow(dto.defaultGroupId()) : null;
        AnnexTeacher at = new AnnexTeacher();
        at.setAnnex(annex);
        at.setTeacher(teacher);
        at.setDefaultGroup(defaultGroup);
        return toTeacherDto(annexTeacherRepository.save(at));
    }

    public AnnexTeacherDto updateTeacher(Integer annexId, Integer annexTeacherId, AnnexTeacherDto dto) {
        AnnexTeacher at = annexTeacherRepository.findById(annexTeacherId)
                .filter(a -> a.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("AnnexTeacher not found: " + annexTeacherId));
        Group defaultGroup = dto.defaultGroupId() != null ? groupService.getOrThrow(dto.defaultGroupId()) : null;
        at.setDefaultGroup(defaultGroup);
        return toTeacherDto(annexTeacherRepository.save(at));
    }

    public void removeTeacher(Integer annexId, Integer annexTeacherId) {
        AnnexTeacher at = annexTeacherRepository.findById(annexTeacherId)
                .filter(a -> a.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("AnnexTeacher not found: " + annexTeacherId));
        annexTeacherRepository.delete(at);
    }

    private AnnexGroupDto toGroupDto(AnnexGroup ag) {
        return new AnnexGroupDto(ag.getId(), ag.getAnnex().getId(), ag.getGroup().getId(), ag.getGroup().getName());
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
