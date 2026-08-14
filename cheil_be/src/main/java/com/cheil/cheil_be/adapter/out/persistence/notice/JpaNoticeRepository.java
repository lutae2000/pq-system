package com.cheil.cheil_be.adapter.out.persistence.notice;

import org.springframework.data.jpa.repository.JpaRepository;

interface JpaNoticeRepository extends JpaRepository<NoticeEntity, String> {
}
