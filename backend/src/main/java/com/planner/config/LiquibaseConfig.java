package com.planner.config;

import liquibase.integration.spring.SpringLiquibase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

@Configuration
public class LiquibaseConfig {

    @Bean
    @Profile("h2")
    public SpringLiquibase liquibase(DataSource dataSource) {
        SpringLiquibase liquibase = new SpringLiquibase();
        liquibase.setDataSource(dataSource);
        liquibase.setChangeLog("classpath:db/changelog/db.changelog-master.yml");
        liquibase.setDropFirst(true);
        return liquibase;
    }

    @Bean
    @Profile("postgres")
    public SpringLiquibase liquibasePostgres(DataSource dataSource) {
        SpringLiquibase liquibase = new SpringLiquibase();
        liquibase.setDataSource(dataSource);
        liquibase.setChangeLog("classpath:db/changelog/db.changelog-master.yml");
        return liquibase;
    }

    @Bean
    @Profile("h2")
    @DependsOn("liquibase")
    public SpringLiquibase testDataLiquibase(DataSource dataSource) {
        SpringLiquibase liquibase = new SpringLiquibase();
        liquibase.setDataSource(dataSource);
        liquibase.setChangeLog("classpath:db/changelog/db.changelog-test-data.yml");
        return liquibase;
    }
}
