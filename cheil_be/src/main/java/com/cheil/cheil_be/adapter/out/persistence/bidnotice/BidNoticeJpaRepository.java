package com.cheil.cheil_be.adapter.out.persistence.bidnotice;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

interface BidNoticeJpaRepository extends JpaRepository<BidNoticeEntity, Long>, JpaSpecificationExecutor<BidNoticeEntity> {
}
