package com.planner.repository;

import com.planner.entity.AnnexChildGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnnexChildGroupRepository extends JpaRepository<AnnexChildGroup, Integer> {
    List<AnnexChildGroup> findByAnnexId(Integer annexId);
    Optional<AnnexChildGroup> findByAnnexIdAndChildId(Integer annexId, Integer childId);
}
