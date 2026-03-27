package com.planner.repository;

import com.planner.entity.TimeBlock;
import com.planner.entity.TimeBlockType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeBlockRepository extends JpaRepository<TimeBlock, Integer> {

    List<TimeBlock> findByType(TimeBlockType type);

    List<TimeBlock> findByTeacherId(Integer teacherId);
}
