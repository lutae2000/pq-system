package com.cheil.cheil_be.application.newtechnology.port.in;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentSearch;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NewTechnologyDevelopmentUseCase {

    Page<NewTechnologyDevelopmentView> findAll(NewTechnologyDevelopmentSearch search, Pageable pageable);

    NewTechnologyDevelopmentView findById(Long id, String scoreReferenceDate);

    NewTechnologyDevelopmentView create(NewTechnologyDevelopmentCommand command);

    NewTechnologyDevelopmentView update(Long id, NewTechnologyDevelopmentCommand command);

    void delete(Long id);
}
