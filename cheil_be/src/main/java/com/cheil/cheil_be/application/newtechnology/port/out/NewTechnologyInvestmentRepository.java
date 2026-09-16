package com.cheil.cheil_be.application.newtechnology.port.out;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyInvestmentRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyInvestmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NewTechnologyInvestmentRepository {
    Page<NewTechnologyInvestmentResponse> findAll(String yearFrom, String yearTo, Pageable pageable);
    NewTechnologyInvestmentResponse findById(Long id);
    Long create(NewTechnologyInvestmentRequest request, String actor);
    int update(Long id, NewTechnologyInvestmentRequest request, String actor);
    int delete(Long id);
    boolean existsByInvestmentYear(String investmentYear, Long excludedId);
}
