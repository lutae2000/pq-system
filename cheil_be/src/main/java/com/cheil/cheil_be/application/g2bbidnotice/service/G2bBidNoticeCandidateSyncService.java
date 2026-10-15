package com.cheil.cheil_be.application.g2bbidnotice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.cheil.cheil_be.application.g2bbidnotice.model.G2bBidNoticeBatchTriggerResult;
import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateSyncUseCase;
import com.cheil.cheil_be.application.g2bbidnotice.port.out.G2bBidNoticeBatchTrigger;

@Service
@RequiredArgsConstructor
public class G2bBidNoticeCandidateSyncService implements G2bBidNoticeCandidateSyncUseCase {

    private final G2bBidNoticeBatchTrigger batchTrigger;

    @Override
    public G2bBidNoticeBatchTriggerResult trigger() {
        return batchTrigger.trigger();
    }
}
