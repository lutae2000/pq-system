package com.cheil.batch.common.web;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public final class QueryStringBuilder {

    private final List<String> parameters = new ArrayList<>();

    public QueryStringBuilder add(String name, Object value) {
        if (value != null) {
            parameters.add(encode(name) + "=" + encode(String.valueOf(value)));
        }
        return this;
    }

    public QueryStringBuilder addAll(String name, Iterable<?> values) {
        if (values != null) {
            for (Object value : values) {
                add(name, value);
            }
        }
        return this;
    }

    public String build() {
        return String.join("&", parameters);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
