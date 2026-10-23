package com.cheil.cheil_be.application.notice.service;

import com.cheil.cheil_be.application.common.validation.InputValues;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.notice.port.out.NoticeRepository;
import com.cheil.cheil_be.application.notice.port.in.NoticeAdminUseCase;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.notice.Notice;

@Service
@RequiredArgsConstructor
public class NoticeAdminService implements NoticeAdminUseCase {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final int NOTICE_ID_MAX_LENGTH = 50;
    private static final int NOTICE_TITLE_MAX_LENGTH = 200;
    private static final int NOTICE_TARGET_PATH_MAX_LENGTH = 500;

    private final NoticeRepository noticeRepository;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<Notice> findAll(NoticeListScope scope) {
        List<Notice> notices = noticeRepository.findAll().stream()
                .sorted(Comparator.comparing(Notice::getPublishAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed()
                        .thenComparing(Notice::getId))
                .toList();

        if (scope == NoticeListScope.ADMIN) {
            return notices;
        }

        LocalDateTime now = LocalDateTime.ofInstant(clock.instant(), SEOUL_ZONE);
        return notices.stream()
                .filter(notice -> isVisibleToday(notice, now))
                .toList();
    }

    @Transactional(readOnly = true)
    public Notice findById(String noticeId) {
        return noticeRepository.findById(InputValues.requiredText(noticeId, "noticeId"))
                .orElseThrow(() -> ApplicationException.notFound("공지사항을 찾을 수 없습니다."));
    }

    @Transactional
    public Notice create(Notice request) {
        Notice normalized = normalize(request);
        if (StringValues.normalize(normalized.getId()).isBlank()) {
            normalized.setId("NOTICE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT));
        }
        if (noticeRepository.existsById(normalized.getId())) {
            throw ApplicationException.conflict("이미 존재하는 공지사항입니다.");
        }
        return noticeRepository.save(normalized);
    }

    @Transactional
    public Notice update(String noticeId, Notice request) {
        String normalizedId = InputValues.requiredText(noticeId, "noticeId");
        Notice existing = noticeRepository.findById(normalizedId)
                .orElseThrow(() -> ApplicationException.notFound("공지사항을 찾을 수 없습니다."));

        requireRequest(request);
        String requestId = StringValues.normalize(request.getId());
        if (!requestId.isBlank() && !normalizedId.equals(requestId)) {
            throw ApplicationException.badRequest("path id와 body id가 일치해야 합니다.");
        }

        Notice normalized = normalize(request, existing);
        normalized.setId(normalizedId);
        return noticeRepository.save(normalized);
    }

    @Transactional
    public void delete(String noticeId) {
        String normalizedId = InputValues.requiredText(noticeId, "noticeId");
        if (!noticeRepository.existsById(normalizedId)) {
            throw ApplicationException.notFound("공지사항을 찾을 수 없습니다.");
        }
        noticeRepository.deleteById(normalizedId);
    }

    private Notice normalize(Notice request) {
        requireRequest(request);
        return normalize(request, null);
    }

    private Notice normalize(Notice request, Notice fallback) {
        Notice normalized = new Notice();
        normalized.setActive(request.isActive());
        normalized.setContent(InputValues.requiredText(request.getContent(), "content"));
        normalized.setExposureEndAt(normalizeDateTime(request.getExposureEndAt(), fallback == null ? null : fallback.getExposureEndAt(), "exposureEndAt"));
        normalized.setExposureStartAt(normalizeDateTime(request.getExposureStartAt(), fallback == null ? null : fallback.getExposureStartAt(), "exposureStartAt"));
        normalized.setId(StringValues.normalize(request.getId()));
        normalized.setImportant(request.isImportant());
        normalized.setPublishAt(normalizeDateTime(request.getPublishAt(), fallback == null ? null : fallback.getPublishAt(), "publishAt"));
        normalized.setTitle(InputValues.requiredText(request.getTitle(), "title"));
        normalized.setTargetPath(StringValues.normalize(request.getTargetPath()));
        InputValues.validateMaxLength(normalized.getId(), NOTICE_ID_MAX_LENGTH, "id");
        InputValues.validateMaxLength(normalized.getTitle(), NOTICE_TITLE_MAX_LENGTH, "title");
        InputValues.validateMaxLength(normalized.getTargetPath(), NOTICE_TARGET_PATH_MAX_LENGTH, "targetPath");
        return normalized;
    }

    private void requireRequest(Notice request) {
        if (request == null) {
            throw ApplicationException.badRequest("공지사항 요청 본문이 필요합니다.");
        }
    }

    private String normalizeDateTime(String value, String fallback, String fieldName) {
        String normalized = StringValues.optional(value, fallback);
        if (normalized == null || normalized.isBlank()) {
            throw ApplicationException.badRequest(fieldName + "은(는) 필수입니다.");
        }
        try {
            return LocalDateTime.parse(normalized, DATETIME_FORMATTER).format(DATETIME_FORMATTER);
        } catch (RuntimeException exception) {
            throw ApplicationException.badRequest(fieldName + "은(는) yyyy-MM-dd HH:mm 형식이어야 합니다.", exception);
        }
    }

    private boolean isVisibleToday(Notice notice, LocalDateTime now) {
        if (!notice.isActive()) {
            return false;
        }

        LocalDateTime publishAt;
        LocalDateTime exposureStartAt;
        LocalDateTime exposureEndAt;
        try {
            publishAt = parseDateTime(notice.getPublishAt());
            exposureStartAt = parseDateTime(notice.getExposureStartAt());
            exposureEndAt = parseDateTime(notice.getExposureEndAt());
        } catch (RuntimeException exception) {
            // 잘못된 기존 데이터 하나 때문에 대시보드 전체 공지 조회가 실패하지 않도록 노출 대상에서 제외한다.
            return false;
        }

        if (publishAt == null || exposureStartAt == null || exposureEndAt == null) {
            return false;
        }

        return !now.isBefore(publishAt)
                && !now.isBefore(exposureStartAt)
                && !now.isAfter(exposureEndAt);
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDateTime.parse(value.trim(), DATETIME_FORMATTER);
    }
}
