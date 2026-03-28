package com.planner.service;

import com.planner.dto.AnnexChildGroupDto;
import com.planner.entity.AnnexChildGroup;
import com.planner.entity.AnnexState;
import com.planner.repository.AnnexChildGroupRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnexChildGroupService {

    private final AnnexChildGroupRepository annexChildGroupRepository;
    private final AnnexService annexService;
    private final ChildService childService;
    private final GroupService groupService;

    public List<AnnexChildGroupDto> findByAnnex(Integer annexId) {
        annexService.getOrThrow(annexId);
        return annexChildGroupRepository.findByAnnexId(annexId).stream()
                .map(this::toDto).toList();
    }

    @Transactional
    public AnnexChildGroupDto assign(Integer annexId, AnnexChildGroupDto dto) {
        var annex = annexService.getOrThrow(annexId);
        if (annex.getState() == AnnexState.FINISHED) {
            throw new IllegalStateException("Cannot modify a FINISHED annex");
        }
        var child = childService.getOrThrow(dto.childId());
        var group = groupService.getOrThrow(dto.groupId());

        AnnexChildGroup acg = annexChildGroupRepository
                .findByAnnexIdAndChildId(annexId, dto.childId())
                .orElseGet(AnnexChildGroup::new);
        acg.setAnnex(annex);
        acg.setChild(child);
        acg.setGroup(group);
        return toDto(annexChildGroupRepository.save(acg));
    }

    public void remove(Integer annexId, Integer annexChildGroupId) {
        AnnexChildGroup acg = annexChildGroupRepository.findById(annexChildGroupId)
                .orElseThrow(() -> new EntityNotFoundException("AnnexChildGroup not found: " + annexChildGroupId));
        if (!acg.getAnnex().getId().equals(annexId)) {
            throw new IllegalArgumentException("AnnexChildGroup does not belong to annex: " + annexId);
        }
        if (acg.getAnnex().getState() == AnnexState.FINISHED) {
            throw new IllegalStateException("Cannot modify a FINISHED annex");
        }
        annexChildGroupRepository.delete(acg);
    }

    private AnnexChildGroupDto toDto(AnnexChildGroup acg) {
        return new AnnexChildGroupDto(
                acg.getId(),
                acg.getAnnex().getId(),
                acg.getChild().getId(),
                acg.getChild().getFirstName(),
                acg.getChild().getLastName(),
                acg.getGroup().getId(),
                acg.getGroup().getName()
        );
    }
}
