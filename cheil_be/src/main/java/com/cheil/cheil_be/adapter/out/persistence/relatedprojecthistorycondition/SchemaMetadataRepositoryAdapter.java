package com.cheil.cheil_be.adapter.out.persistence.relatedprojecthistorycondition;

import com.cheil.cheil_be.application.relatedprojecthistorycondition.port.out.SchemaMetadataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Repository
@RequiredArgsConstructor
public class SchemaMetadataRepositoryAdapter implements SchemaMetadataRepository {
    private final JdbcClient jdbcClient;

    @Override
    public Set<String> findExistingColumns() {
        return jdbcClient.sql("""
                        SELECT table_name, column_name
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                        """)
                .query((rs, rowNum) -> rs.getString("table_name").toLowerCase(Locale.ROOT)
                        + ":" + rs.getString("column_name").toLowerCase(Locale.ROOT))
                .list()
                .stream()
                .collect(java.util.stream.Collectors.toCollection(HashSet::new));
    }
}
