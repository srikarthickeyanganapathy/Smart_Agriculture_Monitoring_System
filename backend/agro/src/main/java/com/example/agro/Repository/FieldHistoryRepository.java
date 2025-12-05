package com.example.agro.Repository;

import com.example.agro.Models.FieldHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldHistoryRepository extends JpaRepository<FieldHistory, Long> {
    // Additional query methods can be defined here if needed
}
