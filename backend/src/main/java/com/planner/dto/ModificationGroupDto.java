package com.planner.dto;

import com.planner.entity.ModificationReason;

import java.util.List;

public record ModificationGroupDto(
        Integer id,
        Integer annexId,
        ModificationReason reason,
        String note,
        List<ModificationDto> modifications
) {}
