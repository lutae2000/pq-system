package com.cheil.cheil_be.application.notice.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.notice.port.out.NoticeRepository;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.notice.Notice;

@Service
@RequiredArgsConstructor
public class NoticeAdminService {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public enum NoticeListScope {
        ADMIN,
        DASHBOARD
    }

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
        return noticeRepository.findById(StringValues.required(noticeId, "noticeId"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."));
    }

    @Transactional
    public Notice create(Notice request) {
        Notice normalized = normalize(request);
        if (StringValues.normalize(normalized.getId()).isBlank()) {
            normalized.setId("NOTICE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT));
        }
        if (noticeRepository.existsById(normalized.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 존재하는 공지사항입니다.");
        }
        return noticeRepository.save(normalized);
    }

    @Transactional
    public Notice update(String noticeId, Notice request) {
        String normalizedId = StringValues.required(noticeId, "noticeId");
        Notice existing = noticeRepository.findById(normalizedId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."));

        String requestId = StringValues.normalize(request.getId());
        if (!requestId.isBlank() && !normalizedId.equals(requestId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "path id와 body id가 일치해야 합니다.");
        }

        Notice normalized = normalize(request);
        normalized.setId(normalizedId);
        normalized.setActive(request.isActive());
        normalized.setImportant(request.isImportant());
        if (normalized.getPublishAt() == null) {
            normalized.setPublishAt(existing.getPublishAt());
        }
        if (normalized.getExposureStartAt() == null) {
            normalized.setExposureStartAt(existing.getExposureStartAt());
        }
        if (normalized.getExposureEndAt() == null) {
            normalized.setExposureEndAt(existing.getExposureEndAt());
        }
        return noticeRepository.save(normalized);
    }

    @Transactional
    public void delete(String noticeId) {
        String normalizedId = StringValues.required(noticeId, "noticeId");
        if (!noticeRepository.existsById(normalizedId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다.");
        }
        noticeRepository.deleteById(normalizedId);
    }

    private Notice normalize(Notice request) {
        Notice normalized = new Notice();
        normalized.setActive(request.isActive());
        normalized.setContent(StringValues.required(request.getContent(), "content"));
        normalized.setExposureEndAt(StringValues.required(request.getExposureEndAt(), "exposureEndAt"));
        normalized.setExposureStartAt(StringValues.required(request.getExposureStartAt(), "exposureStartAt"));
        normalized.setId(StringValues.normalize(request.getId()));
        normalized.setImportant(request.isImportant());
        normalized.setPublishAt(StringValues.required(request.getPublishAt(), "publishAt"));
        normalized.setTitle(StringValues.required(request.getTitle(), "title"));
        return normalized;
    }

    private boolean isVisibleToday(Notice notice, LocalDateTime now) {
        if (!notice.isActive()) {
            return false;
        }

        LocalDateTime publishAt = parseDateTime(notice.getPublishAt());
        LocalDateTime exposureStartAt = parseDateTime(notice.getExposureStartAt());
        LocalDateTime exposureEndAt = parseDateTime(notice.getExposureEndAt());

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
