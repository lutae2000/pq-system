package com.cheil.cheil_be.application.relatedprojecthistory.condition.port.out;

import java.util.Set;

public interface SchemaMetadataRepository {
    Set<String> findExistingColumns();
}
