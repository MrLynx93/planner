package com.planner.service;

import com.planner.dto.GlobalRuleDto;
import com.planner.dto.RuleWithSourceDto;
import com.planner.entity.Group;
import com.planner.entity.Rule;
import com.planner.entity.Teacher;
import com.planner.repository.AnnexRuleRepository;
import com.planner.repository.RuleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GlobalRuleService {

    private final RuleRepository ruleRepository;
    private final AnnexRuleRepository annexRuleRepository;
    private final GroupService groupService;
    private final TeacherService teacherService;

    public List<GlobalRuleDto> findAll() {
        return ruleRepository.findGlobalRules().stream().map(this::toDto).toList();
    }

    public List<RuleWithSourceDto> findAllWithSource() {
        List<RuleWithSourceDto> result = new ArrayList<>();
        ruleRepository.findGlobalRules().forEach(rule -> result.add(globalToRuleWithSourceDto(rule)));
        annexRuleRepository.findAll().forEach(ar -> result.add(new RuleWithSourceDto(
                ar.getRule().getId(),
                ar.getId(),
                ar.getAnnex().getId(),
                ar.getAnnex().getName(),
                ar.getRule().getType(),
                ar.getRule().getTeacher() != null ? ar.getRule().getTeacher().getId() : null,
                ar.getRule().getTeacher() != null ? ar.getRule().getTeacher().getFirstName() : null,
                ar.getRule().getTeacher() != null ? ar.getRule().getTeacher().getLastName() : null,
                ar.getRule().getGroup() != null ? ar.getRule().getGroup().getId() : null,
                ar.getRule().getGroup() != null ? ar.getRule().getGroup().getName() : null,
                ar.getRule().getIntValue()
        )));
        return result;
    }

    private RuleWithSourceDto globalToRuleWithSourceDto(Rule rule) {
        return new RuleWithSourceDto(
                rule.getId(), null, null, null,
                rule.getType(),
                rule.getTeacher() != null ? rule.getTeacher().getId() : null,
                rule.getTeacher() != null ? rule.getTeacher().getFirstName() : null,
                rule.getTeacher() != null ? rule.getTeacher().getLastName() : null,
                rule.getGroup() != null ? rule.getGroup().getId() : null,
                rule.getGroup() != null ? rule.getGroup().getName() : null,
                rule.getIntValue()
        );
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
    public GlobalRuleDto update(Integer id, double intValue) {
        Rule rule = ruleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Global rule not found: " + id));
        rule.setIntValue(intValue);
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
