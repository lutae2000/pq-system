package com.cheil.cheil_be.application.companyperformance.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.companyperformance.CompanyPerformanceMatchResponse;

@Service
@RequiredArgsConstructor
public class CompanyPerformanceMatchService {

    private static final double DEFAULT_THRESHOLD = 0.8;
    private static final int MAX_SOURCE_NAMES = 100;
    private static final int MAX_CANDIDATES = 5;

    private final JdbcClient jdbcClient;

    @Transactional(readOnly = true)
    public List<CompanyPerformanceMatchResponse> findMatches(List<String> jobNames, Double requestedThreshold) {
        if (jobNames == null || jobNames.isEmpty() || jobNames.size() > MAX_SOURCE_NAMES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비교할 사업명은 1건 이상 100건 이하로 입력해 주세요.");
        }
        double threshold = requestedThreshold == null ? DEFAULT_THRESHOLD : Math.max(0, Math.min(1, requestedThreshold));
        List<CompanyPerformanceMatchResponse.Candidate> existing = jdbcClient.sql("""
                        SELECT seq, job_name, job_own_yn, summary, order_client, job_type, contract_amt, remark
                        FROM company_performances
                        WHERE NULLIF(TRIM(job_name), '') IS NOT NULL
                        """)
                .query((rs, rowNum) -> new CompanyPerformanceMatchResponse.Candidate(
                        rs.getLong("seq"),
                        rs.getString("job_name"),
                        "Y".equalsIgnoreCase(rs.getString("job_own_yn")),
                        0,
                        rs.getString("summary"),
                        rs.getString("order_client"),
                        rs.getString("job_type"),
                        rs.getObject("contract_amt", Long.class),
                        rs.getString("remark")
                ))
                .list();

        List<CompanyPerformanceMatchResponse> result = new ArrayList<>();
        for (String sourceJobName : jobNames) {
            String source = sourceJobName == null ? "" : sourceJobName.trim();
            String normalizedSource = normalizeJobName(source);
            List<CompanyPerformanceMatchResponse.Candidate> candidates = normalizedSource.isBlank() ? List.of() : existing.stream()
                    .map(candidate -> withSimilarity(candidate, similarity(normalizedSource, normalizeJobName(candidate.jobName()))))
                    .filter(candidate -> candidate.similarity() >= threshold)
                    .sorted(Comparator.comparingDouble(CompanyPerformanceMatchResponse.Candidate::similarity).reversed()
                            .thenComparing(CompanyPerformanceMatchResponse.Candidate::seq))
                    .limit(MAX_CANDIDATES)
                    .toList();
            result.add(new CompanyPerformanceMatchResponse(source, candidates));
        }
        return result;
    }

    private CompanyPerformanceMatchResponse.Candidate withSimilarity(
            CompanyPerformanceMatchResponse.Candidate candidate,
            double similarity
    ) {
        return new CompanyPerformanceMatchResponse.Candidate(
                candidate.seq(), candidate.jobName(), candidate.jobOwnYn(), similarity, candidate.summary(), candidate.orderClient(),
                candidate.jobType(), candidate.contractAmt(), candidate.remark()
        );
    }

    private String normalizeJobName(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFKC)
                .replaceAll("\\s+", "")
                .toLowerCase(Locale.ROOT);
    }

    private double similarity(String left, String right) {
        if (left.isEmpty() || right.isEmpty()) return left.equals(right) ? 1 : 0;
        int[] distances = new int[right.length() + 1];
        for (int index = 0; index <= right.length(); index++) distances[index] = index;
        for (int leftIndex = 1; leftIndex <= left.length(); leftIndex++) {
            int diagonal = distances[0];
            distances[0] = leftIndex;
            for (int rightIndex = 1; rightIndex <= right.length(); rightIndex++) {
                int above = distances[rightIndex];
                distances[rightIndex] = Math.min(
                        Math.min(distances[rightIndex] + 1, distances[rightIndex - 1] + 1),
                        diagonal + (left.charAt(leftIndex - 1) == right.charAt(rightIndex - 1) ? 0 : 1)
                );
                diagonal = above;
            }
        }
        return 1 - (double) distances[right.length()] / Math.max(left.length(), right.length());
    }
}
