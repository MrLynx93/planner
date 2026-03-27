package com.planner.dto;

import com.planner.entity.RuleType;

public record AnnexRuleDto(
        Integer id,
        Integer annexId,
        Integer ruleId,
        RuleType ruleType,
        Integer groupId,
        String groupName,
        Integer teacherId,
        String teacherFirstName,
        String teacherLastName,
        Integer intValue
) {}
