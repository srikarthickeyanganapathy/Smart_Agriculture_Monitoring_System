package com.example.agro.Repository;

import com.example.agro.Models.DiseasePrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiseasePredictionRepository extends JpaRepository<DiseasePrediction, Long> {
    List<DiseasePrediction> findByFieldIdOrderByPredictionTimeDesc(Integer fieldId);
}
