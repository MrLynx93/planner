package com.planner.entity;

import com.planner.entity.enums.ModificationType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "time_block_modification")
@Getter
@Setter
public class TimeBlockModification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "modification_group_id", nullable = false)
    private TimeBlockModificationGroup modificationGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModificationType type;

    @ManyToOne
    @JoinColumn(name = "time_block_id", nullable = false)
    private TimeBlock timeBlock;

    @Column(nullable = false)
    private LocalDate date;
}
