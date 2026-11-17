package com.cheil.cheil_be.application.constructionprojectperformance.port.out;

import java.util.Optional;

import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformance;
import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformanceCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformanceSearch;

public interface ConstructionProjectPerformanceRepository {

    Page<ConstructionProjectPerformance> findAll(ConstructionProjectPerformanceSearch search, Pageable pageable);

    Optional<ConstructionProjectPerformance> findById(Long id);

    long nextId();

    ConstructionProjectPerformance save(Long id, ConstructionProjectPerformanceCommand command);

    void deleteById(Long id);
}
