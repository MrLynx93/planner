package com.planner.dto;

import com.planner.entity.ModificationType;

import java.time.LocalDate;
import java.time.LocalTime;

public record ModificationDto(
        Integer id,
        ModificationType type,
        Integer timeBlockId,
        String teacherFirstName,
        String teacherLastName,
        String groupName,
        LocalTime startTime,
        LocalTime endTime,
        LocalDate date
) {}
