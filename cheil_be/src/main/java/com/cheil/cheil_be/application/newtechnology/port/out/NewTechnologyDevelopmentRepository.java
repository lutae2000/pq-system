package com.cheil.cheil_be.application.newtechnology.port.out;

import java.util.Optional;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopment;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyDevelopmentSearch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NewTechnologyDevelopmentRepository {
    Page<NewTechnologyDevelopment> findAll(NewTechnologyDevelopmentSearch search, Pageable pageable);
    Optional<NewTechnologyDevelopment> findById(Long id);
    Long create(NewTechnologyDevelopmentCommand command, String actor);
    int update(Long id, NewTechnologyDevelopmentCommand command, String actor);
    int delete(Long id);
}
