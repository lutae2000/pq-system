package com.cheil.cheil_be.adapter.out.persistence.educationreminder;

import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import com.cheil.cheil_be.application.educationreminder.model.EducationReminderSendTemplate;
import com.cheil.cheil_be.application.educationreminder.port.out.EducationReminderSendTemplateRepository;

@Repository
@RequiredArgsConstructor
public class EducationReminderSendTemplateRepositoryAdapter implements EducationReminderSendTemplateRepository {
    private final EducationReminderTemplateJpaRepository repository;

    @Override
    public Optional<EducationReminderSendTemplate> findById(Long id) {
        return repository.findById(id).map(entity -> new EducationReminderSendTemplate(
                entity.getId(), entity.getName(), entity.getChannel(), entity.getContent(), entity.isActive()));
    }
}
