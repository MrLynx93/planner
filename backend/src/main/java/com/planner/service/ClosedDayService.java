package com.planner.service;

import com.planner.dto.ClosedDayDto;
import com.planner.entity.ClosedDay;
import com.planner.repository.ClosedDayRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClosedDayService {

    private final ClosedDayRepository closedDayRepository;

    public List<ClosedDayDto> findAll() {
        return closedDayRepository.findAll().stream().map(this::toDto).toList();
    }

    public ClosedDayDto create(ClosedDayDto dto) {
        ClosedDay day = new ClosedDay();
        day.setDate(dto.date());
        day.setReason(dto.reason());
        return toDto(closedDayRepository.save(day));
    }

    public void delete(Integer id) {
        closedDayRepository.delete(closedDayRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ClosedDay not found: " + id)));
    }

    private ClosedDayDto toDto(ClosedDay day) {
        return new ClosedDayDto(day.getId(), day.getDate(), day.getReason());
    }
}
