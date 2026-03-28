package com.planner.dto;

public record AnnexChildGroupDto(
        Integer id,
        Integer annexId,
        Integer childId,
        String childFirstName,
        String childLastName,
        Integer groupId,
        String groupName
) {}
