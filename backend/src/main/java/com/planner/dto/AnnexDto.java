package com.planner.dto;

import com.planner.entity.AnnexState;

import java.time.LocalDate;

public record AnnexDto(
        Integer id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        AnnexState state
) {}
