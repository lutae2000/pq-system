package com.cheil.cheil_be.application.newtechnology.port.in;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentSearch;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyInvestmentView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NewTechnologyInvestmentUseCase {

    Page<NewTechnologyInvestmentView> findAll(NewTechnologyInvestmentSearch search, Pageable pageable);

    NewTechnologyInvestmentView findById(Long id);

    NewTechnologyInvestmentView create(NewTechnologyInvestmentCommand command);

    NewTechnologyInvestmentView update(Long id, NewTechnologyInvestmentCommand command);

    void delete(Long id);
}
