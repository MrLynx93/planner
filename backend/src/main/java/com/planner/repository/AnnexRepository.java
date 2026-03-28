package com.planner.repository;

import com.planner.entity.Annex;
import com.planner.entity.AnnexState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnnexRepository extends JpaRepository<Annex, Integer> {
    Optional<Annex> findByState(AnnexState state);
    boolean existsByState(AnnexState state);
}
