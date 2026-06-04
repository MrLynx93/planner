package com.planner.dto;

import java.time.LocalTime;

public record GroupDto(
        Integer id,
        String name,
        LocalTime scheduleStartTime,
        LocalTime scheduleEndTime
) {}
