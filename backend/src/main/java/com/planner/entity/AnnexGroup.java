package com.planner.entity;

import com.planner.config.LocalTimeConverter;
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

    @Convert(converter = LocalTimeConverter.class)
    @Column(name = "schedule_start_time")
    private LocalTime scheduleStartTime;

    @Convert(converter = LocalTimeConverter.class)
    @Column(name = "schedule_end_time")
    private LocalTime scheduleEndTime;
}
