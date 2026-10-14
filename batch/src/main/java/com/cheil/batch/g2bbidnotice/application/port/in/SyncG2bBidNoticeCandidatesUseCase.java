package com.cheil.batch.g2bbidnotice.application.port.in;

import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeSyncCommand;
import com.cheil.batch.g2bbidnotice.application.model.G2bBidNoticeSyncResult;

public interface SyncG2bBidNoticeCandidatesUseCase {

    G2bBidNoticeSyncResult sync(G2bBidNoticeSyncCommand command);
}
