package com.planner.service;

import com.planner.dto.GroupDto;
import com.planner.entity.Group;
import com.planner.repository.GroupRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;

    public List<GroupDto> findAll() {
        return groupRepository.findAll().stream().map(this::toDto).toList();
    }

    public GroupDto findById(Integer id) {
        return toDto(getOrThrow(id));
    }

    public GroupDto create(GroupDto dto) {
        Group group = new Group();
        group.setName(dto.name());
        return toDto(groupRepository.save(group));
    }

    public GroupDto update(Integer id, GroupDto dto) {
        Group group = getOrThrow(id);
        group.setName(dto.name());
        return toDto(groupRepository.save(group));
    }

    public void delete(Integer id) {
        groupRepository.delete(getOrThrow(id));
    }

    public Group getOrThrow(Integer id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Group not found: " + id));
    }

    public GroupDto toDto(Group group) {
        return new GroupDto(group.getId(), group.getName());
    }
}
