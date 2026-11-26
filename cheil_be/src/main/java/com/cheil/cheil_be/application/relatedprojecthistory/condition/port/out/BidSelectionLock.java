package com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out;

public interface BidSelectionLock {
    void lock(Long bidSeq);
}
