package com.planner.dto;

import com.planner.entity.ModificationType;

import java.time.LocalDate;

public record ModificationDto(
        Integer id,
        ModificationType type,
        Integer timeBlockId,
        LocalDate date
) {}
