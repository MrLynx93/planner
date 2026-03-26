package com.planner.repository;

import com.planner.entity.ChildGroupAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChildGroupAssignmentRepository extends JpaRepository<ChildGroupAssignment, Integer> {

    List<ChildGroupAssignment> findByChildId(Integer childId);

    Optional<ChildGroupAssignment> findByChildIdAndToDateIsNull(Integer childId);
}
