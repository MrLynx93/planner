package com.planner.controller;

import com.planner.dto.AnnexTimeBlockDto;
import com.planner.entity.*;
import com.planner.repository.AnnexTimeBlockRepository;
import com.planner.repository.TimeBlockModificationRepository;
import com.planner.service.AnnexService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/annexes")
@RequiredArgsConstructor
public class ScheduleController {

    private final AnnexService annexService;
    private final AnnexTimeBlockRepository annexTimeBlockRepository;
    private final TimeBlockModificationRepository modificationRepository;

    /**
     * Returns the effective schedule for the given week.
     * Template blocks are included unless cancelled by a REMOVE modification for that date.
     * ADD modification blocks are included as MODIFICATION-type entries with a specific date.
     */
    @GetMapping("/{id}/schedule")
    public List<AnnexTimeBlockDto> getEffectiveSchedule(
            @PathVariable Integer id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {

        annexService.getOrThrow(id); // validate annex exists

        LocalDate weekEnd = weekStart.plusDays(4);

        // Load all template blocks for the annex
        List<AnnexTimeBlock> templateBlocks = annexTimeBlockRepository.findByAnnexId(id);

        // Load all modifications in the week range
        List<TimeBlockModification> modifications =
                modificationRepository.findByModificationGroupAnnexIdAndDateBetween(id, weekStart, weekEnd);

        // Build a set of (timeBlockId, date) pairs that are REMOVE'd this week
        Set<String> removedKeys = modifications.stream()
                .filter(m -> m.getType() == ModificationType.REMOVE)
                .map(m -> m.getTimeBlock().getId() + "_" + m.getDate())
                .collect(Collectors.toSet());

        List<AnnexTimeBlockDto> result = new ArrayList<>();

        // Include template blocks, skipping any that are REMOVE'd for a date in this week
        for (AnnexTimeBlock atb : templateBlocks) {
            TimeBlock tb = atb.getTimeBlock();
            DayOfWeek blockDay = tb.getDayOfWeek();

            // Find the date in this week matching the block's day of week
            LocalDate matchingDate = weekStart;
            while (matchingDate.getDayOfWeek() != blockDay && !matchingDate.isAfter(weekEnd)) {
                matchingDate = matchingDate.plusDays(1);
            }
            if (matchingDate.isAfter(weekEnd)) {
                // Block's day doesn't fall in this week range (e.g. SATURDAY in a Mon-Fri week)
                result.add(toDto(atb, null));
                continue;
            }

            String key = tb.getId() + "_" + matchingDate;
            if (!removedKeys.contains(key)) {
                result.add(toDto(atb, null));
            }
        }

        // Include ADD modification blocks
        modifications.stream()
                .filter(m -> m.getType() == ModificationType.ADD)
                .forEach(m -> {
                    TimeBlock tb = m.getTimeBlock();
                    result.add(new AnnexTimeBlockDto(
                            m.getId(),
                            id,
                            tb.getId(),
                            TimeBlockType.MODIFICATION,
                            tb.getTeacher().getId(),
                            tb.getTeacher().getFirstName(),
                            tb.getTeacher().getLastName(),
                            tb.getGroup().getId(),
                            tb.getGroup().getName(),
                            m.getDate().getDayOfWeek(),
                            tb.getStartTime(),
                            tb.getEndTime(),
                            m.getDate()
                    ));
                });

        return result;
    }

    private AnnexTimeBlockDto toDto(AnnexTimeBlock atb, LocalDate date) {
        TimeBlock tb = atb.getTimeBlock();
        return new AnnexTimeBlockDto(
                atb.getId(),
                atb.getAnnex().getId(),
                tb.getId(),
                tb.getType(),
                tb.getTeacher().getId(),
                tb.getTeacher().getFirstName(),
                tb.getTeacher().getLastName(),
                tb.getGroup().getId(),
                tb.getGroup().getName(),
                tb.getDayOfWeek(),
                tb.getStartTime(),
                tb.getEndTime(),
                date
        );
    }
}
