package com.example.agro.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.agro.Models.SensorReading;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {
    // Spring Data JPA automatically creates methods like save(), findById(), findAll()
}