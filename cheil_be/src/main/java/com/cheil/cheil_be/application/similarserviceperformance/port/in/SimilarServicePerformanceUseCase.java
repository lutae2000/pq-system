package com.cheil.cheil_be.application.similarserviceperformance.port.in;

import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;

public interface SimilarServicePerformanceUseCase {

    Page<SimilarServicePerformance> findAll(SimilarServicePerformanceSearch search, Pageable pageable);

    SimilarServicePerformance findById(Long id);

    SimilarServicePerformance create(SimilarServicePerformanceCommand command);

    SimilarServicePerformance update(Long id, SimilarServicePerformanceCommand command);

    void delete(Long id);
}
