package com.cheil.cheil_be.application.notice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.application.notice.port.out.NoticeRepository;
import com.cheil.cheil_be.application.notice.port.in.NoticeAdminUseCase.NoticeListScope;
import com.cheil.cheil_be.domain.notice.Notice;

class NoticeAdminServiceTest {

    private final InMemoryNoticeRepository repository = new InMemoryNoticeRepository();
    private final Clock clock = Clock.fixed(Instant.parse("2026-06-18T03:00:00Z"), ZoneOffset.UTC);
    private final NoticeAdminService service = new NoticeAdminService(repository, clock);

    @Test
    void findAllForSystemNoticeReturnsOnlyNoticesVisibleToday() {
        repository.put(new Notice(
                true,
                "visible",
                "2026-06-18 23:59",
                "2026-06-18 00:00",
                "VISIBLE",
                true,
                "2026-06-18 09:00",
                "visible",
                null
        ));
        repository.put(new Notice(
                true,
                "future publish",
                "2026-06-18 23:59",
                "2026-06-18 00:00",
                "FUTURE",
                true,
                "2026-06-18 13:00",
                "future publish",
                null
        ));
        repository.put(new Notice(
                true,
                "expired",
                "2026-06-17 23:59",
                "2026-06-17 00:00",
                "EXPIRED",
                true,
                "2026-06-17 09:00",
                "expired",
                null
        ));
        repository.put(new Notice(
                false,
                "inactive",
                "2026-06-18 23:59",
                "2026-06-18 00:00",
                "INACTIVE",
                true,
                "2026-06-18 09:00",
                "inactive",
                null
        ));

        List<Notice> result = service.findAll(NoticeListScope.DASHBOARD);

        assertThat(result).extracting(Notice::getId).containsExactly("VISIBLE");
    }

    @Test
    void findAllForAdminReturnsAllNoticesSortedByPublishAtDesc() {
        repository.put(new Notice(
                true,
                "older",
                "2026-06-18 23:59",
                "2026-06-18 00:00",
                "OLD",
                true,
                "2026-06-18 09:00",
                "older",
                null
        ));
        repository.put(new Notice(
                true,
                "newer",
                "2026-06-18 23:59",
                "2026-06-18 00:00",
                "NEW",
                true,
                "2026-06-18 10:00",
                "newer",
                null
        ));

        List<Notice> result = service.findAll(NoticeListScope.ADMIN);

        assertThat(result).extracting(Notice::getId).containsExactly("NEW", "OLD");
    }

    @Test
    void updateKeepsExistingExposureScheduleWhenRequestOmitsIt() {
        repository.put(new Notice(
                true,
                "old content",
                "2026-06-30 18:00",
                "2026-06-30 09:00",
                "N001",
                false,
                "2026-06-30 09:00",
                "old title",
                null
        ));

        Notice updated = service.update("N001", new Notice(
                true,
                "new content",
                null,
                null,
                "N001",
                true,
                null,
                "new title",
                "/notice/N001"
        ));

        assertThat(updated.getContent()).isEqualTo("new content");
        assertThat(updated.getTitle()).isEqualTo("new title");
        assertThat(updated.getExposureStartAt()).isEqualTo("2026-06-30 09:00");
        assertThat(updated.getExposureEndAt()).isEqualTo("2026-06-30 18:00");
        assertThat(updated.getPublishAt()).isEqualTo("2026-06-30 09:00");
    }

    @Test
    void createRejectsMalformedDateInsteadOfFailingDuringPersistence() {
        assertThatThrownBy(() -> service.create(new Notice(
                true,
                "content",
                "2026/06/30 18:00",
                "2026-06-30 09:00",
                null,
                false,
                "2026-06-30 09:00",
                "title",
                null
        )))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("exposureEndAt");
    }

    private static final class InMemoryNoticeRepository implements NoticeRepository {

        private final Map<String, Notice> notices = new HashMap<>();

        @Override
        public List<Notice> findAll() {
            return notices.values().stream().toList();
        }

        @Override
        public Optional<Notice> findById(String noticeId) {
            return Optional.ofNullable(notices.get(noticeId));
        }

        @Override
        public boolean existsById(String noticeId) {
            return notices.containsKey(noticeId);
        }

        @Override
        public Notice save(Notice notice) {
            notices.put(notice.getId(), notice);
            return notice;
        }

        @Override
        public void deleteById(String noticeId) {
            notices.remove(noticeId);
        }

        void put(Notice notice) {
            notices.put(notice.getId(), notice);
        }
    }
}
