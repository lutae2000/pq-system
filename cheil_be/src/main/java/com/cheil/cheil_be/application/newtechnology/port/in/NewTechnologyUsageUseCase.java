package com.cheil.cheil_be.application.newtechnology.port.in;

import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageCommand;
import com.cheil.cheil_be.application.newtechnology.model.NewTechnologyUsageView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NewTechnologyUsageUseCase {
    Page<NewTechnologyUsageView> findAll(String keyword, String designationNo, String client,
                                          String noticeDateFrom, String noticeDateTo, Pageable pageable);

    NewTechnologyUsageView findById(Long id);

    NewTechnologyUsageView create(NewTechnologyUsageCommand command);

    NewTechnologyUsageView update(Long id, NewTechnologyUsageCommand command);

    void delete(Long id);
}
