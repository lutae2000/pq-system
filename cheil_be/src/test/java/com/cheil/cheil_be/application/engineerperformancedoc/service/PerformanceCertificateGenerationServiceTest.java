package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;

import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.PerformanceCertificateGenerateRequest;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentEntity;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentJpaRepository;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository.PerformanceTarget;
import com.cheil.cheil_be.common.file.FileDownloadResult;
import com.cheil.cheil_be.common.file.FileStorageService;

class PerformanceCertificateGenerationServiceTest {

    @Test
    void keepsUploadedJpegWithoutReencodingIt() throws Exception {
        AppFileAttachmentJpaRepository attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        FileStorageService fileStorageService = mock(FileStorageService.class);
        PerformanceCertificateQueryRepository queryRepository = mock(PerformanceCertificateQueryRepository.class);
        PerformanceCertificateGenerationService service = new PerformanceCertificateGenerationService(
                attachmentRepository,
                fileStorageService,
                queryRepository
        );

        byte[] jpeg = jpegImage();
        AppFileAttachmentEntity attachment = AppFileAttachmentEntity.createUpload(
                "file-1",
                "certificate.jpg",
                "2026/10",
                "certificate__file-1.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                (long) jpeg.length,
                "/files/file-1"
        );
        attachment.attachTo("COMPANY_PERFORMANCE", "10", "PERFORMANCE");
        when(attachmentRepository.findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc(
                "COMPANY_PERFORMANCE",
                List.of("10")
        )).thenReturn(List.of(attachment));
        when(fileStorageService.download(any(AppFileAttachmentEntity.class))).thenReturn(new FileDownloadResult(
                "file-1",
                new ByteArrayResource(jpeg),
                "certificate.jpg",
                MediaType.IMAGE_JPEG,
                jpeg.length
        ));

        byte[] hwpx = service.generate(new PerformanceCertificateGenerateRequest(
                1L,
                List.of(),
                Map.of(),
                List.of(10L),
                null,
                false
        ));

        assertThat(zipEntry(hwpx, "BinData/image1.jpg")).isEqualTo(jpeg);
        assertThat(new String(zipEntry(hwpx, "Contents/content.hpf"), StandardCharsets.UTF_8))
                .contains("media-type=\"image/jpeg\"");
    }

    @Test
    void batchLoadsSharedPerformanceAndAttachmentOnlyOnce() throws Exception {
        AppFileAttachmentJpaRepository attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        FileStorageService fileStorageService = mock(FileStorageService.class);
        PerformanceCertificateQueryRepository queryRepository = mock(PerformanceCertificateQueryRepository.class);
        PerformanceCertificateGenerationService service = new PerformanceCertificateGenerationService(
                attachmentRepository,
                fileStorageService,
                queryRepository
        );
        byte[] jpeg = jpegImage();
        AppFileAttachmentEntity attachment = attachment(jpeg);
        when(queryRepository.findPerformanceTargets(eq(1L), eq(List.of("E1", "E2")), anyString()))
                .thenReturn(List.of(
                        new PerformanceTarget("E1", 10L, 1, 1L),
                        new PerformanceTarget("E2", 10L, 1, 2L)
                ));
        when(attachmentRepository.findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc(
                "COMPANY_PERFORMANCE",
                List.of("10")
        )).thenReturn(List.of(attachment));
        when(fileStorageService.download(attachment)).thenReturn(new FileDownloadResult(
                "file-1",
                new ByteArrayResource(jpeg),
                "certificate.jpg",
                MediaType.IMAGE_JPEG,
                jpeg.length
        ));

        byte[] archive = service.generateBatch(new PerformanceCertificateGenerateRequest(
                1L,
                List.of("E1", "E2"),
                Map.of("E1", "기술인1", "E2", "기술인2"),
                null,
                null,
                false
        ));

        Map<String, byte[]> documents = zipEntries(archive);
        assertThat(documents).hasSize(2);
        assertThat(documents.values()).allSatisfy(document ->
                assertThat(zipEntry(document, "BinData/image1.jpg")).isEqualTo(jpeg));
        verify(queryRepository, times(1)).findPerformanceTargets(eq(1L), eq(List.of("E1", "E2")), anyString());
        verify(attachmentRepository, times(1))
                .findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc("COMPANY_PERFORMANCE", List.of("10"));
        verify(fileStorageService, times(1)).download(attachment);
    }

    private static AppFileAttachmentEntity attachment(byte[] content) {
        AppFileAttachmentEntity attachment = AppFileAttachmentEntity.createUpload(
                "file-1",
                "certificate.jpg",
                "2026/10",
                "certificate__file-1.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                (long) content.length,
                "/files/file-1"
        );
        attachment.attachTo("COMPANY_PERFORMANCE", "10", "PERFORMANCE");
        return attachment;
    }

    private static byte[] jpegImage() throws Exception {
        BufferedImage image = new BufferedImage(4, 3, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", output);
        return output.toByteArray();
    }

    private static byte[] zipEntry(byte[] archive, String expectedName) throws Exception {
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(archive))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (expectedName.equals(entry.getName())) {
                    return zip.readAllBytes();
                }
            }
        }
        throw new AssertionError("Missing ZIP entry: " + expectedName);
    }

    private static Map<String, byte[]> zipEntries(byte[] archive) throws Exception {
        Map<String, byte[]> result = new LinkedHashMap<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(archive))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                result.put(entry.getName(), zip.readAllBytes());
            }
        }
        return result;
    }
}
