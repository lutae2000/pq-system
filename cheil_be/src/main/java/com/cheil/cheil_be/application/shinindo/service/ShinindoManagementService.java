package com.cheil.cheil_be.application.shinindo.service;

import com.cheil.cheil_be.adapter.in.web.shinindo.ShinindoManagementRequest;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagement;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSaveCommand;
import com.cheil.cheil_be.application.shinindo.port.out.ShinindoManagementRepository;
import com.cheil.cheil_be.common.text.StringValues;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ShinindoManagementService {

    private static final int CLIENT_CODE_MAX_LENGTH = 20;
    private static final int ITEM_NAME_MAX_LENGTH = 300;
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final DateTimeFormatter COMPACT_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final ShinindoManagementRepository repository;
    private final CurrentActorPort currentActorPort;

    @Transactional(readOnly = true)
    public Page<ShinindoManagement> findAll(
            String keyword,
            String clientCode,
            String referenceDate,
            Pageable pageable
    ) {
        return repository.findAll(keyword, clientCode, pageable);
    }

    @Transactional(readOnly = true)
    public ShinindoManagement findById(Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id is required.");
        }
        return repository.findById(id)
                .orElseThrow(this::notFound);
    }

    @Transactional
    public ShinindoManagement create(ShinindoManagementRequest request) {
        ShinindoManagementSaveCommand command = toCommand(request);
        ensureClientExists(command.clientCode());
        return findById(repository.create(command));
    }

    @Transactional
    public ShinindoManagement update(Long id, ShinindoManagementRequest request) {
        findById(id);
        ShinindoManagementSaveCommand command = toCommand(request);
        ensureClientExists(command.clientCode());
        repository.update(id, command);
        return findById(id);
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        if (!repository.delete(id)) {
            throw notFound();
        }
    }

    private ShinindoManagementSaveCommand toCommand(ShinindoManagementRequest request) {
        validate(request);
        return new ShinindoManagementSaveCommand(
                StringValues.required(request.clientCode(), "clientCode"),
                StringValues.required(request.itemName(), "itemName"),
                normalizeAppliedYn(request.appliedYn()),
                normalizeScore(request.score()),
                normalizeDate(request.acquiredDate(), "acquiredDate", false),
                normalizeDate(request.validUntil(), "validUntil", false),
                nullIfBlank(request.remark()),
                currentActorPort.currentActor()
        );
    }

    private void validate(ShinindoManagementRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

        StringValues.validateMaxLength(
                StringValues.required(request.clientCode(), "clientCode"),
                CLIENT_CODE_MAX_LENGTH,
                "clientCode"
        );
        StringValues.validateMaxLength(
                StringValues.required(request.itemName(), "itemName"),
                ITEM_NAME_MAX_LENGTH,
                "itemName"
        );
        StringValues.validateMaxLength(
                StringValues.normalize(request.remark()),
                REMARK_MAX_LENGTH,
                "remark"
        );
        normalizeAppliedYn(request.appliedYn());
        normalizeScore(request.score());
        normalizeDate(request.acquiredDate(), "acquiredDate", false);
        normalizeDate(request.validUntil(), "validUntil", false);
    }

    private void ensureClientExists(String clientCode) {
        if (!repository.clientExists(clientCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 발주처 코드입니다.");
        }
    }

    private String normalizeAppliedYn(String value) {
        String normalized = StringValues.required(value, "appliedYn")
                .trim()
                .toUpperCase(Locale.ROOT);
        if (!"Y".equals(normalized) && !"N".equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "appliedYn must be Y or N.");
        }
        return normalized;
    }

    private BigDecimal normalizeScore(BigDecimal value) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "score must be greater than or equal to 0."
            );
        }
        return value;
    }

    private String normalizeDate(String value, String fieldName, boolean required) {
        String normalized = StringValues.normalize(value);
        if (!StringUtils.hasText(normalized)) {
            if (required) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        fieldName + " is required."
                );
            }
            return null;
        }

        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) {
            throw invalidDate(fieldName);
        }
        try {
            LocalDate.parse(compact, COMPACT_DATE_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw invalidDate(fieldName);
        }
        return compact;
    }

    private ResponseStatusException invalidDate(String fieldName) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                fieldName + " must be YYYYMMDD."
        );
    }

    private String nullIfBlank(String value) {
        String normalized = StringValues.normalize(value);
        return StringUtils.hasText(normalized) ? normalized : null;
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "신인도 정보를 찾을 수 없습니다.");
    }
}
