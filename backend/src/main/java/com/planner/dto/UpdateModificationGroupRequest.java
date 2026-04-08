package com.planner.dto;

import com.planner.entity.ModificationReason;

public record UpdateModificationGroupRequest(
        String title,
        ModificationReason reason,
        String note
) {}
