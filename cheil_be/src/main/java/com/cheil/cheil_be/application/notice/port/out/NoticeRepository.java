package com.cheil.cheil_be.application.notice.port.out;

import java.util.List;
import java.util.Optional;

import com.cheil.cheil_be.domain.notice.Notice;

public interface NoticeRepository {

    List<Notice> findAll();

    Optional<Notice> findById(String noticeId);

    boolean existsById(String noticeId);

    Notice save(Notice notice);

    void deleteById(String noticeId);
}
