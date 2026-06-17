package com.planner.dto;

import com.planner.entity.ViolationType;

import java.time.LocalTime;

public record TemplateViolationDto(
        ViolationType violationType,
        String severity,
        Integer teacherId,
        String teacherName,
        Integer groupId,
        String groupName,
        String dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        Double ruleValue,
        Double actualValue
) {}
