package com.example.agro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AgroApplication {

	public static void main(String[] args) {
		SpringApplication.run(AgroApplication.class, args);
	}

}
