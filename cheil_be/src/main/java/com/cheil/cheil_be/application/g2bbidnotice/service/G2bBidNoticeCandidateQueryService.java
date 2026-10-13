package com.cheil.cheil_be.application.g2bbidnotice.service;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateQueryUseCase;
import com.cheil.cheil_be.application.g2bbidnotice.port.in.G2bBidNoticeCandidateSearchCondition;
import com.cheil.cheil_be.application.g2bbidnotice.port.out.G2bBidNoticeCandidateRepository;
import com.cheil.cheil_be.domain.g2bbidnotice.G2bBidNoticeCandidate;

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
}
