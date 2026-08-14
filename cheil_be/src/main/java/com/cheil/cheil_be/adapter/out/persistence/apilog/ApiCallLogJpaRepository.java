package com.cheil.cheil_be.adapter.out.persistence.apilog;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * API 호출 로그 엔티티를 DB에 저장하는 Spring Data JPA 저장소입니다.
 */
interface ApiCallLogJpaRepository extends JpaRepository<ApiCallLogEntity, Long> {
}
