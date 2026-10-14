package com.cheil.batch.apicalllogcleanup.adapter.out.persistence;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ApiCallLogCleanupMapper {

    int deleteExpiredApiCallLogs(@Param("retentionMonths") int retentionMonths);
}
