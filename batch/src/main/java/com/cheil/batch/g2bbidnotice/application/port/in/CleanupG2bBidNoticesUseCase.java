package com.cheil.batch.g2bbidnotice.application.port.in;

public interface CleanupG2bBidNoticesUseCase {
    CleanupResult cleanup();

    record CleanupResult(int candidates, int syncItems) {}
}
