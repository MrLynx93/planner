package com.planner.controller;

import com.planner.dto.ClosedDayDto;
import com.planner.service.ClosedDayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/closed-days")
@RequiredArgsConstructor
public class ClosedDayController {

    private final ClosedDayService closedDayService;

    @GetMapping
    public List<ClosedDayDto> getAll() {
        return closedDayService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClosedDayDto create(@RequestBody ClosedDayDto dto) {
        return closedDayService.create(dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        closedDayService.delete(id);
    }
}
