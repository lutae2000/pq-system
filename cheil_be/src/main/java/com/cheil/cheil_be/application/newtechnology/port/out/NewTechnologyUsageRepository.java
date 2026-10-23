package com.cheil.cheil_be.application.newtechnology.port.out;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageSearch;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageView;

public interface NewTechnologyUsageRepository {
    Page<NewTechnologyUsageView> findAll(NewTechnologyUsageSearch search, Pageable pageable);
    Optional<NewTechnologyUsageView> findById(Long id);
    Long create(NewTechnologyUsageCommand command, String actor);
    int update(Long id, NewTechnologyUsageCommand command, String actor);
    int delete(Long id);
}
