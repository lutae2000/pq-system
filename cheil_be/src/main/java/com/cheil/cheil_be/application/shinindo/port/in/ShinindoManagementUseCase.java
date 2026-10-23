package com.cheil.cheil_be.application.shinindo.port.in;

import com.cheil.cheil_be.application.shinindo.model.ShinindoManagement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSaveCommand;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSearch;

public interface ShinindoManagementUseCase {
    Page<ShinindoManagement> findAll(ShinindoManagementSearch search, Pageable pageable);
    ShinindoManagement findById(Long id);
    ShinindoManagement create(ShinindoManagementSaveCommand command);
    ShinindoManagement update(Long id, ShinindoManagementSaveCommand command);
    void delete(Long id);
}
