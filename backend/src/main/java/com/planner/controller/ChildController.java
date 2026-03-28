package com.planner.controller;

import com.planner.dto.ChildDto;
import com.planner.service.ChildService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/children")
@RequiredArgsConstructor
public class ChildController {

    private final ChildService childService;

    @GetMapping
    public List<ChildDto> getAll() {
        return childService.findAll();
    }

    @GetMapping("/{id}")
    public ChildDto getById(@PathVariable Integer id) {
        return childService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChildDto create(@RequestBody ChildDto dto) {
        return childService.create(dto);
    }

    @PutMapping("/{id}")
    public ChildDto update(@PathVariable Integer id, @RequestBody ChildDto dto) {
        return childService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        childService.delete(id);
    }
}
