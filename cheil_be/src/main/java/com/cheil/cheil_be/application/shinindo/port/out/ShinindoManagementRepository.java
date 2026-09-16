package com.cheil.cheil_be.application.shinindo.port.out;

import com.cheil.cheil_be.application.shinindo.model.ShinindoManagement;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSaveCommand;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ShinindoManagementRepository {

    Page<ShinindoManagement> findAll(String keyword, String clientCode, Pageable pageable);

    Optional<ShinindoManagement> findById(Long id);

    boolean clientExists(String clientCode);

    Long create(ShinindoManagementSaveCommand command);

    void update(Long id, ShinindoManagementSaveCommand command);

    boolean delete(Long id);
}
