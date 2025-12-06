package com.example.agro.Repository;

import com.example.agro.Models.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByFieldId(Integer fieldId);

    List<Alert> findByFieldIdAndClearedFalse(Integer fieldId);
}
