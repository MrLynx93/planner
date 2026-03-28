package com.planner.controller;

import com.planner.dto.AnnexDto;
import com.planner.service.AnnexService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annexes")
@RequiredArgsConstructor
public class AnnexController {

    private final AnnexService annexService;

    @GetMapping
    public List<AnnexDto> getAll() {
        return annexService.findAll();
    }

    @GetMapping("/{id}")
    public AnnexDto getById(@PathVariable Integer id) {
        return annexService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnnexDto create(@RequestBody AnnexDto dto) {
        return annexService.create(dto);
    }

    @PutMapping("/{id}")
    public AnnexDto update(@PathVariable Integer id, @RequestBody AnnexDto dto) {
        return annexService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        annexService.delete(id);
    }

    @PostMapping("/{id}/activate")
    public AnnexDto activate(@PathVariable Integer id) {
        return annexService.activate(id);
    }
}
