package com.cheil.cheil_be.adapter.out.persistence.educationreminder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderTemplateRequest;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderTemplateResponse;
import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "education_reminder_templates")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EducationReminderTemplateEntity extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "channel", nullable = false, length = 10)
    private String channel;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "active", nullable = false)
    private boolean active;

    public EducationReminderTemplateEntity(EducationReminderTemplateRequest request) {
        update(request);
    }

    public void update(EducationReminderTemplateRequest request) {
        name = request.name();
        channel = request.channel();
        title = request.title();
        description = request.description();
        content = request.content();
        active = Boolean.TRUE.equals(request.active());
    }

    public EducationReminderTemplateResponse toResponse() {
        return new EducationReminderTemplateResponse(
                id,
                name,
                channel,
                title,
                description,
                content,
                active,
                createdAt == null ? null : createdAt.toString(),
                createdId,
                lastChangedAt == null ? null : lastChangedAt.toString(),
                lastChangedId
        );
    }
}
