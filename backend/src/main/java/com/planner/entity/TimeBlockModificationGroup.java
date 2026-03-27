package com.planner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "time_block_modification_group")
@Getter
@Setter
public class TimeBlockModificationGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "annex_id", nullable = false)
    private Annex annex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModificationReason reason;

    @Column
    private String note;
}
