package com.planner.dto;

import com.planner.entity.TimeBlockType;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

public record AnnexTimeBlockDto(
        Integer id,
        Integer annexId,
        Integer timeBlockId,
        TimeBlockType type,
        Integer teacherId,
        String teacherFirstName,
        String teacherLastName,
        Integer groupId,
        String groupName,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        LocalDate date    // null for TEMPLATE blocks; set for MODIFICATION blocks in effective schedule
) {}
