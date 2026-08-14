package com.cheil.cheil_be.common.file;

/**
 * 파일 업로드 결과를 전달하는 값 객체입니다.
 * <p>
 * 저장된 파일 식별자와 다운로드 주소를 함께 반환해서, 업로드 직후 화면 갱신에 바로 사용할 수 있게 합니다.
 */
public record FileStorageResult(
        String fileId,
        String originalFilename,
        String contentType,
        long size,
        String downloadUrl
) {
}
