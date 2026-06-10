package com.planner.controller;

import com.planner.dto.AnnexTimeBlockDto;
import com.planner.dto.GeneratePlanResultDto;
import com.planner.service.AnnexTimeBlockService;
import com.planner.service.PlanGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annexes")
@RequiredArgsConstructor
public class AnnexTimeBlockController {

    private final AnnexTimeBlockService timeBlockService;
    private final PlanGeneratorService planGeneratorService;

    @GetMapping("/{id}/time-blocks")
    public List<AnnexTimeBlockDto> getTimeBlocks(@PathVariable Integer id) {
        return timeBlockService.findByAnnex(id);
    }

    @PostMapping("/{id}/time-blocks")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnexTimeBlockDto addTimeBlock(@PathVariable Integer id, @RequestBody AnnexTimeBlockDto dto) {
        return timeBlockService.create(id, dto);
    }

    @PutMapping("/{id}/time-blocks/{annexTimeBlockId}")
    public AnnexTimeBlockDto updateTimeBlock(
            @PathVariable Integer id,
            @PathVariable Integer annexTimeBlockId,
            @RequestBody AnnexTimeBlockDto dto) {
        return timeBlockService.update(id, annexTimeBlockId, dto);
    }

    @DeleteMapping("/{id}/time-blocks/{annexTimeBlockId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeTimeBlock(@PathVariable Integer id, @PathVariable Integer annexTimeBlockId) {
        timeBlockService.delete(id, annexTimeBlockId);
    }

    @PostMapping("/{id}/generate-plan")
    public GeneratePlanResultDto generatePlan(@PathVariable Integer id) {
        return planGeneratorService.generate(id);
    }
}
