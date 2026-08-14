package com.cheil.cheil_be.common.file;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentEntity;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentJpaRepository;
import com.cheil.cheil_be.config.file.AppFileProperties;

class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void uploadStoresFileAndMetadata() throws Exception {
        AtomicReference<AppFileAttachmentEntity> savedAttachment = new AtomicReference<>();
        AppFileAttachmentJpaRepository attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        when(attachmentRepository.save(any(AppFileAttachmentEntity.class))).thenAnswer(invocation -> {
            AppFileAttachmentEntity entity = invocation.getArgument(0);
            savedAttachment.set(entity);
            return entity;
        });
        when(attachmentRepository.findByFileId(any())).thenAnswer(invocation -> {
            AppFileAttachmentEntity entity = savedAttachment.get();
            return entity != null && entity.getFileId().equals(invocation.getArgument(0))
                    ? Optional.of(entity)
                    : Optional.empty();
        });
        FileStorageService service = new FileStorageService(fileProperties("https://files.example.com"), attachmentRepository);
        service.initialize();

        FileStorageResult result = service.upload(new MockMultipartFile(
                "file",
                "report.txt",
                "text/plain",
                "hello".getBytes(StandardCharsets.UTF_8)
        ));

        assertThat(result.fileId()).isNotBlank();
        assertThat(result.downloadUrl()).isEqualTo("https://files.example.com/files/" + result.fileId());
        AppFileAttachmentEntity metadata = savedAttachment.get();
        assertThat(metadata).isNotNull();
        assertThat(metadata.getStoredFilename()).isEqualTo("report__" + result.fileId() + ".txt");
        assertThat(Files.exists(tempDir.resolve(metadata.getStoredPath()).resolve(metadata.getStoredFilename()))).isTrue();

        FileDownloadResult downloaded = service.download(result.fileId());
        assertThat(downloaded.originalFilename()).isEqualTo("report.txt");
        assertThat(downloaded.mediaType().toString()).isEqualTo("text/plain");
        assertThat(downloaded.size()).isEqualTo(5L);
        assertThat(new String(downloaded.resource().getInputStream().readAllBytes(), StandardCharsets.UTF_8)).isEqualTo("hello");
    }

    @Test
    void downloadRejectsUnknownFileId() {
        AppFileAttachmentJpaRepository attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        when(attachmentRepository.findByFileId("missing")).thenReturn(Optional.empty());
        FileStorageService service = new FileStorageService(fileProperties(null), attachmentRepository);
        Throwable thrown = catchThrowable(() -> service.download("missing"));
        assertThat(thrown).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        var exception = (org.springframework.web.server.ResponseStatusException) thrown;
        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private AppFileProperties fileProperties(String publicBaseUrl) {
        return new AppFileProperties(
                tempDir,
                "/files",
                publicBaseUrl,
                true,
                DataSize.ofMegabytes(20),
                List.of("txt"),
                List.of("exe", "sh"),
                255
        );
    }
}
