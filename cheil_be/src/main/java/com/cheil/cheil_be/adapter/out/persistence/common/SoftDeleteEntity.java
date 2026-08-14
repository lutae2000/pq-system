package com.cheil.cheil_be.adapter.out.persistence.common;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.common.security.AuditActorResolver;

@Getter
@MappedSuperclass
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuperBuilder
public abstract class SoftDeleteEntity extends AuditEntity {

    @Column(name = "deleted", nullable = false)
    protected boolean deleted;

    @Column(name = "deleted_at")
    protected Instant deletedAt;

    @Column(name = "deleted_id", length = 100)
    protected String deletedId;

    public void markDeleted() {
        if (deleted) {
            return;
        }
        deleted = true;
        deletedAt = Instant.now();
        deletedId = AuditActorResolver.resolve();
    }

    public void restore() {
        deleted = false;
        deletedAt = null;
        deletedId = null;
    }
}
