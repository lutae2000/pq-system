package com.cheil.cheil_be.application.shinindo.port.in;

import com.cheil.cheil_be.application.shinindo.model.ShinindoManagement;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSaveCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ShinindoManagementUseCase {
    Page<ShinindoManagement> findAll(String keyword, String clientCode, String referenceDate, Pageable pageable);
    ShinindoManagement findById(Long id);
    ShinindoManagement create(ShinindoManagementSaveCommand command);
    ShinindoManagement update(Long id, ShinindoManagementSaveCommand command);
    void delete(Long id);
}
