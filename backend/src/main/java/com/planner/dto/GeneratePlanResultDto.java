package com.planner.dto;

import java.util.List;

public record GeneratePlanResultDto(
        int blocksCreated,
        List<TemplateViolationDto> remainingViolations
) {}
