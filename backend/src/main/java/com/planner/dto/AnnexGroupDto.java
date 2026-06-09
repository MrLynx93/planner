package com.planner.dto;

import com.planner.entity.GroupTag;

import java.time.LocalTime;
import java.util.Set;

public record AnnexGroupDto(
        Integer id,
        Integer annexId,
        Integer groupId,
        String groupName,
        LocalTime scheduleStartTime,
        LocalTime scheduleEndTime,
        LocalTime effectiveScheduleStartTime,
        LocalTime effectiveScheduleEndTime,
        Set<GroupTag> tags
) {}
