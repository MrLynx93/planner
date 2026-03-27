package com.planner.service;

import com.planner.dto.ChildDto;
import com.planner.dto.ChildGroupAssignmentDto;
import com.planner.entity.Child;
import com.planner.entity.ChildGroupAssignment;
import com.planner.entity.Group;
import com.planner.repository.ChildGroupAssignmentRepository;
import com.planner.repository.ChildRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository childRepository;
    private final ChildGroupAssignmentRepository assignmentRepository;
    private final GroupService groupService;

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

    public List<ChildGroupAssignmentDto> getAssignments(Integer childId) {
        getOrThrow(childId);
        return assignmentRepository.findByChildId(childId).stream()
                .map(this::toAssignmentDto).toList();
    }

    @Transactional
    public ChildGroupAssignmentDto assign(Integer childId, ChildGroupAssignmentDto dto) {
        Child child = getOrThrow(childId);
        Group group = groupService.getOrThrow(dto.groupId());

        assignmentRepository.findByChildIdAndToDateIsNull(childId)
                .ifPresent(a -> {
                    a.setToDate(dto.fromDate().minusDays(1));
                    assignmentRepository.save(a);
                });

        ChildGroupAssignment assignment = new ChildGroupAssignment();
        assignment.setChild(child);
        assignment.setGroup(group);
        assignment.setFromDate(dto.fromDate());
        return toAssignmentDto(assignmentRepository.save(assignment));
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

    private ChildGroupAssignmentDto toAssignmentDto(ChildGroupAssignment a) {
        return new ChildGroupAssignmentDto(
                a.getId(),
                a.getChild().getId(),
                a.getChild().getFirstName(),
                a.getChild().getLastName(),
                a.getGroup().getId(),
                a.getGroup().getName(),
                a.getFromDate(),
                a.getToDate()
        );
    }
}
