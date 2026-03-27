package com.planner.controller;

import com.planner.dto.AnnexRuleDto;
import com.planner.service.AnnexRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annexes")
@RequiredArgsConstructor
public class AnnexRuleController {

    private final AnnexRuleService ruleService;

    @GetMapping("/{id}/rules")
    public List<AnnexRuleDto> getRules(@PathVariable Integer id) {
        return ruleService.findByAnnex(id);
    }

    @PostMapping("/{id}/rules")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnexRuleDto addRule(@PathVariable Integer id, @RequestBody AnnexRuleDto dto) {
        return ruleService.create(id, dto);
    }

    @DeleteMapping("/{id}/rules/{annexRuleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeRule(@PathVariable Integer id, @PathVariable Integer annexRuleId) {
        ruleService.delete(id, annexRuleId);
    }
}
