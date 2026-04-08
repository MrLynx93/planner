package com.planner.service;

import com.planner.dto.AnnexTimeBlockDto;
import com.planner.entity.*;
import com.planner.repository.AnnexTimeBlockRepository;
import com.planner.repository.TimeBlockRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnexTimeBlockService {

    private final AnnexTimeBlockRepository annexTimeBlockRepository;
    private final TimeBlockRepository timeBlockRepository;
    private final AnnexService annexService;
    private final TeacherService teacherService;
    private final GroupService groupService;

    public List<AnnexTimeBlockDto> findByAnnex(Integer annexId) {
        return annexTimeBlockRepository.findByAnnexId(annexId).stream().map(this::toDto).toList();
    }

    @Transactional
    public AnnexTimeBlockDto create(Integer annexId, AnnexTimeBlockDto dto) {
        Annex annex = annexService.getOrThrow(annexId);
        Teacher teacher = teacherService.getOrThrow(dto.teacherId());
        Group group = groupService.getOrThrow(dto.groupId());

        TimeBlock timeBlock = new TimeBlock();
        timeBlock.setType(dto.type());
        timeBlock.setTeacher(teacher);
        timeBlock.setGroup(group);
        timeBlock.setDayOfWeek(dto.dayOfWeek());
        timeBlock.setStartTime(dto.startTime());
        timeBlock.setEndTime(dto.endTime());
        timeBlockRepository.save(timeBlock);

        AnnexTimeBlock atb = new AnnexTimeBlock();
        atb.setAnnex(annex);
        atb.setTimeBlock(timeBlock);
        return toDto(annexTimeBlockRepository.save(atb));
    }

    @Transactional
    public void delete(Integer annexId, Integer annexTimeBlockId) {
        AnnexTimeBlock atb = annexTimeBlockRepository.findById(annexTimeBlockId)
                .filter(a -> a.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("AnnexTimeBlock not found: " + annexTimeBlockId));
        TimeBlock timeBlock = atb.getTimeBlock();
        annexTimeBlockRepository.delete(atb);
        timeBlockRepository.delete(timeBlock);
    }

    @Transactional
    public AnnexTimeBlockDto update(Integer annexId, Integer annexTimeBlockId, AnnexTimeBlockDto dto) {
        AnnexTimeBlock atb = annexTimeBlockRepository.findById(annexTimeBlockId)
                .filter(a -> a.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("AnnexTimeBlock not found: " + annexTimeBlockId));
        TimeBlock timeBlock = atb.getTimeBlock();
        timeBlock.setStartTime(dto.startTime());
        timeBlock.setEndTime(dto.endTime());
        timeBlockRepository.save(timeBlock);
        return toDto(atb);
    }

    public TimeBlock getTimeBlockOrThrow(Integer id) {
        return timeBlockRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TimeBlock not found: " + id));
    }

    private AnnexTimeBlockDto toDto(AnnexTimeBlock atb) {
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
                null
        );
    }
}
