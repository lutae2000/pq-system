package com.cheil.cheil_be.adapter.out.persistence.client;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

interface ClientJpaRepository extends JpaRepository<ClientEntity, String>, JpaSpecificationExecutor<ClientEntity> {
}
