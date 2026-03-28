package com.planner.dto;

import com.planner.entity.AnnexState;

import java.time.LocalDate;
import java.time.LocalTime;

public record AnnexDto(
        Integer id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime scheduleStartTime,
        LocalTime scheduleEndTime,
        AnnexState state
) {}
