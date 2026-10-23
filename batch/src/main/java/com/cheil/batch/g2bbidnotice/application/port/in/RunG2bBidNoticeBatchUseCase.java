package com.cheil.batch.g2bbidnotice.application.port.in;

import com.cheil.batch.common.batch.BatchRunStatus;

public interface RunG2bBidNoticeBatchUseCase {

    BatchRunStatus runOnDemand();
}
