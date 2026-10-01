package com.cheil.cheil_be.application.similarserviceperformance.port.in;

import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformance;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceCommand;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformancePage;
import com.cheil.cheil_be.application.similarserviceperformance.model.SimilarServicePerformanceSearch;

public interface SimilarServicePerformanceUseCase {

    SimilarServicePerformancePage findAll(SimilarServicePerformanceSearch search);

    SimilarServicePerformance findById(Long id);

    SimilarServicePerformance create(SimilarServicePerformanceCommand command);

    SimilarServicePerformance update(Long id, SimilarServicePerformanceCommand command);

    void delete(Long id);
}
