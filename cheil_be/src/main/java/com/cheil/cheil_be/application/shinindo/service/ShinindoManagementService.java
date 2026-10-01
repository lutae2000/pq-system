package com.cheil.cheil_be.application.shinindo.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.shinindo.exception.ShinindoApplicationException;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagement;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSaveCommand;
import com.cheil.cheil_be.application.shinindo.port.in.ShinindoManagementUseCase;
import com.cheil.cheil_be.application.shinindo.port.out.ShinindoManagementRepository;
import com.cheil.cheil_be.common.text.StringValues;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShinindoManagementService implements ShinindoManagementUseCase {
    private static final int CLIENT_CODE_MAX_LENGTH = 20;
    private static final int ITEM_NAME_MAX_LENGTH = 300;
    private static final int REMARK_MAX_LENGTH = 1000;
    private static final DateTimeFormatter COMPACT_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final ShinindoManagementRepository repository;
    private final CurrentActorPort currentActorPort;

    @Override
    @Transactional(readOnly = true)
    public Page<ShinindoManagement> findAll(String keyword, String clientCode, String referenceDate, Pageable pageable) {
        return repository.findAll(keyword, clientCode, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public ShinindoManagement findById(Long id) {
        if (id == null) throw invalid("id는 필수입니다.");
        return repository.findById(id).orElseThrow(this::notFound);
    }

    @Override
    @Transactional
    public ShinindoManagement create(ShinindoManagementSaveCommand command) {
        ShinindoManagementSaveCommand normalized = normalizeAndValidate(command);
        ensureClientExists(normalized.clientCode());
        return findById(repository.create(withActor(normalized)));
    }

    @Override
    @Transactional
    public ShinindoManagement update(Long id, ShinindoManagementSaveCommand command) {
        findById(id);
        ShinindoManagementSaveCommand normalized = normalizeAndValidate(command);
        ensureClientExists(normalized.clientCode());
        repository.update(id, withActor(normalized));
        return findById(id);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        findById(id);
        if (!repository.delete(id)) throw notFound();
    }

    private ShinindoManagementSaveCommand normalizeAndValidate(ShinindoManagementSaveCommand command) {
        if (command == null) throw invalid("요청 본문은 필수입니다.");
        String clientCode = StringValues.required(command.clientCode(), "clientCode");
        String itemName = StringValues.required(command.itemName(), "itemName");
        StringValues.validateMaxLength(clientCode, CLIENT_CODE_MAX_LENGTH, "clientCode");
        StringValues.validateMaxLength(itemName, ITEM_NAME_MAX_LENGTH, "itemName");
        StringValues.validateMaxLength(StringValues.normalize(command.remark()), REMARK_MAX_LENGTH, "remark");
        return new ShinindoManagementSaveCommand(
                clientCode, itemName, normalizeAppliedYn(command.appliedYn()), normalizeScore(command.score()),
                normalizeDate(command.acquiredDate(), "acquiredDate"), normalizeDate(command.validUntil(), "validUntil"),
                nullIfBlank(command.remark()), null
        );
    }

    private ShinindoManagementSaveCommand withActor(ShinindoManagementSaveCommand command) {
        return new ShinindoManagementSaveCommand(command.clientCode(), command.itemName(), command.appliedYn(),
                command.score(), command.acquiredDate(), command.validUntil(), command.remark(), currentActorPort.currentActor());
    }

    private void ensureClientExists(String clientCode) {
        if (!repository.clientExists(clientCode)) throw invalid("존재하지 않는 발주처 코드입니다.");
    }

    private String normalizeAppliedYn(String value) {
        String normalized = StringValues.required(value, "appliedYn").trim().toUpperCase(Locale.ROOT);
        if (!"Y".equals(normalized) && !"N".equals(normalized)) throw invalid("appliedYn은 Y 또는 N이어야 합니다.");
        return normalized;
    }

    private BigDecimal normalizeScore(BigDecimal value) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) throw invalid("score는 0 이상이어야 합니다.");
        return value;
    }

    private String normalizeDate(String value, String fieldName) {
        String normalized = StringValues.normalize(value);
        if (normalized == null || normalized.isBlank()) return null;
        // 화면에서 하이픈 날짜도 허용하되, 저장소에는 YYYYMMDD 형식으로 통일합니다.
        String compact = normalized.replace("-", "");
        if (!compact.matches("\\d{8}")) throw invalid(fieldName + "은 YYYYMMDD 형식이어야 합니다.");
        try { LocalDate.parse(compact, COMPACT_DATE_FORMATTER); }
        catch (DateTimeParseException exception) { throw invalid(fieldName + "은 YYYYMMDD 형식이어야 합니다."); }
        return compact;
    }

    private String nullIfBlank(String value) {
        String normalized = StringValues.normalize(value);
        return normalized == null || normalized.isBlank() ? null : normalized;
    }

    private ShinindoApplicationException invalid(String message) {
        return new ShinindoApplicationException(ShinindoApplicationException.Type.BAD_REQUEST, message);
    }

    private ShinindoApplicationException notFound() {
        return new ShinindoApplicationException(ShinindoApplicationException.Type.NOT_FOUND, "신인도 정보를 찾을 수 없습니다.");
    }
}
