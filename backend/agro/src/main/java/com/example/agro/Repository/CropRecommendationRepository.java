package com.example.agro.Repository;

import com.example.agro.Models.CropRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CropRecommendationRepository extends JpaRepository<CropRecommendation, Long> {
    List<CropRecommendation> findByFieldIdOrderByRecommendationTimeDesc(Integer fieldId);
}
