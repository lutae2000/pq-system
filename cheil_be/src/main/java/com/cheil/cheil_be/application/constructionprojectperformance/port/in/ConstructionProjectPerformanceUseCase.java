package com.cheil.cheil_be.application.constructionprojectperformance.port.in;

import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformance;
import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformanceCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformanceSearch;

public interface ConstructionProjectPerformanceUseCase {

    Page<ConstructionProjectPerformance> findAll(ConstructionProjectPerformanceSearch search, Pageable pageable);

    ConstructionProjectPerformance findById(Long id);

    ConstructionProjectPerformance create(ConstructionProjectPerformanceCommand command);

    ConstructionProjectPerformance update(Long id, ConstructionProjectPerformanceCommand command);

    void delete(Long id);
}
