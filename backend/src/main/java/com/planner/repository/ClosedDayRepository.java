package com.planner.repository;

import com.planner.entity.ClosedDay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ClosedDayRepository extends JpaRepository<ClosedDay, Integer> {

    Optional<ClosedDay> findByDate(LocalDate date);

    List<ClosedDay> findByDateBetween(LocalDate from, LocalDate to);
}
