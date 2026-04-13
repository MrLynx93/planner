package com.planner.dto;

import com.planner.entity.ViolationType;

import java.time.LocalDate;
import java.time.LocalTime;

public record ViolationDto(
        ViolationType violationType,
        String severity,           // "ERROR" or "WARNING"
        Integer teacherId,
        String teacherName,
        Integer groupId,
        String groupName,
        LocalDate date,            // null for monthly violations
        LocalTime startTime,       // null except for GROUP_UNDERSTAFFED interval violations
        LocalTime endTime,         // null except for GROUP_UNDERSTAFFED interval violations
        Integer ruleValue,
        Integer actualValue
) {}
