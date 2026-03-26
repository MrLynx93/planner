package com.planner.repository;

import com.planner.entity.AnnexGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnexGroupRepository extends JpaRepository<AnnexGroup, Integer> {

    List<AnnexGroup> findByAnnexId(Integer annexId);
}
