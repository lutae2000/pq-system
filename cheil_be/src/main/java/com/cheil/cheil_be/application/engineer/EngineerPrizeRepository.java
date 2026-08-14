package com.cheil.cheil_be.application.engineer;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

interface EngineerPrizeRepository extends JpaRepository<EngineerPrizeEntity, Long> {
    List<EngineerPrizeEntity> findByEngrIdOrderById(String engrId);

    @Modifying
    void deleteByEngrId(String engrId);
}
