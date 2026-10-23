package com.cheil.cheil_be.application.similarserviceperformance.port.out;

import java.util.Optional;

import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;

public interface SimilarServicePerformanceRepository {

    Page<SimilarServicePerformance> findAll(SimilarServicePerformanceSearch search, Pageable pageable);

    Optional<SimilarServicePerformance> findById(Long id);

    long nextId();

    SimilarServicePerformance save(Long id, SimilarServicePerformanceCommand command);

    void deleteById(Long id);
}
