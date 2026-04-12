package com.planner.controller;

import com.planner.dto.GlobalRuleDto;
import com.planner.service.GlobalRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/global-rules")
@RequiredArgsConstructor
public class GlobalRuleController {

    private final GlobalRuleService globalRuleService;

    @GetMapping
    public List<GlobalRuleDto> getAll() {
        return globalRuleService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GlobalRuleDto create(@RequestBody GlobalRuleDto dto) {
        return globalRuleService.create(dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        globalRuleService.delete(id);
    }
}
