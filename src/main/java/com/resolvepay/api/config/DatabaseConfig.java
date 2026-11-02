package com.resolvepay.api.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String rawUrl;

    @Value("${spring.datasource.username:postgres}")
    private String rawUsername;

    @Value("${spring.datasource.password:}")
    private String rawPassword;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("DATABASE_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = rawUrl;
        }

        HikariConfig config = new HikariConfig();
        config.setDriverClassName(driverClassName);

        // Detect if URL is in cloud URI format (e.g. postgres:// or postgresql:// from Neon / Render)
        if (dbUrl != null && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(dbUrl);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();

                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                if (query != null && !query.isBlank()) {
                    jdbcUrl += "?" + query;
                } else {
                    jdbcUrl += "?sslmode=require";
                }

                config.setJdbcUrl(jdbcUrl);

                if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    config.setUsername(userInfo[0]);
                    config.setPassword(userInfo[1]);
                    log.info("Successfully parsed cloud credentials for user: {}", userInfo[0]);
                } else {
                    config.setUsername(rawUsername);
                    config.setPassword(rawPassword);
                }

                log.info("Configured Hikari JDBC DataSource for cloud database at host: {}", host);
            } catch (Exception e) {
                log.error("Failed to parse cloud database URI '{}', using fallback: {}", dbUrl, e.getMessage());
                config.setJdbcUrl(dbUrl);
                config.setUsername(rawUsername);
                config.setPassword(rawPassword);
            }
        } else {
            // Standard JDBC or local URL
            config.setJdbcUrl(dbUrl);
            config.setUsername(rawUsername);
            config.setPassword(rawPassword);
        }

        config.setMaximumPoolSize(15);
        config.setMinimumIdle(2);
        config.setConnectionTimeout(10000);
        config.setIdleTimeout(300000);
        config.setMaxLifetime(600000);

        return new HikariDataSource(config);
    }
}
