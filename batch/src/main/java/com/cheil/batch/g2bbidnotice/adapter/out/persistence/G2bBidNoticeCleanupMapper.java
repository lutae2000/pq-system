package com.cheil.batch.g2bbidnotice.adapter.out.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface G2bBidNoticeCleanupMapper {
    String findRetentionMonths();

    int deleteExpiredCandidates(@Param("retentionMonths") int retentionMonths);

    int deleteExpiredSyncItems(@Param("retentionMonths") int retentionMonths);
}
