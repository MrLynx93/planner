package com.planner.controller;

import com.planner.dto.CreateModificationGroupRequest;
import com.planner.dto.ModificationGroupDto;
import com.planner.dto.UpdateModificationGroupRequest;
import com.planner.service.ModificationGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annexes")
@RequiredArgsConstructor
public class AnnexModificationGroupController {

    private final ModificationGroupService modificationGroupService;

    @GetMapping("/{id}/modification-groups")
    public List<ModificationGroupDto> getModificationGroups(@PathVariable Integer id) {
        return modificationGroupService.findByAnnex(id);
    }

    @GetMapping("/{id}/modification-groups/{groupId}")
    public ModificationGroupDto getModificationGroup(@PathVariable Integer id, @PathVariable Integer groupId) {
        return modificationGroupService.findById(id, groupId);
    }

    @PostMapping("/{id}/modification-groups")
    @ResponseStatus(HttpStatus.CREATED)
    public ModificationGroupDto addModificationGroup(@PathVariable Integer id, @RequestBody CreateModificationGroupRequest request) {
        return modificationGroupService.create(id, request);
    }

    @PutMapping("/{id}/modification-groups/{groupId}")
    public ModificationGroupDto updateModificationGroup(
            @PathVariable Integer id,
            @PathVariable Integer groupId,
            @RequestBody UpdateModificationGroupRequest request) {
        return modificationGroupService.update(id, groupId, request);
    }

    @DeleteMapping("/{id}/modification-groups/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeModificationGroup(@PathVariable Integer id, @PathVariable Integer groupId) {
        modificationGroupService.delete(id, groupId);
    }
}
