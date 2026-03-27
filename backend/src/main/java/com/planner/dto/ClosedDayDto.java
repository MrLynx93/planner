package com.planner.dto;

import java.time.LocalDate;

public record ClosedDayDto(Integer id, LocalDate date, String reason) {}
