package com.planner.dto;

import com.planner.entity.ModificationType;

import java.time.LocalDate;
import java.time.LocalTime;

public record CreateModificationItemRequest(
        ModificationType type,
        Integer timeBlockId,   // required for REMOVE; null for ADD
        Integer teacherId,     // required for ADD; null for REMOVE
        Integer groupId,       // required for ADD; null for REMOVE
        LocalDate date,
        LocalTime startTime,   // required for ADD; null for REMOVE
        LocalTime endTime      // required for ADD; null for REMOVE
) {}
