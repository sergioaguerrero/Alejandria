package com.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;

@Configuration
public class AppConfig {

    @Bean
    public static BeanPostProcessor oracleParallelDmlDisabler() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                if (bean instanceof HikariDataSource hikari) {
                    String jdbcUrl = hikari.getJdbcUrl();
                    String driver = hikari.getDriverClassName();
                    boolean isOracle = (jdbcUrl != null && jdbcUrl.startsWith("jdbc:oracle:"))
                            || (driver != null && driver.contains("oracle"));
                    if (isOracle && (hikari.getConnectionInitSql() == null || hikari.getConnectionInitSql().isBlank())) {
                        // Evita ORA-12860 en Oracle ADB (_high/_medium) al ejecutar DELETE con cascadas FK.
                        hikari.setConnectionInitSql("ALTER SESSION DISABLE PARALLEL DML");
                    }
                }
                return bean;
            }
        };
    }

    @Bean
    public RestTemplate restTemplate(@Value("${ia.timeout:60000}") int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Math.min(15000, Math.max(3000, timeoutMs)));
        factory.setReadTimeout(Math.max(5000, timeoutMs));
        RestTemplate restTemplate = new RestTemplate(factory);
        restTemplate.getMessageConverters().removeIf(StringHttpMessageConverter.class::isInstance);
        restTemplate.getMessageConverters().add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
        return restTemplate;
    }

    @Bean(name = "taskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("alejandria-async-");
        executor.initialize();
        return executor;
    }
}
