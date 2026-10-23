package com.cheil.cheil_be.application.client.port.in;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.cheil.cheil_be.application.client.model.ClientSearchCondition;
import com.cheil.cheil_be.application.client.model.ClientUpsertCommand;
import com.cheil.cheil_be.domain.client.Client;

public interface ClientUseCase {

    Page<Client> findAll(ClientSearchCondition condition, Pageable pageable);

    Client findByClientCode(String clientCode);

    Client create(ClientUpsertCommand command);

    Client update(String clientCode, ClientUpsertCommand command);

    void delete(String clientCode);
}
