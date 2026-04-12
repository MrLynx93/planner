package com.planner.service;

import com.planner.dto.GlobalRuleDto;
import com.planner.entity.Group;
import com.planner.entity.Rule;
import com.planner.entity.Teacher;
import com.planner.repository.RuleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GlobalRuleService {

    private final RuleRepository ruleRepository;
    private final GroupService groupService;
    private final TeacherService teacherService;

    public List<GlobalRuleDto> findAll() {
        return ruleRepository.findGlobalRules().stream().map(this::toDto).toList();
    }

    @Transactional
    public GlobalRuleDto create(GlobalRuleDto dto) {
        Group group = dto.groupId() != null ? groupService.getOrThrow(dto.groupId()) : null;
        Teacher teacher = dto.teacherId() != null ? teacherService.getOrThrow(dto.teacherId()) : null;

        Rule rule = new Rule();
        rule.setType(dto.ruleType());
        rule.setGroup(group);
        rule.setTeacher(teacher);
        rule.setIntValue(dto.intValue());
        return toDto(ruleRepository.save(rule));
    }

    @Transactional
    public void delete(Integer id) {
        Rule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Global rule not found: " + id));
        ruleRepository.delete(rule);
    }

    public GlobalRuleDto toDto(Rule rule) {
        return new GlobalRuleDto(
                rule.getId(),
                rule.getType(),
                rule.getGroup() != null ? rule.getGroup().getId() : null,
                rule.getGroup() != null ? rule.getGroup().getName() : null,
                rule.getTeacher() != null ? rule.getTeacher().getId() : null,
                rule.getTeacher() != null ? rule.getTeacher().getFirstName() : null,
                rule.getTeacher() != null ? rule.getTeacher().getLastName() : null,
                rule.getIntValue()
        );
    }
}
