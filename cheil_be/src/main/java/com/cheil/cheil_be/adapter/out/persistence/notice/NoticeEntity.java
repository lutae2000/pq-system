package com.cheil.cheil_be.adapter.out.persistence.notice;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import com.cheil.cheil_be.domain.notice.Notice;
import com.cheil.cheil_be.adapter.out.persistence.common.AuditEntity;

/**
 * system_notices 테이블 매핑 엔티티이다.
 */
@Entity
@Table(name = "system_notices")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@SuperBuilder
class NoticeEntity extends AuditEntity {

    private static final DateTimeFormatter INPUT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Id
    @Column(name = "notice_id", nullable = false, unique = true, length = 50)
    private String noticeId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", nullable = false)
    private String content;

    @Column(name = "exposure_start_at", nullable = false)
    private LocalDateTime exposureStartAt;

    @Column(name = "exposure_end_at", nullable = false)
    private LocalDateTime exposureEndAt;

    @Column(name = "publish_at", nullable = false)
    private LocalDateTime publishAt;

    @Column(name = "important", nullable = false)
    private boolean important;

    @Column(name = "active", nullable = false)
    private boolean active;

    static NoticeEntity from(Notice notice) {
        return NoticeEntity.builder()
                .noticeId(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .exposureStartAt(parseDateTime(notice.getExposureStartAt()))
                .exposureEndAt(parseDateTime(notice.getExposureEndAt()))
                .publishAt(parseDateTime(notice.getPublishAt()))
                .important(notice.isImportant())
                .active(notice.isActive())
                .build();
    }

    void updateFrom(Notice notice) {
        title = notice.getTitle();
        content = notice.getContent();
        exposureStartAt = parseDateTime(notice.getExposureStartAt());
        exposureEndAt = parseDateTime(notice.getExposureEndAt());
        publishAt = parseDateTime(notice.getPublishAt());
        important = notice.isImportant();
        active = notice.isActive();
    }

    Notice toDomain() {
        return new Notice(
                active,
                content,
                formatDateTime(exposureEndAt),
                formatDateTime(exposureStartAt),
                noticeId,
                important,
                formatDateTime(publishAt),
                title
        );
    }

    private static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDateTime.parse(value.trim(), INPUT_FORMATTER);
    }

    private static String formatDateTime(LocalDateTime value) {
        return value == null ? "" : value.format(INPUT_FORMATTER);
    }
}
