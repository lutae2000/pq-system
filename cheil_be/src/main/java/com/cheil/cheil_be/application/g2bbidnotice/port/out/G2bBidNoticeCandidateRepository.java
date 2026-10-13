package com.cheil.cheil_be.application.g2bbidnotice.port.out;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateSearchCondition;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidate;

public interface G2bBidNoticeCandidateRepository {

    Page<G2bBidNoticeCandidate> findAll(G2bBidNoticeCandidateSearchCondition condition, Pageable pageable);

    void deleteAllById(List<Long> ids);

    void markImported(Long candidateId, Long bidSeq, String importedBy);
}
