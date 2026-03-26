package com.planner.repository;

import com.planner.entity.TimeBlockModificationGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeBlockModificationGroupRepository extends JpaRepository<TimeBlockModificationGroup, Integer> {

    List<TimeBlockModificationGroup> findByAnnexId(Integer annexId);
}
