package com.planner.dto;

import java.time.LocalTime;

public record AnnexGroupDto(
        Integer id,
        Integer annexId,
        Integer groupId,
        String groupName,
        LocalTime scheduleStartTime,
        LocalTime scheduleEndTime,
        LocalTime effectiveScheduleStartTime,
        LocalTime effectiveScheduleEndTime
) {}
