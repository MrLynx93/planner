package com.planner.dto;

import com.planner.entity.ViolationType;

import java.time.LocalDate;

public record ViolationDto(
        ViolationType violationType,
        String severity,           // "ERROR" or "WARNING"
        Integer teacherId,
        String teacherName,
        Integer groupId,
        String groupName,
        LocalDate date,            // null for monthly violations
        Integer ruleValue,
        Integer actualValue,
        String message
) {}
