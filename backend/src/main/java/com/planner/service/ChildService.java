package com.planner.service;

import com.planner.dto.ChildDto;
import com.planner.entity.Child;
import com.planner.repository.ChildRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository childRepository;

    public List<ChildDto> findAll() {
        return childRepository.findAll().stream().map(this::toDto).toList();
    }

    public ChildDto findById(Integer id) {
        return toDto(getOrThrow(id));
    }

    public ChildDto create(ChildDto dto) {
        Child child = new Child();
        apply(child, dto);
        return toDto(childRepository.save(child));
    }

    public ChildDto update(Integer id, ChildDto dto) {
        Child child = getOrThrow(id);
        apply(child, dto);
        return toDto(childRepository.save(child));
    }

    public void delete(Integer id) {
        childRepository.delete(getOrThrow(id));
    }

    public Child getOrThrow(Integer id) {
        return childRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Child not found: " + id));
    }

    private void apply(Child child, ChildDto dto) {
        child.setFirstName(dto.firstName());
        child.setLastName(dto.lastName());
    }

    private ChildDto toDto(Child child) {
        return new ChildDto(child.getId(), child.getFirstName(), child.getLastName());
    }
}
