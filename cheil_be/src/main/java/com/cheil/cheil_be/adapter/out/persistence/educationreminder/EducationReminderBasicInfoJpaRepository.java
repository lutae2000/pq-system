package com.cheil.cheil_be.adapter.out.persistence.educationreminder;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EducationReminderBasicInfoJpaRepository extends JpaRepository<EducationReminderBasicInfoEntity, Long> {

    List<EducationReminderBasicInfoEntity> findAllByOrderByCodeAsc();
}
