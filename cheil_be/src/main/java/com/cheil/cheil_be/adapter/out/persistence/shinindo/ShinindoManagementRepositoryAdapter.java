package com.cheil.cheil_be.adapter.out.persistence.shinindo;

import com.cheil.cheil_be.application.shinindo.model.ShinindoManagement;
import com.cheil.cheil_be.application.shinindo.model.ShinindoManagementSaveCommand;
import com.cheil.cheil_be.application.shinindo.port.out.ShinindoManagementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ShinindoManagementRepositoryAdapter implements ShinindoManagementRepository {

    private final JdbcClient jdbcClient;

    @Override
    public Page<ShinindoManagement> findAll(
            String keyword,
            String clientCode,
            Pageable pageable
    ) {
        QueryParts queryParts = buildWhere(keyword, clientCode);
        String listSql = """
                SELECT management.id,
                       management.client_code,
                       COALESCE(client.order_name_long, client.order_name, management.client_code) AS client_name,
                       management.item_name,
                       management.applied_yn,
                       management.score,
                       management.acquired_date,
                       management.valid_until,
                       management.remark,
                       management.created_at,
                       management.created_id,
                       management.last_changed_at,
                       management.last_changed_id
                FROM shinindo_managements management
                LEFT JOIN clients client ON client.client_code = management.client_code
                """ + queryParts.whereSql() + """
                ORDER BY management.client_code, management.item_name, management.id DESC
                LIMIT :limit OFFSET :offset
                """;

        Map<String, Object> listParameters = new LinkedHashMap<>(queryParts.parameters());
        listParameters.put("limit", pageable.getPageSize());
        listParameters.put("offset", pageable.getOffset());
        List<ShinindoManagement> content = bindParameters(
                jdbcClient.sql(listSql),
                listParameters
        )
                .query(this::mapManagement)
                .list();

        String countSql = """
                SELECT COUNT(*)
                FROM shinindo_managements management
                LEFT JOIN clients client ON client.client_code = management.client_code
                """ + queryParts.whereSql();
        Long total = bindParameters(
                jdbcClient.sql(countSql),
                queryParts.parameters()
        )
                .query(Long.class)
                .single();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    @Override
    public java.util.Optional<ShinindoManagement> findById(Long id) {
        return jdbcClient.sql("""
                        SELECT management.id,
                               management.client_code,
                               COALESCE(client.order_name_long, client.order_name, management.client_code) AS client_name,
                               management.item_name,
                               management.applied_yn,
                               management.score,
                               management.acquired_date,
                               management.valid_until,
                               management.remark,
                               management.created_at,
                               management.created_id,
                               management.last_changed_at,
                               management.last_changed_id
                        FROM shinindo_managements management
                        LEFT JOIN clients client ON client.client_code = management.client_code
                        WHERE management.id = :id
                        """)
                .param("id", id)
                .query(this::mapManagement)
                .optional();
    }

    @Override
    public boolean clientExists(String clientCode) {
        Boolean exists = jdbcClient.sql("""
                        SELECT EXISTS (
                            SELECT 1
                            FROM clients
                            WHERE client_code = :clientCode
                        )
                        """)
                .param("clientCode", clientCode)
                .query(Boolean.class)
                .single();
        return Boolean.TRUE.equals(exists);
    }

    @Override
    public Long create(ShinindoManagementSaveCommand command) {
        return jdbcClient.sql("""
                        INSERT INTO shinindo_managements (
                            client_code,
                            item_name,
                            applied_yn,
                            score,
                            acquired_date,
                            valid_until,
                            remark,
                            created_id,
                            last_changed_id
                        )
                        VALUES (
                            :clientCode,
                            :itemName,
                            :appliedYn,
                            :score,
                            :acquiredDate,
                            :validUntil,
                            :remark,
                            :actor,
                            :actor
                        )
                        RETURNING id
                        """)
                .param("clientCode", command.clientCode())
                .param("itemName", command.itemName())
                .param("appliedYn", command.appliedYn())
                .param("score", command.score())
                .param("acquiredDate", command.acquiredDate())
                .param("validUntil", command.validUntil())
                .param("remark", command.remark())
                .param("actor", command.actor())
                .query(Long.class)
                .single();
    }

    @Override
    public void update(Long id, ShinindoManagementSaveCommand command) {
        jdbcClient.sql("""
                        UPDATE shinindo_managements
                        SET client_code = :clientCode,
                            item_name = :itemName,
                            applied_yn = :appliedYn,
                            score = :score,
                            acquired_date = :acquiredDate,
                            valid_until = :validUntil,
                            remark = :remark,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("clientCode", command.clientCode())
                .param("itemName", command.itemName())
                .param("appliedYn", command.appliedYn())
                .param("score", command.score())
                .param("acquiredDate", command.acquiredDate())
                .param("validUntil", command.validUntil())
                .param("remark", command.remark())
                .param("actor", command.actor())
                .update();
    }

    @Override
    public boolean delete(Long id) {
        return jdbcClient.sql("DELETE FROM shinindo_managements WHERE id = :id")
                .param("id", id)
                .update() == 1;
    }

    private QueryParts buildWhere(String keyword, String clientCode) {
        StringBuilder where = new StringBuilder("WHERE 1 = 1\n");
        Map<String, Object> parameters = new LinkedHashMap<>();

        if (StringUtils.hasText(keyword)) {
            where.append("""
                    AND (
                        LOWER(management.item_name) LIKE :keyword
                        OR LOWER(COALESCE(management.remark, '')) LIKE :keyword
                        OR LOWER(COALESCE(client.order_name_long, client.order_name, management.client_code)) LIKE :keyword
                    )
                    """);
            parameters.put("keyword", "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%");
        }
        if (StringUtils.hasText(clientCode)) {
            where.append("AND LOWER(management.client_code) LIKE :clientCode\n");
            parameters.put("clientCode", "%" + clientCode.trim().toLowerCase(Locale.ROOT) + "%");
        }
        return new QueryParts(where.toString(), parameters);
    }

    private ShinindoManagement mapManagement(ResultSet resultSet, int rowNumber) throws SQLException {
        return new ShinindoManagement(
                resultSet.getLong("id"),
                resultSet.getString("client_code"),
                resultSet.getString("client_name"),
                resultSet.getString("item_name"),
                resultSet.getString("applied_yn"),
                resultSet.getBigDecimal("score"),
                resultSet.getString("acquired_date"),
                resultSet.getString("valid_until"),
                resultSet.getString("remark"),
                toInstant(resultSet.getTimestamp("created_at")),
                resultSet.getString("created_id"),
                toInstant(resultSet.getTimestamp("last_changed_at")),
                resultSet.getString("last_changed_id")
        );
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private JdbcClient.StatementSpec bindParameters(
            JdbcClient.StatementSpec statement,
            Map<String, Object> parameters
    ) {
        JdbcClient.StatementSpec bound = statement;
        for (Map.Entry<String, Object> entry : parameters.entrySet()) {
            bound = bound.param(entry.getKey(), entry.getValue());
        }
        return bound;
    }

    private record QueryParts(String whereSql, Map<String, Object> parameters) {
    }
}
