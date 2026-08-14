package com.cheil.cheil_be.adapter.out.persistence.client;

import static com.cheil.cheil_be.adapter.out.persistence.client.QClientEntity.clientEntity;

import java.util.Locale;
import java.util.List;
import java.util.Optional;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;

import com.cheil.cheil_be.application.client.port.in.ClientSearchCondition;
import com.cheil.cheil_be.application.client.port.out.ClientRepository;
import com.cheil.cheil_be.domain.client.Client;

@Repository
@RequiredArgsConstructor
public class JpaClientRepository implements ClientRepository {

    private final ClientJpaRepository clientJpaRepository;
    private final JPAQueryFactory queryFactory;

    @Override
    public List<Client> findAll() {
        return clientJpaRepository.findAll().stream()
                .map(ClientEntity::toDomain)
                .toList();
    }

    @Override
    public Page<Client> findAll(ClientSearchCondition condition, Pageable pageable) {
        BooleanBuilder predicate = toPredicate(condition);
        var query = queryFactory
                .selectFrom(clientEntity)
                .where(predicate)
                .orderBy(clientEntity.clientCode.length().asc(), clientEntity.clientCode.asc());

        if (pageable.isPaged()) {
            query.offset(pageable.getOffset()).limit(pageable.getPageSize());
        }

        var content = query.fetch().stream().map(ClientEntity::toDomain).toList();
        return PageableExecutionUtils.getPage(
                content,
                pageable,
                () -> queryFactory.select(clientEntity.count())
                        .from(clientEntity)
                        .where(predicate)
                        .fetchOne()
        );
    }

    @Override
    public Optional<Client> findByClientCode(String clientCode) {
        return clientJpaRepository.findById(clientCode).map(ClientEntity::toDomain);
    }

    @Override
    public boolean existsByClientCode(String clientCode) {
        return clientJpaRepository.existsById(clientCode);
    }

    @Override
    public Client save(Client client) {
        ClientEntity entity = clientJpaRepository.findById(client.clientCode())
                .map(existing -> {
                    existing.updateFrom(client);
                    return existing;
                })
                .orElseGet(() -> ClientEntity.from(client));

        return clientJpaRepository.save(entity).toDomain();
    }

    @Override
    public void deleteByClientCode(String clientCode) {
        clientJpaRepository.deleteById(clientCode);
    }

    private BooleanBuilder toPredicate(ClientSearchCondition condition) {
        BooleanBuilder predicate = new BooleanBuilder();
        if (condition == null) {
            return predicate;
        }

        if (StringUtils.hasText(condition.businessName())) {
            String keyword = "%" + condition.businessName().trim().toLowerCase(Locale.ROOT) + "%";
            predicate.and(
                    clientEntity.clientCode.lower().like(keyword)
                            .or(clientEntity.orderName.lower().like(keyword))
                            .or(clientEntity.orderNameLong.lower().like(keyword))
                            .or(clientEntity.orderEngName.lower().like(keyword))
                            .or(clientEntity.businessNo.lower().like(keyword))
            );
        }

        if (StringUtils.hasText(condition.orderClass())) {
            predicate.and(clientEntity.orderClass.eq(condition.orderClass().trim()));
        }

        if (StringUtils.hasText(condition.companyType())) {
            predicate.and(clientEntity.companyType.eq(condition.companyType().trim()));
        }

        return predicate;
    }
}
