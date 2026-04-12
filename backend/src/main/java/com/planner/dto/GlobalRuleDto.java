package com.planner.dto;

import com.planner.entity.RuleType;

public record GlobalRuleDto(
        Integer id,
        RuleType ruleType,
        Integer groupId,
        String groupName,
        Integer teacherId,
        String teacherFirstName,
        String teacherLastName,
        Integer intValue
) {}
