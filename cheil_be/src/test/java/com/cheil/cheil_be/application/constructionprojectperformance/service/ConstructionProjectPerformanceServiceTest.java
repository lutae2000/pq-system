package com.cheil.cheil_be.application.constructionprojectperformance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformance;
import com.cheil.cheil_be.application.constructionprojectperformance.model.ConstructionProjectPerformanceSearch;
import com.cheil.cheil_be.application.constructionprojectperformance.port.out.ConstructionProjectPerformanceRepository;

@ExtendWith(MockitoExtension.class)
class ConstructionProjectPerformanceServiceTest {

    @Mock
    private ConstructionProjectPerformanceRepository repository;

    @InjectMocks
    private ConstructionProjectPerformanceService service;

    @Test
    void normalizesSimpleSearchBeforeCallingRepository() {
        var pageable = PageRequest.of(0, 20);
        Page<ConstructionProjectPerformance> page = new PageImpl<>(List.of(), pageable, 0);
        when(repository.findAll(any(), any())).thenReturn(page);

        assertThat(service.findAll(new ConstructionProjectPerformanceSearch(
                " 검색어 ", " 공종 ", " 발주처 ", "2026-01-01", "2026-10-22"
        ), pageable)).isEqualTo(page);

        var captor = ArgumentCaptor.forClass(ConstructionProjectPerformanceSearch.class);
        verify(repository).findAll(captor.capture(), org.mockito.ArgumentMatchers.same(pageable));
        assertThat(captor.getValue()).isEqualTo(new ConstructionProjectPerformanceSearch(
                "검색어", "공종", "발주처", "20260101", "20261022"
        ));
    }
}
