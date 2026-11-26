package com.cheil.cheil_be.adapter.out.persistence.client;

import static org.assertj.core.api.Assertions.assertThat;

import com.cheil.cheil_be.application.client.model.ClientUpsertCommand;
import com.cheil.cheil_be.domain.client.Client;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ClientEntityTest {
    @Test
    void storesAndClearsTheClientCategoryIndependentlyOfTheOrderClass() {
        ClientEntity entity = ClientEntity.from(client("공공기관"));

        assertThat(entity.toDomain().clientCategory()).isEqualTo("공공기관");
        assertThat(entity.toDomain().orderClass()).isEqualTo("A");

        entity.updateFrom(client(null));

        assertThat(entity.toDomain().clientCategory()).isNull();
        assertThat(entity.toDomain().orderClass()).isEqualTo("A");
    }

    private static Client client(String category) {
        return new ClientUpsertCommand("C1", null, null, null, "발주처",
                null, null, null, "A", category, null, null, null,
                null, null, null, null, null, null).toDomain(null, Instant.EPOCH, "TEST");
    }
}
