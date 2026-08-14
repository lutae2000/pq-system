package com.cheil.cheil_be.application.engineer;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

interface EngineerCareerRepository extends JpaRepository<EngineerCareerEntity, Long> {
    List<EngineerCareerEntity> findByEngrIdOrderByEntryDtAsc(String engrId);

    @Modifying
    void deleteByEngrId(String engrId);
}
