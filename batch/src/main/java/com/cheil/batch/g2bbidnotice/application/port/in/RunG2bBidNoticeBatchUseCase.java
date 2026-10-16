package com.cheil.batch.g2bbidnotice.application.port.in;

import com.cheil.batch.common.batch.BatchJobRunStatus;

public interface RunG2bBidNoticeBatchUseCase {

    BatchJobRunStatus runOnDemand();
}
