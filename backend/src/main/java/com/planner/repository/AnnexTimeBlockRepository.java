package com.planner.repository;

import com.planner.entity.AnnexTimeBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnexTimeBlockRepository extends JpaRepository<AnnexTimeBlock, Integer> {

    List<AnnexTimeBlock> findByAnnexId(Integer annexId);
}
