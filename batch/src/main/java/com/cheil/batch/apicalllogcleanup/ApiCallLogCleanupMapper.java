package com.cheil.batch.apicalllogcleanup;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ApiCallLogCleanupMapper {

    int deleteExpiredApiCallLogs(@Param("retentionMonths") int retentionMonths);
}
