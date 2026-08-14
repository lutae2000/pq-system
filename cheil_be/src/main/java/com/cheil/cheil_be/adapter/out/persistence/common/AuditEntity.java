package com.cheil.cheil_be.adapter.out.persistence.common;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.common.security.AuditActorResolver;

@Getter
@MappedSuperclass
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
public abstract class AuditEntity {

    @Column(name = "created_at", nullable = false)
    protected Instant createdAt;

    @Column(name = "created_id", length = 100)
    protected String createdId;

    @Column(name = "last_changed_at", nullable = false)
    protected Instant lastChangedAt;

    @Column(name = "last_changed_id", length = 100)
    protected String lastChangedId;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        String actor = currentActor();
        if (createdAt == null) {
            createdAt = now;
        }
        if (createdId == null) {
            createdId = actor;
        }
        lastChangedAt = now;
        lastChangedId = actor;
    }

    @PreUpdate
    protected void onUpdate() {
        Instant now = Instant.now();
        String actor = currentActor();
        if (createdAt == null) {
            createdAt = now;
        }
        if (createdId == null) {
            createdId = actor;
        }
        lastChangedAt = now;
        lastChangedId = actor;
    }

    private static String currentActor() {
        return AuditActorResolver.resolve();
    }
}
