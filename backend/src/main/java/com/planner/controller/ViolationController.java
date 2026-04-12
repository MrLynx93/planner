package com.planner.controller;

import com.planner.dto.ViolationDto;
import com.planner.service.ViolationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annexes")
@RequiredArgsConstructor
public class ViolationController {

    private final ViolationService violationService;

    @GetMapping("/{id}/violations")
    public List<ViolationDto> getViolations(
            @PathVariable Integer id,
            @RequestParam int year,
            @RequestParam int month) {
        return violationService.findViolations(id, year, month);
    }
}
