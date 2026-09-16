package com.cheil.cheil_be.application.newtechnology.port.out;

import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyUsageRequest;
import com.cheil.cheil_be.adapter.in.web.newtechnology.NewTechnologyUsageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NewTechnologyUsageRepository {
    Page<NewTechnologyUsageResponse> findAll(String keyword, String designationNo, String client, String noticeDateFrom, String noticeDateTo, Pageable pageable);
    NewTechnologyUsageResponse findById(Long id);
    Long create(NewTechnologyUsageRequest request, String actor);
    int update(Long id, NewTechnologyUsageRequest request, String actor);
    int delete(Long id);
}
