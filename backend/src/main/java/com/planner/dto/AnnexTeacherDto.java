package com.planner.dto;

public record AnnexTeacherDto(
        Integer id,
        Integer annexId,
        Integer teacherId,
        String firstName,
        String lastName
) {}
