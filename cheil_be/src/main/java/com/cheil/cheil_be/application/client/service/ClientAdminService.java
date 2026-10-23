package com.cheil.cheil_be.application.client.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.conflict;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.notFound;
import java.time.Clock;
import java.time.Instant;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cheil.cheil_be.application.client.model.ClientSearchCondition;
import com.cheil.cheil_be.application.client.model.ClientUpsertCommand;
import com.cheil.cheil_be.application.client.port.in.ClientUseCase;
import com.cheil.cheil_be.application.client.port.out.ClientRepository;
import com.cheil.cheil_be.application.common.validation.InputValues;
import com.cheil.cheil_be.common.text.StringValues;
import com.cheil.cheil_be.domain.client.Client;

@Service
@RequiredArgsConstructor
public class ClientAdminService implements ClientUseCase {

    private final ClientRepository clientRepository;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public Page<Client> findAll(ClientSearchCondition condition, Pageable pageable) {
        if (pageable == null) throw badRequest("페이지 정보는 필수입니다.");
        ClientSearchCondition normalized = condition == null
                ? new ClientSearchCondition(null, null, null)
                : new ClientSearchCondition(
                        StringValues.trimToNull(condition.businessName()),
                        StringValues.trimToNull(condition.orderClass()),
                        StringValues.trimToNull(condition.companyType()));
        return clientRepository.findAll(normalized, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Client findByClientCode(String clientCode) {
        return clientRepository.findByClientCode(InputValues.requiredText(clientCode, "clientCode"))
                .orElseThrow(() -> notFound("거래처 정보를 찾을 수 없습니다."));
    }

    @Override
    @Transactional
    public Client create(ClientUpsertCommand command) {
        InputValues.requireNonNull(command, "요청 본문은 필수입니다.");
        if (clientRepository.existsByClientCode(command.clientCode())) {
            throw conflict("이미 존재하는 거래처 코드입니다.");
        }
        return clientRepository.save(command.toDomain(null, Instant.now(clock)));
    }

    @Override
    @Transactional
    public Client update(String clientCode, ClientUpsertCommand command) {
        InputValues.requireNonNull(command, "요청 본문은 필수입니다.");
        Client existing = findByClientCode(clientCode);
        if (!existing.clientCode().equals(command.clientCode())) {
            throw badRequest("거래처 코드는 수정할 수 없습니다.");
        }
        return clientRepository.save(command.toDomain(existing, Instant.now(clock)));
    }

    @Override
    @Transactional
    public void delete(String clientCode) {
        findByClientCode(clientCode);
        clientRepository.deleteByClientCode(InputValues.requiredText(clientCode, "clientCode"));
    }

}
