package com.example.agro.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class RestTemplateConfig {

    @Value("${services.python-ml.base-url}")
    private String pythonServiceUrl;

    @Value("${services.dotnet-recommendation.base-url}")
    private String dotnetServiceUrl;

    @Bean
    public WebClient pythonWebClient() {
        return WebClient.builder()
                .baseUrl(pythonServiceUrl) // Now uses the Render URL
                .build();
    }

    @Bean
    public WebClient dotnetWebClient() {
        return WebClient.builder()
                .baseUrl(dotnetServiceUrl) // Now uses the Render URL
                .build();
    }
}