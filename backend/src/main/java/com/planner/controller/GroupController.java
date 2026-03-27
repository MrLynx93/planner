package com.planner.controller;

import com.planner.dto.GroupDto;
import com.planner.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public List<GroupDto> getAll() {
        return groupService.findAll();
    }

    @GetMapping("/{id}")
    public GroupDto getById(@PathVariable Integer id) {
        return groupService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroupDto create(@RequestBody GroupDto dto) {
        return groupService.create(dto);
    }

    @PutMapping("/{id}")
    public GroupDto update(@PathVariable Integer id, @RequestBody GroupDto dto) {
        return groupService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        groupService.delete(id);
    }
}
