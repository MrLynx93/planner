package com.planner.repository;

import com.planner.entity.AnnexRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnexRuleRepository extends JpaRepository<AnnexRule, Integer> {

    List<AnnexRule> findByAnnexId(Integer annexId);
}
