package com.planner.service;

import com.planner.dto.ModificationDto;
import com.planner.dto.ModificationGroupDto;
import com.planner.entity.TimeBlockModification;
import com.planner.entity.TimeBlockModificationGroup;
import com.planner.repository.TimeBlockModificationGroupRepository;
import com.planner.repository.TimeBlockModificationRepository;
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
    private final AnnexService annexService;
    private final AnnexTimeBlockService timeBlockService;

    public List<ModificationGroupDto> findByAnnex(Integer annexId) {
        return groupRepository.findByAnnexId(annexId).stream().map(this::toDto).toList();
    }

    public ModificationGroupDto findById(Integer annexId, Integer groupId) {
        return toDto(getOrThrow(annexId, groupId));
    }

    @Transactional
    public ModificationGroupDto create(Integer annexId, ModificationGroupDto dto) {
        TimeBlockModificationGroup group = new TimeBlockModificationGroup();
        group.setAnnex(annexService.getOrThrow(annexId));
        group.setReason(dto.reason());
        group.setNote(dto.note());
        groupRepository.save(group);

        if (dto.modifications() != null) {
            dto.modifications().forEach(m -> {
                TimeBlockModification mod = new TimeBlockModification();
                mod.setModificationGroup(group);
                mod.setType(m.type());
                mod.setTimeBlock(timeBlockService.getTimeBlockOrThrow(m.timeBlockId()));
                mod.setDate(m.date());
                modificationRepository.save(mod);
            });
        }

        return toDto(group);
    }

    @Transactional
    public void delete(Integer annexId, Integer groupId) {
        TimeBlockModificationGroup group = getOrThrow(annexId, groupId);
        modificationRepository.findByModificationGroupId(groupId).forEach(modificationRepository::delete);
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
                .map(m -> new ModificationDto(m.getId(), m.getType(), m.getTimeBlock().getId(), m.getDate()))
                .toList();
        return new ModificationGroupDto(g.getId(), g.getAnnex().getId(), g.getReason(), g.getNote(), modifications);
    }
}
