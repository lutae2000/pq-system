package com.cheil.cheil_be.application.notice.port.in;

import java.util.List;

import com.cheil.cheil_be.domain.notice.Notice;

/**
 * 공지사항 관리 기능의 inbound use case 경계다.
 *
 * 현재 API 호환을 위해 domain 응답을 유지하고 있으며, 웹 응답 DTO 분리는 다음 단계에서 진행한다.
 */
public interface NoticeAdminUseCase {

    List<Notice> findAll(NoticeListScope scope);

    Notice findById(String noticeId);

    Notice create(Notice request);

    Notice update(String noticeId, Notice request);

    void delete(String noticeId);

    enum NoticeListScope {
        ADMIN,
        DASHBOARD
    }
}
