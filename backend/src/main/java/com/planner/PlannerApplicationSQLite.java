package com.planner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PlannerApplicationSQLite {

    public static void main(String[] args) {
        System.setProperty("spring.profiles.active", "sqlite");
        SpringApplication.run(PlannerApplicationSQLite.class, args);
    }
}
