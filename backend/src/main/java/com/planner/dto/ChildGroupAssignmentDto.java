package com.planner.dto;

import java.time.LocalDate;

public record ChildGroupAssignmentDto(
        Integer id,
        Integer childId,
        String childFirstName,
        String childLastName,
        Integer groupId,
        String groupName,
        LocalDate fromDate,
        LocalDate toDate
) {}
