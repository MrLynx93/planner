package com.planner.repository;

import com.planner.entity.Rule;
import com.planner.entity.RuleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RuleRepository extends JpaRepository<Rule, Integer> {

    @Query("SELECT r FROM Rule r WHERE r.id NOT IN (SELECT ar.rule.id FROM AnnexRule ar)")
    List<Rule> findGlobalRules();

    @Query("SELECT r FROM Rule r WHERE r.id NOT IN (SELECT ar.rule.id FROM AnnexRule ar) AND r.type = :type")
    List<Rule> findGlobalRulesByType(@Param("type") RuleType type);
}
