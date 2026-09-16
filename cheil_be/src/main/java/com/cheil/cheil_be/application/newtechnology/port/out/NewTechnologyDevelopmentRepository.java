package com.cheil.cheil_be.application.newtechnology.port.out;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyDevelopmentRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;

public interface NewTechnologyDevelopmentRepository {
    Page<Record> findAll(String keyword, String technologyType, String targetField, String applicationDateFrom, String applicationDateTo, Boolean useYn, Pageable pageable);
    Record findById(Long id);
    Long create(NewTechnologyDevelopmentRequest request, String actor);
    int update(Long id, NewTechnologyDevelopmentRequest request, String actor);
    int delete(Long id);

    record Record(Long id, String sequenceLabel, String title, String technologyType, BigDecimal applicantCount,
                  boolean useYn, String applicationDate, BigDecimal calculatedScore, String targetField,
                  String applicationNo, String registrationNo, String validUntil, String summary, String remark,
                  Instant createdAt, String createdId, Instant lastChangedAt, String lastChangedId) {}
}
