package com.cheil.cheil_be.adapter.out.persistence.educationreminder;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EducationReminderTemplateJpaRepository extends JpaRepository<EducationReminderTemplateEntity, Long> {

    List<EducationReminderTemplateEntity> findAllByOrderByNameAsc();
}
