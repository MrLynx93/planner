package com.planner.controller;

import com.planner.dto.TeacherDto;
import com.planner.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @GetMapping
    public List<TeacherDto> getAll() {
        return teacherService.findAll();
    }

    @GetMapping("/{id}")
    public TeacherDto getById(@PathVariable Integer id) {
        return teacherService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeacherDto create(@RequestBody TeacherDto dto) {
        return teacherService.create(dto);
    }

    @PutMapping("/{id}")
    public TeacherDto update(@PathVariable Integer id, @RequestBody TeacherDto dto) {
        return teacherService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        teacherService.delete(id);
    }
}
