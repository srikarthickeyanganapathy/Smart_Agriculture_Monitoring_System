package com.example.agro.services;

import com.example.agro.dto.DiseaseRequest;
import com.example.agro.dto.DiseaseResponse;
import com.example.agro.Models.DiseasePrediction;
import com.example.agro.Repository.DiseasePredictionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DiseaseService {

    @Autowired
    private PythonMLService pythonMLService;

    @Autowired
    private DiseasePredictionRepository diseasePredictionRepository;

    public DiseaseResponse predictAndSave(DiseaseRequest req) {
        // Call the existing PythonMLService to get prediction
        DiseaseResponse resp = pythonMLService.predictDisease(req);

        // Persist the prediction
        DiseasePrediction entity = new DiseasePrediction();
        entity.setFieldId(req.getFieldId());
        entity.setPlantId(req.getPlantId());
        entity.setDisease(resp.getDisease());
        entity.setProbability(resp.getProbability());
        entity.setPredictionTime(LocalDateTime.now());

        // Rolling History: Keep max 4
        if (req.getFieldId() != null) {
            var history = diseasePredictionRepository.findByFieldIdOrderByPredictionTimeDesc(req.getFieldId());
            if (history.size() >= 4) {
                // history is sorted desc (newest first). Keep 0,1,2. Delete 3 and older?
                // Actually we desire 4 total AFTER save. So if we have 4 already, we need to
                // delete 1 (the oldest).
                // If we have 10, delete 7.
                // easier: keep top 3, delete rest. Then save new one -> total 4.
                // List is Descending: 0=Newest.
                int keep = 3;
                if (history.size() > keep) {
                    List<DiseasePrediction> toDelete = history.subList(keep, history.size());
                    diseasePredictionRepository.deleteAll(toDelete);
                }
            }
        }

        diseasePredictionRepository.save(entity);
        return resp;
    }

    public java.util.List<DiseasePrediction> getHistory() {
        return diseasePredictionRepository.findAll(org.springframework.data.domain.Sort
                .by(org.springframework.data.domain.Sort.Direction.DESC, "predictionTime"));
    }

    public java.util.List<DiseasePrediction> getFieldHistory(int fieldId) {
        return diseasePredictionRepository.findByFieldIdOrderByPredictionTimeDesc(fieldId);
    }
}
