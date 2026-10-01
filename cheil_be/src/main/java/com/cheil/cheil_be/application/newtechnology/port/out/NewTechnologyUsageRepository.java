package com.cheil.cheil_be.application.newtechnology.port.out;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NewTechnologyUsageRepository {
    Page<NewTechnologyUsageView> findAll(String keyword, String designationNo, String client, String noticeDateFrom, String noticeDateTo, Pageable pageable);
    NewTechnologyUsageView findById(Long id);
    Long create(NewTechnologyUsageCommand command, String actor);
    int update(Long id, NewTechnologyUsageCommand command, String actor);
    int delete(Long id);
}
