package com.cheil.cheil_be.adapter.out.persistence.relatedprojecthistory;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.notFound;

import com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out.BidSelectionLock;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
@RequiredArgsConstructor
public class BidSelectionJdbcLock implements BidSelectionLock {
    private final JdbcClient jdbcClient;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void lock(Long bidSeq) {
        jdbcClient.sql("SELECT bid_seq FROM bid_notices WHERE bid_seq = :bidSeq FOR NO KEY UPDATE")
                .param("bidSeq", bidSeq)
                .query(Long.class)
                .optional()
                .orElseThrow(() -> notFound("공고문을 찾을 수 없습니다."));
    }
}
