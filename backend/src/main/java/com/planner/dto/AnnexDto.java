package com.planner.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AnnexDto(
        Integer id,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        LocalTime openingTime,
        LocalTime closingTime
) {}
