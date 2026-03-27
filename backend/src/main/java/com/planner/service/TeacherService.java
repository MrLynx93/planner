package com.planner.service;

import com.planner.dto.TeacherDto;
import com.planner.entity.Teacher;
import com.planner.repository.TeacherRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherRepository teacherRepository;

    public List<TeacherDto> findAll() {
        return teacherRepository.findAll().stream().map(this::toDto).toList();
    }

    public TeacherDto findById(Integer id) {
        return toDto(getOrThrow(id));
    }

    public TeacherDto create(TeacherDto dto) {
        Teacher teacher = new Teacher();
        apply(teacher, dto);
        return toDto(teacherRepository.save(teacher));
    }

    public TeacherDto update(Integer id, TeacherDto dto) {
        Teacher teacher = getOrThrow(id);
        apply(teacher, dto);
        return toDto(teacherRepository.save(teacher));
    }

    public void delete(Integer id) {
        teacherRepository.delete(getOrThrow(id));
    }

    public Teacher getOrThrow(Integer id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found: " + id));
    }

    public TeacherDto toDto(Teacher teacher) {
        return new TeacherDto(teacher.getId(), teacher.getFirstName(), teacher.getLastName());
    }

    private void apply(Teacher teacher, TeacherDto dto) {
        teacher.setFirstName(dto.firstName());
        teacher.setLastName(dto.lastName());
    }
}
