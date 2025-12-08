package com.example.agro.services;

import com.example.agro.dto.CropRecommendationRequest;
import com.example.agro.dto.CropRecommendationResponse;
import com.example.agro.Models.CropRecommendation;
import com.example.agro.Repository.CropRecommendationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CropRecommendationService {

    @Autowired
    private DotNetRecommendationService dotNetRecommendationService;

    @Autowired
    private CropRecommendationRepository cropRecommendationRepository;

    public CropRecommendationResponse recommendAndSave(CropRecommendationRequest req) {
        // Call the existing .NET recommendation service
        CropRecommendationResponse resp = dotNetRecommendationService.recommendCrop(req);

        // Persist the recommendation
        CropRecommendation entity = new CropRecommendation();
        entity.setFieldId(req.getFieldId());
        entity.setRecommendedCrop(resp.getRecommendedCrop());
        entity.setConfidence(resp.getConfidence());
        entity.setRecommendationTime(LocalDateTime.now());

        // Save input parameters for history display
        entity.setNitrogen(req.soil_n);
        entity.setPhosphorus(req.soil_p);
        entity.setPotassium(req.soil_k);
        entity.setRainfall(req.rainfall);

        // Rolling History: Keep max 4
        if (req.getFieldId() != null) {
            var history = cropRecommendationRepository.findByFieldIdOrderByRecommendationTimeDesc(req.getFieldId());
            // Keep top 3, delete the rest, so adding 1 makes 4.
            if (history.size() >= 4) {
                int keep = 3;
                if (history.size() > keep) {
                    List<CropRecommendation> toDelete = history.subList(keep, history.size());
                    cropRecommendationRepository.deleteAll(toDelete);
                }
            }
        }

        cropRecommendationRepository.save(entity);
        return resp;
    }

    public java.util.List<CropRecommendation> getHistory() {
        return cropRecommendationRepository.findAll(org.springframework.data.domain.Sort
                .by(org.springframework.data.domain.Sort.Direction.DESC, "recommendationTime"));
    }

    public java.util.List<CropRecommendation> getFieldHistory(int fieldId) {
        return cropRecommendationRepository.findByFieldIdOrderByRecommendationTimeDesc(fieldId);
    }
}
