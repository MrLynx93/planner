package com.planner.dto;

import com.planner.entity.ModificationReason;

import java.util.List;

public record CreateModificationGroupRequest(
        String title,
        ModificationReason reason,
        String note,
        List<CreateModificationItemRequest> modifications
) {}
