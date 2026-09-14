package com.cheil.cheil_be.adapter.out.persistence.notice;

import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.notice.port.out.NoticeRepository;
import com.cheil.cheil_be.domain.notice.Notice;

@Repository
@RequiredArgsConstructor
public class NoticeJpaRepository implements NoticeRepository {

    private final JpaNoticeRepository jpaNoticeRepository;

    @Override
    @Cacheable(
            cacheNames = "systemNotices",
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).systemNotices()"
    )
    public List<Notice> findAll() {
        return jpaNoticeRepository.findAll().stream()
                .map(NoticeEntity::toDomain)
                .toList();
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
    @CacheEvict(
            cacheNames = "systemNotices",
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).systemNotices()"
    )
    public Notice save(Notice notice) {
        return jpaNoticeRepository.findById(notice.getId())
                .map(existing -> {
                    existing.updateFrom(notice);
                    return jpaNoticeRepository.save(existing).toDomain();
                })
                .orElseGet(() -> jpaNoticeRepository.save(NoticeEntity.from(notice)).toDomain());
    }

    @Override
    @Transactional
    @CacheEvict(
            cacheNames = "systemNotices",
            key = "T(com.cheil.cheil_be.common.cache.CacheKeys).systemNotices()"
    )
    public void deleteById(String noticeId) {
        jpaNoticeRepository.deleteById(noticeId);
    }
}
