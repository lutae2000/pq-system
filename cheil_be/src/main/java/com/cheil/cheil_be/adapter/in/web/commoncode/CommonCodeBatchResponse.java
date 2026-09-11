package com.cheil.cheil_be.adapter.in.web.commoncode;

import java.util.List;

public record CommonCodeBatchResponse(
        String key,
        List<CommonCodeResponse> items
) {
}
