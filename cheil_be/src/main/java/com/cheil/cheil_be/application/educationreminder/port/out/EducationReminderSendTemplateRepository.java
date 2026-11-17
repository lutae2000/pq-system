package com.cheil.cheil_be.application.educationreminder.port.out;

import java.util.Optional;

import com.cheil.cheil_be.application.educationreminder.model.EducationReminderSendTemplate;

public interface EducationReminderSendTemplateRepository {
    Optional<EducationReminderSendTemplate> findById(Long id);
}
