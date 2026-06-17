package com.planner.dto;

import com.planner.entity.RuleType;

public record RuleWithSourceDto(
        Integer ruleId,
        Integer annexRuleId,
        Integer annexId,
        String annexName,
        RuleType ruleType,
        Integer teacherId,
        String teacherFirstName,
        String teacherLastName,
        Integer groupId,
        String groupName,
        double intValue
) {}
