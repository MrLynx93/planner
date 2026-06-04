package com.planner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Entity
@Table(name = "annex_group")
@Getter
@Setter
public class AnnexGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "annex_id", nullable = false)
    private Annex annex;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(name = "schedule_start_time")
    private LocalTime scheduleStartTime;

    @Column(name = "schedule_end_time")
    private LocalTime scheduleEndTime;
}
