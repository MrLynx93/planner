package com.planner.controller;

import com.planner.dto.AnnexChildGroupDto;
import com.planner.service.AnnexChildGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annexes/{annexId}/children")
@RequiredArgsConstructor
public class AnnexChildGroupController {

    private final AnnexChildGroupService annexChildGroupService;

    @GetMapping
    public List<AnnexChildGroupDto> getAll(@PathVariable Integer annexId) {
        return annexChildGroupService.findByAnnex(annexId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnnexChildGroupDto assign(@PathVariable Integer annexId, @RequestBody AnnexChildGroupDto dto) {
        return annexChildGroupService.assign(annexId, dto);
    }

    @DeleteMapping("/{annexChildGroupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Integer annexId, @PathVariable Integer annexChildGroupId) {
        annexChildGroupService.remove(annexId, annexChildGroupId);
    }
}
