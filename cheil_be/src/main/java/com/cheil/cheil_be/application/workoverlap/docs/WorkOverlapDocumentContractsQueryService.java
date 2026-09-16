package com.cheil.cheil_be.application.workoverlap.docs;

import com.cheil.cheil_be.adapter.in.web.workoverlap.contract.WorkOverlapEngineerContractResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentEngineerContractsResponse;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapDocumentSavedContractResponse;
import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapDocumentContract;
import com.cheil.cheil_be.application.workoverlap.docs.model.WorkOverlapDocumentContractRow;
import com.cheil.cheil_be.application.workoverlap.docs.port.out.WorkOverlapDocumentContractQueryRepository;
import com.cheil.cheil_be.common.web.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkOverlapDocumentContractsQueryService {

    private static final DateTimeFormatter BASIC_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final WorkOverlapDocumentContractQueryRepository repository;

    @Transactional(readOnly = true)
    public WorkOverlapDocumentEngineerContractsResponse findContracts(
            String engineerId,
            Long bidSeq,
            String workDutyId,
            String referenceDate,
            String remainingDays,
            Pageable pageable
    ) {
        String normalizedEngineerId = required(engineerId, "engineerId");
        String normalizedWorkDutyId = required(workDutyId, "workDutyId");
        if (bidSeq == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "bidSeq is required.");
        }

        String normalizedReferenceDate = normalizeReferenceDate(referenceDate);
        int normalizedRemainingDays = positiveInteger(remainingDays, "remainingDays");
        List<WorkOverlapDocumentContractRow> availableRows = repository.findAvailable(
                normalizedEngineerId,
                bidSeq,
                normalizedWorkDutyId,
                normalizedReferenceDate,
                normalizedRemainingDays
        );
        List<WorkOverlapDocumentContractRow> savedRows = repository.findSaved(
                normalizedEngineerId,
                bidSeq,
                normalizedWorkDutyId,
                normalizedReferenceDate,
                normalizedRemainingDays
        );

        List<WorkOverlapEngineerContractResponse> pageRows = availableRows.stream()
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .map(WorkOverlapDocumentContractRow::contract)
                .map(this::toResponse)
                .toList();
        PageResponse<WorkOverlapEngineerContractResponse> availableContracts = PageResponse.from(
                new PageImpl<>(pageRows, pageable, availableRows.size())
        );
        List<WorkOverlapDocumentSavedContractResponse> savedContracts = savedRows.stream()
                .sorted(Comparator.comparing(
                                WorkOverlapDocumentContractRow::displayOrder,
                                Comparator.nullsLast(Integer::compareTo)
                        )
                        .thenComparing(WorkOverlapDocumentContractRow::targetId))
                .map(row -> new WorkOverlapDocumentSavedContractResponse(
                        row.targetId(),
                        row.displayOrder(),
                        row.responsibility(),
                        toResponse(row.contract())
                ))
                .toList();

        return new WorkOverlapDocumentEngineerContractsResponse(
                availableContracts,
                savedContracts
        );
    }

    private WorkOverlapEngineerContractResponse toResponse(WorkOverlapDocumentContract contract) {
        return new WorkOverlapEngineerContractResponse(
                contract.contractNo(),
                contract.serviceType(),
                contract.clientName(),
                contract.supervisingDepartmentCode(),
                contract.publicContractYn(),
                contract.serviceName(),
                contract.constructionStartDate(),
                contract.constructionCompleteDate(),
                contract.managementServiceCompleteDate(),
                contract.constructionStopFromDate(),
                contract.constructionStopToDate(),
                contract.restartDate(),
                contract.contractAmount(),
                contract.shareAmount(),
                contract.performanceCertification(),
                contract.participateListDocument(),
                contract.cemsConfirm(),
                contract.remark(),
                contract.createdAt(),
                contract.createdId(),
                contract.lastChangedAt(),
                contract.lastChangedId(),
                contract.participationType(),
                contract.pqTargetYn(),
                contract.remainDate(),
                contract.checkYn(),
                null,
                null,
                false
        );
    }

    private String required(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }
        return value.trim();
    }

    private String normalizeReferenceDate(String value) {
        String normalized = value == null || value.isBlank()
                ? LocalDate.now().format(BASIC_DATE_FORMATTER)
                : value.trim().replace("-", "");
        if (!normalized.matches("\\d{8}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "referenceDate must be YYYYMMDD."
            );
        }
        return normalized;
    }

    private int positiveInteger(String value, String fieldName) {
        if (value == null || !value.matches("\\d+") || Integer.parseInt(value) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must be a positive integer."
            );
        }
        return Integer.parseInt(value);
    }
}
