package com.cheil.cheil_be.application.relatedprojecthistorycondition.port.out;

import java.util.Set;

public interface SchemaMetadataRepository {
    Set<String> findExistingColumns();
}
