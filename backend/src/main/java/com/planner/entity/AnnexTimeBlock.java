package com.planner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "annex_time_block")
@Getter
@Setter
public class AnnexTimeBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "annex_id", nullable = false)
    private Annex annex;

    @ManyToOne
    @JoinColumn(name = "time_block_id", nullable = false)
    private TimeBlock timeBlock;
}
