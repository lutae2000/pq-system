package com.cheil.cheil_be.application.engineer;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

interface EngineerSchoolRepository extends JpaRepository<EngineerSchoolEntity, Long> {
    List<EngineerSchoolEntity> findByEngrIdOrderById(String engrId);

    @Modifying
    void deleteByEngrId(String engrId);
}
