package com.planner.service;

import com.planner.dto.AnnexRuleDto;
import com.planner.entity.*;
import com.planner.repository.AnnexRuleRepository;
import com.planner.repository.RuleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnexRuleService {

    private final AnnexRuleRepository annexRuleRepository;
    private final RuleRepository ruleRepository;
    private final AnnexService annexService;
    private final GroupService groupService;
    private final TeacherService teacherService;

    public List<AnnexRuleDto> findByAnnex(Integer annexId) {
        return annexRuleRepository.findByAnnexId(annexId).stream().map(this::toDto).toList();
    }

    @Transactional
    public AnnexRuleDto create(Integer annexId, AnnexRuleDto dto) {
        Annex annex = annexService.getOrThrow(annexId);
        Group group = dto.groupId() != null ? groupService.getOrThrow(dto.groupId()) : null;
        Teacher teacher = dto.teacherId() != null ? teacherService.getOrThrow(dto.teacherId()) : null;

        Rule rule = new Rule();
        rule.setType(dto.ruleType());
        rule.setGroup(group);
        rule.setTeacher(teacher);
        rule.setIntValue(dto.intValue());
        ruleRepository.save(rule);

        AnnexRule annexRule = new AnnexRule();
        annexRule.setAnnex(annex);
        annexRule.setRule(rule);
        return toDto(annexRuleRepository.save(annexRule));
    }

    @Transactional
    public void delete(Integer annexId, Integer annexRuleId) {
        AnnexRule annexRule = annexRuleRepository.findById(annexRuleId)
                .filter(ar -> ar.getAnnex().getId().equals(annexId))
                .orElseThrow(() -> new EntityNotFoundException("AnnexRule not found: " + annexRuleId));
        Rule rule = annexRule.getRule();
        annexRuleRepository.delete(annexRule);
        ruleRepository.delete(rule);
    }

    private AnnexRuleDto toDto(AnnexRule ar) {
        Rule r = ar.getRule();
        return new AnnexRuleDto(
                ar.getId(),
                ar.getAnnex().getId(),
                r.getId(),
                r.getType(),
                r.getGroup() != null ? r.getGroup().getId() : null,
                r.getGroup() != null ? r.getGroup().getName() : null,
                r.getTeacher() != null ? r.getTeacher().getId() : null,
                r.getTeacher() != null ? r.getTeacher().getFirstName() : null,
                r.getTeacher() != null ? r.getTeacher().getLastName() : null,
                r.getIntValue()
        );
    }
}
