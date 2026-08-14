package com.cheil.cheil_be.common.file;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

/**
 * 파일 다운로드 응답을 전달하는 값 객체입니다.
 * <p>
 * 파일 식별자, 실제 리소스, 원본 파일명, MIME 타입, 크기를 함께 담아 컨트롤러가 그대로 응답에 사용합니다.
 */
public record FileDownloadResult(
        String fileId,
        Resource resource,
        String originalFilename,
        MediaType mediaType,
        long size
) {
}
