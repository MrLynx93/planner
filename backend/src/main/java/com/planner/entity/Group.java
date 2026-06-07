package com.planner.entity;

import com.planner.config.LocalTimeConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Entity
@Table(name = "groups")
@Getter
@Setter
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Convert(converter = LocalTimeConverter.class)
    @Column(name = "schedule_start_time")
    private LocalTime scheduleStartTime;

    @Convert(converter = LocalTimeConverter.class)
    @Column(name = "schedule_end_time")
    private LocalTime scheduleEndTime;
}
