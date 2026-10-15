package com.cheil.cheil_be.application.g2bbidnotice.port.out;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateSearchCondition;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidate;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidateAttachment;

public interface G2bBidNoticeCandidateRepository {

    Page<G2bBidNoticeCandidate> findAll(G2bBidNoticeCandidateSearchCondition condition, Pageable pageable);

    void deleteAllById(List<Long> ids);

    void markImported(Long candidateId, Long bidSeq, String importedBy);

    List<G2bBidNoticeCandidateAttachment> findAttachmentsByImportedBidSeq(Long bidSeq);

    Optional<G2bBidNoticeCandidate> findByImportedBidSeq(Long bidSeq);

    Optional<G2bBidNoticeCandidate> findImportedByBidNoticeNumber(String bidNoticeNumber);
}
