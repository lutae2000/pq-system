package com.cheil.cheil_be.application.shinindo.service;

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

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagement;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSearch;
import com.cheil.cheil_be.application.shinindo.port.out.ShinindoManagementRepository;

@ExtendWith(MockitoExtension.class)
class ShinindoManagementServiceTest {

    @Mock
    private ShinindoManagementRepository repository;

    @Mock
    private CurrentActorPort currentActorPort;

    @InjectMocks
    private ShinindoManagementService service;

    @Test
    void normalizesSearchWithoutExposingSpringPageTypes() {
        var pageable = PageRequest.of(0, 20);
        Page<ShinindoManagement> page = new PageImpl<>(List.of(), pageable, 0);
        when(repository.findAll(any(), any())).thenReturn(page);

        assertThat(service.findAll(new ShinindoManagementSearch(
                " 검색어 ", " CLIENT ", "2026-10-22"
        ), pageable)).isEqualTo(page);

        var captor = ArgumentCaptor.forClass(ShinindoManagementSearch.class);
        verify(repository).findAll(captor.capture(), org.mockito.ArgumentMatchers.same(pageable));
        assertThat(captor.getValue()).isEqualTo(new ShinindoManagementSearch(
                "검색어", "CLIENT", "2026-10-22"
        ));
    }
}
