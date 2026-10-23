package com.cheil.cheil_be.application.newtechnology.port.out;

import java.util.Optional;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestment;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentSearch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NewTechnologyInvestmentRepository {
    Page<NewTechnologyInvestment> findAll(NewTechnologyInvestmentSearch search, Pageable pageable);
    Optional<NewTechnologyInvestment> findById(Long id);
    Long create(NewTechnologyInvestmentCommand command, String actor);
    int update(Long id, NewTechnologyInvestmentCommand command, String actor);
    int delete(Long id);
    boolean existsByInvestmentYear(String investmentYear, Long excludedId);
}
