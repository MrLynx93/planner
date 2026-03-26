package com.planner.repository;

import com.planner.entity.TimeBlockModification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TimeBlockModificationRepository extends JpaRepository<TimeBlockModification, Integer> {

    List<TimeBlockModification> findByModificationGroupId(Integer modificationGroupId);

    List<TimeBlockModification> findByModificationGroupAnnexIdAndDateBetween(Integer annexId, LocalDate from, LocalDate to);
}
