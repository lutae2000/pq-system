package com.cheil.batch.g2bbidnotice.application.port.in;

import com.cheil.batch.g2bbidnotice.application.model.BatchRunStatus;

public interface RunG2bBidNoticeBatchUseCase {

    BatchRunStatus runOnDemand();
}
