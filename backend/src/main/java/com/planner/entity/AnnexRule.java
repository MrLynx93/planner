package com.planner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "annex_rule")
@Getter
@Setter
public class AnnexRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "annex_id", nullable = false)
    private Annex annex;

    @ManyToOne
    @JoinColumn(name = "rule_id", nullable = false)
    private Rule rule;
}
