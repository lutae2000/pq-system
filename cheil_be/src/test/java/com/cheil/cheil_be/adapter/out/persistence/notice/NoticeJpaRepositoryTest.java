package com.cheil.cheil_be.adapter.out.persistence.notice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cheil.cheil_be.domain.notice.Notice;

@ExtendWith(MockitoExtension.class)
class NoticeJpaRepositoryTest {

    @Mock
    private JpaNoticeRepository jpaNoticeRepository;

    @Test
    void findAllLoadsNoticesFromDatabase() {
        NoticeEntity entity = NoticeEntity.from(
                new Notice(true, "content", "2026-06-30 18:00", "2026-06-30 09:00", "N002", true, "2026-06-30 09:00", "title")
        );
        when(jpaNoticeRepository.findAll()).thenReturn(List.of(entity));

        NoticeJpaRepository repository = new NoticeJpaRepository(jpaNoticeRepository);

        List<Notice> result = repository.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("N002");
        verify(jpaNoticeRepository).findAll();
    }
}
