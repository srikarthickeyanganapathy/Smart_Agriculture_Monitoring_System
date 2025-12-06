package com.example.agro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class RestTemplateConfig {

    @Bean
    public WebClient pythonWebClient() {
        return WebClient.builder()
                .baseUrl("http://localhost:8001") // python ml service address
                .build();
    }

    @Bean
    public WebClient dotnetWebClient() {
        return WebClient.builder()
                .baseUrl("http://localhost:5000") // dotnet recommendation service
                .build();
    }
}
