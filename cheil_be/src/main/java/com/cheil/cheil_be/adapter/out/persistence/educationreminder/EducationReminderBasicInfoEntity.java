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

import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderBasicInfoRequest;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderBasicInfoResponse;
import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

@Entity
@Table(name = "education_reminder_basic_infos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EducationReminderBasicInfoEntity extends AuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "cycle_unit", nullable = false, length = 20)
    private String cycleUnit;

    @Column(name = "cycle_value", nullable = false)
    private Integer cycleValue;

    @Column(name = "active", nullable = false)
    private boolean active;

    public EducationReminderBasicInfoEntity(EducationReminderBasicInfoRequest request) {
        update(request);
    }

    public void update(EducationReminderBasicInfoRequest request) {
        code = request.code();
        name = request.name();
        description = request.description();
        cycleUnit = request.cycleUnit();
        cycleValue = request.cycleValue();
        active = Boolean.TRUE.equals(request.active());
    }

    public EducationReminderBasicInfoResponse toResponse() {
        return new EducationReminderBasicInfoResponse(
                id,
                code,
                name,
                description,
                cycleUnit,
                cycleValue,
                active,
                createdAt == null ? null : createdAt.toString(),
                createdId,
                lastChangedAt == null ? null : lastChangedAt.toString(),
                lastChangedId
        );
    }
}
