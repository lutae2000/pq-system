package com.cheil.cheil_be.application.shinindo.service;

import com.cheil.cheil_be.application.common.validation.InputValues;

import static com.cheil.cheil_be.application.common.validation.InputValues.basicDate;
import static com.cheil.cheil_be.application.common.validation.InputValues.nonNegative;
import static com.cheil.cheil_be.common.text.StringValues.trimToNull;

import java.util.Locale;

import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagement;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSaveCommand;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSearch;
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
    private final ShinindoManagementRepository repository;
    private final CurrentActorPort currentActorPort;

    @Override
    @Transactional(readOnly = true)
    public Page<ShinindoManagement> findAll(ShinindoManagementSearch search, Pageable pageable) {
        if (search == null || pageable == null) throw ApplicationException.badRequest("조회 조건과 페이지 정보는 필수입니다.");
        return repository.findAll(new ShinindoManagementSearch(
                trimToNull(search.keyword()), trimToNull(search.clientCode()), trimToNull(search.referenceDate())
        ), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public ShinindoManagement findById(Long id) {
        if (id == null) throw ApplicationException.badRequest("id는 필수입니다.");
        return repository.findById(id)
                .orElseThrow(() -> ApplicationException.notFound("신인도 정보를 찾을 수 없습니다."));
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
        if (!repository.delete(id)) throw ApplicationException.notFound("신인도 정보를 찾을 수 없습니다.");
    }

    private ShinindoManagementSaveCommand normalizeAndValidate(ShinindoManagementSaveCommand command) {
        if (command == null) throw ApplicationException.badRequest("요청 본문은 필수입니다.");
        String clientCode = InputValues.requiredText(command.clientCode(), "clientCode");
        String itemName = InputValues.requiredText(command.itemName(), "itemName");
        InputValues.validateMaxLength(clientCode, CLIENT_CODE_MAX_LENGTH, "clientCode");
        InputValues.validateMaxLength(itemName, ITEM_NAME_MAX_LENGTH, "itemName");
        InputValues.validateMaxLength(StringValues.normalize(command.remark()), REMARK_MAX_LENGTH, "remark");
        return new ShinindoManagementSaveCommand(
                clientCode, itemName, normalizeAppliedYn(command.appliedYn()), nonNegative(command.score(), "score"),
                basicDate(command.acquiredDate(), "acquiredDate", false), basicDate(command.validUntil(), "validUntil", false),
                trimToNull(command.remark()), null
        );
    }

    private ShinindoManagementSaveCommand withActor(ShinindoManagementSaveCommand command) {
        return new ShinindoManagementSaveCommand(command.clientCode(), command.itemName(), command.appliedYn(),
                command.score(), command.acquiredDate(), command.validUntil(), command.remark(), currentActorPort.currentActor());
    }

    private void ensureClientExists(String clientCode) {
        if (!repository.clientExists(clientCode)) throw ApplicationException.badRequest("존재하지 않는 발주처 코드입니다.");
    }

    private String normalizeAppliedYn(String value) {
        String normalized = InputValues.requiredText(value, "appliedYn").trim().toUpperCase(Locale.ROOT);
        if (!"Y".equals(normalized) && !"N".equals(normalized)) {
            throw ApplicationException.badRequest("appliedYn은 Y 또는 N이어야 합니다.");
        }
        return normalized;
    }

}
