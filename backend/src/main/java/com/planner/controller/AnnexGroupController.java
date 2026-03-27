package com.planner.controller;

import com.planner.dto.AnnexGroupDto;
import com.planner.service.AnnexMembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annexes")
@RequiredArgsConstructor
public class AnnexGroupController {

    private final AnnexMembershipService membershipService;

    @GetMapping("/{id}/groups")
    public List<AnnexGroupDto> getGroups(@PathVariable Integer id) {
        return membershipService.findGroupsByAnnex(id);
    }

    @PostMapping("/{id}/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnexGroupDto addGroup(@PathVariable Integer id, @RequestBody AnnexGroupDto dto) {
        return membershipService.addGroup(id, dto);
    }

    @DeleteMapping("/{id}/groups/{annexGroupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeGroup(@PathVariable Integer id, @PathVariable Integer annexGroupId) {
        membershipService.removeGroup(id, annexGroupId);
    }
}
