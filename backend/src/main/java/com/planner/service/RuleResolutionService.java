package com.planner.service;

import com.planner.entity.AnnexRule;
import com.planner.entity.Rule;
import com.planner.entity.RuleType;
import com.planner.repository.AnnexRuleRepository;
import com.planner.repository.RuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Resolves the effective rule value for a teacher or group in a given annex.
 * Priority (highest to lowest):
 * 1. AnnexRule scoped to this annex AND this teacher/group
 * 2. AnnexRule scoped to this annex with no teacher/group (annex default)
 * 3. GlobalRule (Rule with no AnnexRule entry) with no teacher/group
 */
@Service
@RequiredArgsConstructor
public class RuleResolutionService {

    private final AnnexRuleRepository annexRuleRepository;
    private final RuleRepository ruleRepository;

    public Double resolveForTeacher(Integer annexId, Integer teacherId, RuleType type) {
        List<AnnexRule> annexRules = annexRuleRepository.findByAnnexId(annexId);

        // 1. Annex-teacher specific
        Double specific = annexRules.stream()
                .map(AnnexRule::getRule)
                .filter(r -> r.getType() == type
                        && r.getTeacher() != null
                        && r.getTeacher().getId().equals(teacherId))
                .map(Rule::getIntValue)
                .findFirst()
                .orElse(null);
        if (specific != null) return specific;

        // 2. Annex default (no teacher)
        Double annexDefault = annexRules.stream()
                .map(AnnexRule::getRule)
                .filter(r -> r.getType() == type && r.getTeacher() == null && r.getGroup() == null)
                .map(Rule::getIntValue)
                .findFirst()
                .orElse(null);
        if (annexDefault != null) return annexDefault;

        // 3. Global default
        return ruleRepository.findGlobalRulesByType(type).stream()
                .filter(r -> r.getTeacher() == null && r.getGroup() == null)
                .map(Rule::getIntValue)
                .findFirst()
                .orElse(null);
    }

    public Double resolveForGroup(Integer annexId, Integer groupId, RuleType type) {
        List<AnnexRule> annexRules = annexRuleRepository.findByAnnexId(annexId);

        // 1. Annex-group specific
        Double specific = annexRules.stream()
                .map(AnnexRule::getRule)
                .filter(r -> r.getType() == type
                        && r.getGroup() != null
                        && r.getGroup().getId().equals(groupId))
                .map(Rule::getIntValue)
                .findFirst()
                .orElse(null);
        if (specific != null) return specific;

        // 2. Annex default (no group)
        Double annexDefault = annexRules.stream()
                .map(AnnexRule::getRule)
                .filter(r -> r.getType() == type && r.getGroup() == null && r.getTeacher() == null)
                .map(Rule::getIntValue)
                .findFirst()
                .orElse(null);
        if (annexDefault != null) return annexDefault;

        // 3. Global default
        return ruleRepository.findGlobalRulesByType(type).stream()
                .filter(r -> r.getGroup() == null && r.getTeacher() == null)
                .map(Rule::getIntValue)
                .findFirst()
                .orElse(null);
    }
}
