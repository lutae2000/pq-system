package com.cheil.cheil_be.application.similarserviceperformance.port.out;

import java.util.Optional;

import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceCommand;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformancePage;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;

public interface SimilarServicePerformanceRepository {

    SimilarServicePerformancePage findAll(SimilarServicePerformanceSearch search);

    Optional<SimilarServicePerformance> findById(Long id);

    long nextId();

    SimilarServicePerformance save(Long id, SimilarServicePerformanceCommand command);

    void deleteById(Long id);
}
