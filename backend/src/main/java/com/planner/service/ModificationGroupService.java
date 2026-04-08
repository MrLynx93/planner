package com.planner.service;

import com.planner.dto.*;
import com.planner.entity.*;
import com.planner.repository.TimeBlockModificationGroupRepository;
import com.planner.repository.TimeBlockModificationRepository;
import com.planner.repository.TimeBlockRepository;
import java.time.DayOfWeek;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModificationGroupService {

    private final TimeBlockModificationGroupRepository groupRepository;
    private final TimeBlockModificationRepository modificationRepository;
    private final TimeBlockRepository timeBlockRepository;
    private final AnnexService annexService;
    private final AnnexTimeBlockService timeBlockService;
    private final TeacherService teacherService;
    private final GroupService groupService;

    public List<ModificationGroupDto> findByAnnex(Integer annexId) {
        return groupRepository.findByAnnexId(annexId).stream().map(this::toDto).toList();
    }

    public ModificationGroupDto findById(Integer annexId, Integer groupId) {
        return toDto(getOrThrow(annexId, groupId));
    }

    @Transactional
    public ModificationGroupDto create(Integer annexId, CreateModificationGroupRequest request) {
        Annex annex = annexService.getOrThrow(annexId);
        if (annex.getState() == AnnexState.FINISHED) {
            throw new IllegalStateException("Cannot modify a FINISHED annex");
        }

        TimeBlockModificationGroup group = new TimeBlockModificationGroup();
        group.setAnnex(annex);
        group.setTitle(request.title());
        group.setReason(request.reason());
        group.setNote(request.note());
        groupRepository.save(group);

        if (request.modifications() != null) {
            request.modifications().forEach(item -> {
                TimeBlock timeBlock;
                if (item.type() == ModificationType.REMOVE) {
                    timeBlock = timeBlockService.getTimeBlockOrThrow(item.timeBlockId());
                } else {
                    // ADD: create a new MODIFICATION-type TimeBlock inline
                    Teacher teacher = teacherService.getOrThrow(item.teacherId());
                    Group grp = groupService.getOrThrow(item.groupId());
                    timeBlock = new TimeBlock();
                    timeBlock.setType(TimeBlockType.MODIFICATION);
                    timeBlock.setTeacher(teacher);
                    timeBlock.setGroup(grp);
                    timeBlock.setDayOfWeek(item.date().getDayOfWeek());
                    timeBlock.setStartTime(item.startTime());
                    timeBlock.setEndTime(item.endTime());
                    timeBlockRepository.save(timeBlock);
                }

                TimeBlockModification mod = new TimeBlockModification();
                mod.setModificationGroup(group);
                mod.setType(item.type());
                mod.setTimeBlock(timeBlock);
                mod.setDate(item.date());
                modificationRepository.save(mod);
            });
        }

        return toDto(group);
    }

    @Transactional
    public ModificationGroupDto update(Integer annexId, Integer groupId, UpdateModificationGroupRequest request) {
        TimeBlockModificationGroup group = getOrThrow(annexId, groupId);
        if (group.getAnnex().getState() == AnnexState.FINISHED) {
            throw new IllegalStateException("Cannot modify a FINISHED annex");
        }
        group.setTitle(request.title());
        group.setReason(request.reason());
        group.setNote(request.note());
        groupRepository.save(group);
        return toDto(group);
    }

    @Transactional
    public void delete(Integer annexId, Integer groupId) {
        TimeBlockModificationGroup group = getOrThrow(annexId, groupId);
        List<TimeBlockModification> modifications = modificationRepository.findByModificationGroupId(groupId);
        modifications.forEach(m -> {
            TimeBlock tb = m.getTimeBlock();
            modificationRepository.delete(m);
            // Delete MODIFICATION-type TimeBlocks that were created for ADD items
            if (tb.getType() == TimeBlockType.MODIFICATION) {
                timeBlockRepository.delete(tb);
            }
        });
        groupRepository.delete(group);
    }

    private TimeBlockModificationGroup getOrThrow(Integer annexId, Integer groupId) {
        return groupRepository.findById(groupId)
                .filter(g -> g.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("ModificationGroup not found: " + groupId));
    }

    private ModificationGroupDto toDto(TimeBlockModificationGroup g) {
        List<ModificationDto> modifications = modificationRepository
                .findByModificationGroupId(g.getId()).stream()
                .map(m -> {
                    TimeBlock tb = m.getTimeBlock();
                    return new ModificationDto(
                            m.getId(),
                            m.getType(),
                            tb.getId(),
                            tb.getTeacher().getFirstName(),
                            tb.getTeacher().getLastName(),
                            tb.getGroup().getName(),
                            tb.getStartTime(),
                            tb.getEndTime(),
                            m.getDate()
                    );
                })
                .toList();
        return new ModificationGroupDto(g.getId(), g.getAnnex().getId(), g.getTitle(), g.getReason(), g.getNote(), modifications);
    }
}
