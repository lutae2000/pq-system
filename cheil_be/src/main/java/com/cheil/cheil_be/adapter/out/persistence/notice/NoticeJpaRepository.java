package com.cheil.cheil_be.adapter.out.persistence.notice;

import java.time.Duration;
import java.lang.reflect.Type;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;
import com.cheil.cheil_be.application.cache.port.out.CacheStore;
import com.cheil.cheil_be.application.notice.port.out.NoticeRepository;
import com.cheil.cheil_be.common.cache.CacheKeys;
import com.cheil.cheil_be.domain.notice.Notice;

@Repository
@RequiredArgsConstructor
@Slf4j
public class NoticeJpaRepository implements NoticeRepository {

    private static final String NOTICE_CACHE_KEY = CacheKeys.systemNotices();
    private static final Duration NOTICE_CACHE_TTL = Duration.ofHours(1);
    private static final Type NOTICE_LIST_TYPE = new TypeToken<List<Notice>>() {
    }.getType();

    private final JpaNoticeRepository jpaNoticeRepository;
    private final CacheStore cacheStore;
    private final Gson gson = new GsonBuilder().create();

    @Override
    public List<Notice> findAll() {
        log.debug("::: Redis 캐시에서 공지사항 조회 :::");

        return readCachedNotices()
                .orElseGet(() -> {
                    List<Notice> notices = loadNoticesFromDb();
                    cacheNoticesAfterCommit(notices);
                    return notices;
                });
    }

    @Override
    public Optional<Notice> findById(String noticeId) {
        return jpaNoticeRepository.findById(noticeId).map(NoticeEntity::toDomain);
    }

    @Override
    public boolean existsById(String noticeId) {
        return jpaNoticeRepository.existsById(noticeId);
    }

    @Override
    @Transactional
    public Notice save(Notice notice) {
        Notice saved = jpaNoticeRepository.findById(notice.getId())
                .map(existing -> {
                    existing.updateFrom(notice);
                    return jpaNoticeRepository.save(existing).toDomain();
                })
                .orElseGet(() -> jpaNoticeRepository.save(NoticeEntity.from(notice)).toDomain());
        cacheNoticesAfterCommit(null);
        return saved;
    }

    @Override
    @Transactional
    public void deleteById(String noticeId) {
        jpaNoticeRepository.deleteById(noticeId);
        evictCacheAfterCommit();
    }

    private List<Notice> loadNoticesFromDb() {
        return jpaNoticeRepository.findAll().stream()
                .map(NoticeEntity::toDomain)
                .toList();
    }

    private Optional<List<Notice>> readCachedNotices() {
        try {
            Optional<String> cachedValue = CompletableFuture.supplyAsync(() -> cacheStore.get(NOTICE_CACHE_KEY))
                    .get(1, TimeUnit.SECONDS);
            return cachedValue.flatMap(this::deserializeNotices);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (ExecutionException | TimeoutException ex) {
            return Optional.empty();
        }
    }

    private Optional<List<Notice>> deserializeNotices(String cachedValue) {
        try {
            List<Notice> notices = gson.fromJson(cachedValue, NOTICE_LIST_TYPE);
            return Optional.of(notices == null ? Collections.emptyList() : notices);
        } catch (JsonSyntaxException ex) {
            cacheStore.evict(NOTICE_CACHE_KEY);
            return Optional.empty();
        }
    }

    private void cacheNoticesAfterCommit(List<Notice> notices) {
        Runnable action = () -> {
            List<Notice> source = notices == null ? loadNoticesFromDb() : notices;
            cacheStore.put(NOTICE_CACHE_KEY, gson.toJson(source, NOTICE_LIST_TYPE), NOTICE_CACHE_TTL);
        };
        runAfterCommit(action);
    }

    private void evictCacheAfterCommit() {
        runAfterCommit(() -> cacheStore.evict(NOTICE_CACHE_KEY));
    }

    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
            return;
        }
        action.run();
    }
}
