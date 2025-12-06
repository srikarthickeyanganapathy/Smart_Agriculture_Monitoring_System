package com.example.agro.Repository;

import com.example.agro.Models.FieldHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldHistoryRepository extends JpaRepository<FieldHistory, Long> {
    FieldHistory findTopByFieldIdOrderBySnapshotTimeDesc(Integer fieldId);

    java.util.List<FieldHistory> findByFieldIdOrderBySnapshotTimeDesc(Integer fieldId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT f.fieldId FROM FieldHistory f")
    java.util.List<Integer> findDistinctFieldIds();

    long countByFieldId(Integer fieldId);
}
