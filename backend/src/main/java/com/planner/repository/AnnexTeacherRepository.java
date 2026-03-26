package com.planner.repository;

import com.planner.entity.AnnexTeacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnnexTeacherRepository extends JpaRepository<AnnexTeacher, Integer> {

    List<AnnexTeacher> findByAnnexId(Integer annexId);

    Optional<AnnexTeacher> findByAnnexIdAndTeacherId(Integer annexId, Integer teacherId);
}
