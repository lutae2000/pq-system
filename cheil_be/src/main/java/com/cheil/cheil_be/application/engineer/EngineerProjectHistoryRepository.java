package com.cheil.cheil_be.application.engineer;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

interface EngineerProjectHistoryRepository extends JpaRepository<EngineerProjectHistoryEntity, Long> {
    List<EngineerProjectHistoryEntity> findByEngrIdOrderByStartDtDescIdDesc(String engrId);
}
