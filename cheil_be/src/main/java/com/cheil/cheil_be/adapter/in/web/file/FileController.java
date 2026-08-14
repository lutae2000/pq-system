package com.cheil.cheil_be.adapter.in.web.file;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cheil.cheil_be.common.file.FileDownloadResult;
import com.cheil.cheil_be.common.file.FileStorageResult;
import com.cheil.cheil_be.common.file.FileStorageService;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    /**
     * 파일 업로드를 처리하고 다운로드 URL을 반환한다.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) String ownerId,
            @RequestParam(required = false) String attachmentType
    ) {
        FileStorageResult result = fileStorageService.upload(file, ownerType, ownerId, attachmentType);
        return ResponseEntity.created(java.net.URI.create(result.downloadUrl()))
                .body(FileUploadResponse.from(result));
    }

    /**
     * 파일을 다운로드한다.
     */
    @GetMapping("/{fileId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String fileId) throws IOException {
        FileDownloadResult result = fileStorageService.download(fileId);
        byte[] body;
        try (var inputStream = result.resource().getInputStream()) {
            body = inputStream.readAllBytes();
        }
        return ResponseEntity.ok()
                .contentType(result.mediaType())
                .contentLength(body.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(result.originalFilename(), StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(body);
    }
}
