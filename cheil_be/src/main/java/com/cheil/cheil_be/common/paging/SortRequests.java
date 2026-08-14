package com.cheil.cheil_be.common.paging;

import java.util.Map;

import lombok.experimental.UtilityClass;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;

@UtilityClass
public class SortRequests {

    public static Sort byAllowed(String requestedProperty, String direction, Map<String, String> allowedProperties) {
        if (!StringUtils.hasText(requestedProperty) || allowedProperties == null || allowedProperties.isEmpty()) {
            return Sort.unsorted();
        }

        String entityProperty = allowedProperties.get(requestedProperty.trim());
        if (!StringUtils.hasText(entityProperty)) {
            return Sort.unsorted();
        }

        Sort.Direction resolvedDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return Sort.by(resolvedDirection, entityProperty);
    }
}
