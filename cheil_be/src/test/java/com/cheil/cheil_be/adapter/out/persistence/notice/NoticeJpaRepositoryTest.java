package com.cheil.cheil_be.adapter.out.persistence.notice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.google.gson.Gson;
import com.cheil.cheil_be.application.cache.port.out.CacheStore;
import com.cheil.cheil_be.domain.notice.Notice;

@ExtendWith(MockitoExtension.class)
class NoticeJpaRepositoryTest {

    @Mock
    private JpaNoticeRepository jpaNoticeRepository;

    @Mock
    private CacheStore cacheStore;

    private final Gson gson = new Gson();

    @Test
    void findAllReturnsCachedNoticesWhenCacheExists() throws Exception {
        Notice cachedNotice = new Notice(true, "content", "2026-06-30 18:00", "2026-06-30 09:00", "N001", true, "2026-06-30 09:00", "title");
        when(cacheStore.get(any())).thenReturn(Optional.of(gson.toJson(List.of(cachedNotice))));

        NoticeJpaRepository repository = new NoticeJpaRepository(jpaNoticeRepository, cacheStore);

        List<Notice> result = repository.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("N001");
        verifyNoInteractions(jpaNoticeRepository);
    }

    @Test
    void findAllFallsBackToDatabaseWhenCacheIsMissing() throws Exception {
        NoticeEntity entity = NoticeEntity.from(
                new Notice(true, "content", "2026-06-30 18:00", "2026-06-30 09:00", "N002", true, "2026-06-30 09:00", "title")
        );
        when(cacheStore.get(any())).thenReturn(Optional.empty());
        when(jpaNoticeRepository.findAll()).thenReturn(List.of(entity));

        NoticeJpaRepository repository = new NoticeJpaRepository(jpaNoticeRepository, cacheStore);

        List<Notice> result = repository.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("N002");
        verify(jpaNoticeRepository).findAll();
        verify(cacheStore).put(eq("cache:system:notices"), anyString(), any(java.time.Duration.class));
    }
}
