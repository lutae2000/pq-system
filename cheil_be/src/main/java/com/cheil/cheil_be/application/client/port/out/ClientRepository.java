package com.cheil.cheil_be.application.client.port.out;

import java.util.Optional;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.cheil.cheil_be.application.client.port.in.ClientSearchCondition;
import com.cheil.cheil_be.domain.client.Client;

public interface ClientRepository {

    List<Client> findAll();

    Page<Client> findAll(ClientSearchCondition condition, Pageable pageable);

    Optional<Client> findByClientCode(String clientCode);

    boolean existsByClientCode(String clientCode);

    Client save(Client client);

    void deleteByClientCode(String clientCode);
}
