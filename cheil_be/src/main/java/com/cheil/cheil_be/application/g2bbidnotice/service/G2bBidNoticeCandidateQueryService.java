package com.cheil.cheil_be.application.g2bbidnotice.service;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateQueryUseCase;
import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateSearchCondition;
import com.cheil.cheil_be.application.g2bbidnotice.port.out.G2bBidNoticeCandidateRepository;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidate;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidateAttachment;

@Service
@RequiredArgsConstructor
public class G2bBidNoticeCandidateQueryService implements G2bBidNoticeCandidateQueryUseCase {

    private final G2bBidNoticeCandidateRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Page<G2bBidNoticeCandidate> findAll(
            G2bBidNoticeCandidateSearchCondition condition,
            Pageable pageable
    ) {
        return repository.findAll(condition, pageable);
    }

    @Override
    @Transactional
    public void deleteAllById(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        repository.deleteAllById(ids.stream().filter(id -> id != null && id > 0).distinct().toList());
    }

    @Override
    @Transactional
    public void markImported(Long candidateId, Long bidSeq, String importedBy) {
        if (candidateId == null || candidateId <= 0 || bidSeq == null || bidSeq <= 0) {
            throw new IllegalArgumentException("candidateId and bidSeq must be positive");
        }
        repository.markImported(candidateId, bidSeq, importedBy);
    }

    @Override
    @Transactional(readOnly = true)
    public List<G2bBidNoticeCandidateAttachment> findAttachmentsByImportedBidSeq(Long bidSeq) {
        if (bidSeq == null || bidSeq <= 0) {
            return List.of();
        }
        return repository.findAttachmentsByImportedBidSeq(bidSeq);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<G2bBidNoticeCandidate> findByImportedBidSeq(Long bidSeq) {
        if (bidSeq == null || bidSeq <= 0) {
            return Optional.empty();
        }
        return repository.findByImportedBidSeq(bidSeq);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<G2bBidNoticeCandidate> findImportedByBidNoticeNumber(String bidNoticeNumber) {
        if (bidNoticeNumber == null || bidNoticeNumber.isBlank()) {
            return Optional.empty();
        }
        return repository.findImportedByBidNoticeNumber(bidNoticeNumber.trim());
    }
}
