package com.planner.controller;

import com.planner.dto.AnnexTeacherDto;
import com.planner.service.AnnexMembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/annexes")
@RequiredArgsConstructor
public class AnnexTeacherController {

    private final AnnexMembershipService membershipService;

    @GetMapping("/{id}/teachers")
    public List<AnnexTeacherDto> getTeachers(@PathVariable Integer id) {
        return membershipService.findTeachersByAnnex(id);
    }

    @PostMapping("/{id}/teachers")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnexTeacherDto addTeacher(@PathVariable Integer id, @RequestBody AnnexTeacherDto dto) {
        return membershipService.addTeacher(id, dto);
    }

    @PutMapping("/{id}/teachers/{annexTeacherId}")
    public AnnexTeacherDto updateTeacher(@PathVariable Integer id,
                                          @PathVariable Integer annexTeacherId,
                                          @RequestBody AnnexTeacherDto dto) {
        return membershipService.updateTeacher(id, annexTeacherId, dto);
    }

    @DeleteMapping("/{id}/teachers/{annexTeacherId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeTeacher(@PathVariable Integer id, @PathVariable Integer annexTeacherId) {
        membershipService.removeTeacher(id, annexTeacherId);
    }
}
