package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import javax.imageio.IIOImage;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import javax.xml.parsers.DocumentBuilderFactory;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.out.document.PerformanceCertificateAttachmentAdapter;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentEntity;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentJpaRepository;
import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.engineerperformancedoc.model.PerformanceCertificateCommand;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateAttachmentRepository;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateAttachmentRepository.Attachment;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateAttachmentRepository.RenderedImage;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository.PerformanceTarget;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository.WorkOverlapTarget;
import com.cheil.cheil_be.common.file.FileDownloadResult;
import com.cheil.cheil_be.common.file.FileStorageService;

class PerformanceCertificateGenerationServiceTest {

    @Test
    void keepsUploadedJpegWithoutReencodingIt() throws Exception {
        AppFileAttachmentJpaRepository attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        FileStorageService fileStorageService = mock(FileStorageService.class);
        PerformanceCertificateQueryRepository queryRepository = mock(PerformanceCertificateQueryRepository.class);
        var service = service(attachmentRepository, fileStorageService, queryRepository);

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

        var result = service.generate(new PerformanceCertificateCommand(
                1L,
                List.of(),
                Map.of(),
                List.of(10L),
                false
        ));

        assertThat(result.archive()).isFalse();
        assertThat(result.documentCount()).isEqualTo(1);
        assertThat(result.failedAttachmentCount()).isZero();
        byte[] hwpx = result.content();
        assertHwpxMimetype(hwpx);
        assertThat(zipEntry(hwpx, "BinData/image1.jpg")).isEqualTo(jpeg);
        assertThat(new String(zipEntry(hwpx, "Contents/content.hpf"), StandardCharsets.UTF_8))
                .contains("media-type=\"image/jpeg\"");
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void putsCertificatesBeforeParticipantListsForEachPerformance(boolean batch) throws Exception {
        var attachments = mock(PerformanceCertificateAttachmentRepository.class);
        var queries = mock(PerformanceCertificateQueryRepository.class);
        var service = new PerformanceCertificateGenerationService(attachments, () -> "system", queries);
        var firstCertificate = renderedAttachment("certificate-1", "20", "PERFORMANCE", 4);
        var firstParticipants = renderedAttachment("participants-1", "20", "PARTICIPANT_LIST", 5);
        var secondCertificate = renderedAttachment("certificate-2", "10", "PERFORMANCE", 6);
        var secondParticipants = renderedAttachment("participants-2", "10", "PARTICIPANT_LIST", 7);
        when(attachments.findByOwners("COMPANY_PERFORMANCE", List.of("20", "10")))
                .thenReturn(List.of(secondParticipants, firstParticipants, secondCertificate, firstCertificate));

        byte[] hwpx;
        if (batch) {
            when(queries.findPerformanceTargets(eq(1L), eq(List.of("E1")), anyString()))
                    .thenReturn(List.of(
                            new PerformanceTarget("E1", 10L, 2, 1L),
                            new PerformanceTarget("E1", 20L, 1, 2L)
                    ));
            var result = service.generateBatch(new PerformanceCertificateCommand(
                    1L, List.of("E1"), Map.of(), null, true));
            hwpx = zipEntry(result.content(), "E1_실적증명서_참여자명단.hwpx");
        } else {
            hwpx = service.generate(new PerformanceCertificateCommand(
                    1L, List.of(), Map.of(), List.of(20L, 10L), true)).content();
        }

        Map<String, byte[]> entries = zipEntries(hwpx);
        assertHwpxPageReferences(entries, "jpg", 4);
        assertThat(entries.get("BinData/image1.jpg")).isEqualTo(firstCertificate.renderPages().get().getFirst().bytes());
        assertThat(entries.get("BinData/image2.jpg")).isEqualTo(firstParticipants.renderPages().get().getFirst().bytes());
        assertThat(entries.get("BinData/image3.jpg")).isEqualTo(secondCertificate.renderPages().get().getFirst().bytes());
        assertThat(entries.get("BinData/image4.jpg")).isEqualTo(secondParticipants.renderPages().get().getFirst().bytes());
    }

    @Test
    void batchPreservesDocumentsWithCollidingNamesAndRendersSharedAttachmentOnce() throws Exception {
        AppFileAttachmentJpaRepository attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        FileStorageService fileStorageService = mock(FileStorageService.class);
        PerformanceCertificateQueryRepository queryRepository = mock(PerformanceCertificateQueryRepository.class);
        var service = service(attachmentRepository, fileStorageService, queryRepository);
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

        var batch = service.generateBatch(new PerformanceCertificateCommand(
                1L,
                List.of("E1", "E2"),
                Map.of("E1", "기술인/동명", "E2", "기술인_동명"),
                null,
                false
        ));

        assertThat(batch.failedAttachmentCount()).isZero();
        Map<String, byte[]> documents = zipEntries(batch.content());
        assertThat(documents).containsOnlyKeys("기술인_동명_실적증명서.hwpx", "기술인_동명_실적증명서 (2).hwpx");
        assertThat(documents.values()).allSatisfy(document ->
                assertThat(zipEntry(document, "BinData/image1.jpg")).isEqualTo(jpeg));
        verify(queryRepository, times(1)).findPerformanceTargets(eq(1L), eq(List.of("E1", "E2")), anyString());
        verify(attachmentRepository, times(1))
                .findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc("COMPANY_PERFORMANCE", List.of("10"));
        verify(fileStorageService, times(1)).download(attachment);
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void batchIncludesEveryTiffPageAndReportsDamagedAttachments(boolean includeParticipantList) throws Exception {
        var attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        var fileStorageService = mock(FileStorageService.class);
        var queryRepository = mock(PerformanceCertificateQueryRepository.class);
        var service = service(attachmentRepository, fileStorageService, queryRepository);

        byte[] tiff = tiffImage();
        byte[] damaged = new byte[32];
        var certificate = stubAttachment(fileStorageService, "file-1", "certificate.tiff", "PERFORMANCE", tiff, MediaType.APPLICATION_OCTET_STREAM);
        var badCertificate = stubAttachment(fileStorageService, "file-2", "damaged.jpg", "PERFORMANCE", damaged, MediaType.IMAGE_JPEG);
        var badParticipantList = stubAttachment(fileStorageService, "file-3", "participants.jpg", "PARTICIPANT_LIST", damaged, MediaType.IMAGE_JPEG);
        when(queryRepository.findPerformanceTargets(eq(1L), eq(List.of("E1", "E2")), anyString()))
                .thenReturn(List.of(new PerformanceTarget("E1", 10L, 1, 1L), new PerformanceTarget("E2", 10L, 1, 2L)));
        when(attachmentRepository.findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc("COMPANY_PERFORMANCE", List.of("10")))
                .thenReturn(List.of(badCertificate, badParticipantList, certificate));

        var batch = service.generateBatch(new PerformanceCertificateCommand(
                1L, List.of("E1", "E2"), Map.of(), null, includeParticipantList));

        var entries = zipEntries(batch.content());
        assertThat(entries.entrySet().stream().filter(entry -> entry.getKey().endsWith(".hwpx")))
                .hasSize(2)
                .allSatisfy(entry -> {
                    var images = zipEntries(entry.getValue());
                    assertThat(images).containsKeys("BinData/image1.png", "BinData/image2.png");
                    assertHwpxPageReferences(images, "png", 2);
                });
        String report = new String(entries.get("첨부파일_변환_오류.txt"), StandardCharsets.UTF_8);
        assertThat(report).contains("damaged.jpg", "첨부파일의 내용을 읽을 수 없습니다.");
        if (includeParticipantList) {
            assertThat(report).contains("participants.jpg");
            assertThat(batch.failedAttachmentCount()).isEqualTo(2);
        } else {
            assertThat(report).doesNotContain("participants.jpg");
            assertThat(batch.failedAttachmentCount()).isEqualTo(1);
        }
        verify(fileStorageService, times(1)).download(badCertificate);
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void companyDownloadReturnsEveryAttachmentErrorAndAnyAvailableDocument(boolean hasReadableAttachment) throws Exception {
        var attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        var fileStorageService = mock(FileStorageService.class);
        var service = service(
                attachmentRepository, fileStorageService, mock(PerformanceCertificateQueryRepository.class));
        var damaged = stubAttachment(fileStorageService, "file-1", "damaged.jpg", "PERFORMANCE", new byte[32], MediaType.IMAGE_JPEG);
        var missing = AppFileAttachmentEntity.createUpload("missing", "missing.jpg", "2026/10", "missing.jpg",
                MediaType.IMAGE_JPEG_VALUE, 32L, "/files/missing");
        missing.attachTo("COMPANY_PERFORMANCE", "10", "PERFORMANCE");
        when(fileStorageService.download(missing)).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다."));
        byte[] jpeg = jpegImage();
        var attachments = hasReadableAttachment
                ? List.of(damaged, missing, stubAttachment(fileStorageService, "valid", "valid.jpg", "PERFORMANCE", jpeg, MediaType.IMAGE_JPEG))
                : List.of(damaged, missing);
        when(attachmentRepository.findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc("COMPANY_PERFORMANCE", List.of("10")))
                .thenReturn(attachments);

        var request = new PerformanceCertificateCommand(1L, List.of(), Map.of(), List.of(10L), false);
        var result = service.generate(request);

        assertThat(result.archive()).isTrue();
        assertThat(result.failedAttachmentCount()).isEqualTo(2);
        assertThat(result.documentCount()).isEqualTo(hasReadableAttachment ? 1 : 0);
        var entries = zipEntries(result.content());
        assertThat(new String(entries.get("첨부파일_변환_오류.txt"), StandardCharsets.UTF_8))
                .contains("damaged.jpg: 첨부파일의 내용을 읽을 수 없습니다.", "missing.jpg: 파일을 찾을 수 없습니다.");
        if (hasReadableAttachment) {
            assertThat(zipEntry(entries.get("실적증명서.hwpx"), "BinData/image1.jpg")).isEqualTo(jpeg);
        } else {
            assertThat(entries).containsOnlyKeys("첨부파일_변환_오류.txt");
        }
    }

    @Test
    void batchWithOnlyUnreadableFilesReturnsAnActionableError() {
        var attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        var fileStorageService = mock(FileStorageService.class);
        var queryRepository = mock(PerformanceCertificateQueryRepository.class);
        var service = service(attachmentRepository, fileStorageService, queryRepository);
        var attachment = stubAttachment(fileStorageService, "file-1", "damaged.jpg", "PERFORMANCE", new byte[32], MediaType.IMAGE_JPEG);
        when(queryRepository.findPerformanceTargets(eq(1L), eq(List.of("E1")), anyString()))
                .thenReturn(List.of(new PerformanceTarget("E1", 10L, 1, 1L)));
        when(attachmentRepository.findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc("COMPANY_PERFORMANCE", List.of("10")))
                .thenReturn(List.of(attachment));

        var request = new PerformanceCertificateCommand(1L, List.of("E1"), Map.of(), null, false);
        assertThatThrownBy(() -> service.generateBatch(request))
                .isInstanceOfSatisfying(ApplicationException.class, exception -> {
                    assertThat(exception.errorType()).isEqualTo(ApplicationErrorType.UNPROCESSABLE_CONTENT);
                    assertThat(exception.getMessage()).contains("damaged.jpg", "변환할 수 있는 첨부파일이 없습니다.");
                });
    }

    @Test
    void workOverlapArchivePreservesDocumentsWithTheSameEngineerName() throws Exception {
        var attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        var fileStorageService = mock(FileStorageService.class);
        var queryRepository = mock(PerformanceCertificateQueryRepository.class);
        var service = service(attachmentRepository, fileStorageService, queryRepository);
        byte[] jpeg = jpegImage();
        var attachment = stubAttachment(fileStorageService, "work-1", "evidence.jpg", "EVIDENCE", jpeg, MediaType.IMAGE_JPEG);
        attachment.attachTo("WORK_OVERLAP_CONTRACT", "C1", "EVIDENCE");
        when(attachmentRepository.findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc("WORK_OVERLAP_CONTRACT", List.of("C1")))
                .thenReturn(List.of(attachment));
        when(queryRepository.findWorkOverlapTargets(1L, "150801")).thenReturn(List.of(
                new WorkOverlapTarget("E1", "C1", "동명"),
                new WorkOverlapTarget("E2", "C1", "동명")
        ));

        var documents = zipEntries(service.generateWorkOverlapBatch(1L, "150801", false));

        assertThat(documents).containsOnlyKeys("동명_업무중복도_계약서.hwpx", "동명_업무중복도_계약서 (2).hwpx");
        assertThat(documents.values()).allSatisfy(hwpx -> {
            assertHwpxMimetype(hwpx);
            assertThat(zipEntry(hwpx, "BinData/image1.jpg")).isEqualTo(jpeg);
        });
    }

    @Test
    void companyCertificateEmbedsEveryPdfPageInOrder() throws Exception {
        var attachmentRepository = mock(AppFileAttachmentJpaRepository.class);
        var fileStorageService = mock(FileStorageService.class);
        var service = service(attachmentRepository, fileStorageService, mock(PerformanceCertificateQueryRepository.class));
        ByteArrayOutputStream source = new ByteArrayOutputStream();
        try (PDDocument document = new PDDocument()) {
            document.addPage(new PDPage(new PDRectangle(72, 72)));
            document.addPage(new PDPage(new PDRectangle(144, 72)));
            document.save(source);
        }
        var attachment = stubAttachment(fileStorageService, "pdf", "certificate.pdf", "PERFORMANCE",
                source.toByteArray(), MediaType.APPLICATION_PDF);
        when(attachmentRepository.findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc("COMPANY_PERFORMANCE", List.of("10")))
                .thenReturn(List.of(attachment));

        var result = service.generate(new PerformanceCertificateCommand(1L, List.of(), Map.of(), List.of(10L), false));
        var entries = zipEntries(result.content());

        assertThat(result.archive()).isFalse();
        assertHwpxMimetype(result.content());
        assertHwpxPageReferences(entries, "png", 2);
        assertThat(ImageIO.read(new ByteArrayInputStream(entries.get("BinData/image1.png"))).getWidth()).isEqualTo(150);
        assertThat(ImageIO.read(new ByteArrayInputStream(entries.get("BinData/image2.png"))).getWidth()).isEqualTo(300);
    }

    private static PerformanceCertificateGenerationService service(
            AppFileAttachmentJpaRepository attachments, FileStorageService storage, PerformanceCertificateQueryRepository queries
    ) {
        return new PerformanceCertificateGenerationService(
                new PerformanceCertificateAttachmentAdapter(attachments, storage), () -> "system", queries);
    }

    private static void assertHwpxMimetype(byte[] document) throws Exception {
        try (var zip = new ZipInputStream(new ByteArrayInputStream(document), StandardCharsets.UTF_8)) {
            ZipEntry first = zip.getNextEntry();
            assertThat(first.getName()).isEqualTo("mimetype");
            assertThat(first.getMethod()).isEqualTo(ZipEntry.STORED);
            assertThat(new String(zip.readAllBytes(), StandardCharsets.UTF_8)).isEqualTo("application/hwp+zip");
        }
    }

    private static void assertHwpxPageReferences(Map<String, byte[]> entries, String extension, int pageCount) throws Exception {
        var factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        var builder = factory.newDocumentBuilder();
        var section = builder.parse(new ByteArrayInputStream(entries.get("Contents/section0.xml")));
        var manifest = builder.parse(new ByteArrayInputStream(entries.get("Contents/content.hpf")));
        var images = section.getElementsByTagNameNS("*", "img");
        assertThat(images.getLength()).isEqualTo(pageCount);
        var manifestItems = manifest.getElementsByTagNameNS("*", "item");
        for (int index = 0; index < pageCount; index++) {
            String id = "image" + (index + 1);
            String path = "BinData/" + id + "." + extension;
            assertThat(images.item(index).getAttributes().getNamedItem("binaryItemIDRef").getNodeValue()).isEqualTo(id);
            boolean found = false;
            for (int item = 0; item < manifestItems.getLength(); item++) {
                var attributes = manifestItems.item(item).getAttributes();
                if (id.equals(attributes.getNamedItem("id").getNodeValue())) {
                    assertThat(attributes.getNamedItem("href").getNodeValue()).isEqualTo(path);
                    found = true;
                }
            }
            assertThat(found).as("Manifest entry for %s", id).isTrue();
            assertThat(entries.get(path)).isNotEmpty();
        }
        var paragraphs = section.getElementsByTagNameNS("*", "p");
        int pageBreaks = 0;
        for (int index = 0; index < paragraphs.getLength(); index++) {
            var pageBreak = paragraphs.item(index).getAttributes().getNamedItem("pageBreak");
            if (pageBreak != null && "1".equals(pageBreak.getNodeValue())) {
                pageBreaks++;
            }
        }
        assertThat(pageBreaks).isEqualTo(pageCount - 1);
    }

    private static AppFileAttachmentEntity stubAttachment(
            FileStorageService storage, String id, String filename, String type, byte[] content, MediaType mediaType) {
        var attachment = AppFileAttachmentEntity.createUpload(
                id, filename, "2026/10", filename, mediaType.toString(), (long) content.length, "/files/" + id);
        attachment.attachTo("COMPANY_PERFORMANCE", "10", type);
        when(storage.download(attachment)).thenReturn(new FileDownloadResult(
                id, new ByteArrayResource(content), filename, mediaType, content.length));
        return attachment;
    }

    private static byte[] tiffImage() throws Exception {
        var output = new ByteArrayOutputStream();
        var writer = ImageIO.getImageWritersByFormatName("TIFF").next();
        try (var imageOutput = new MemoryCacheImageOutputStream(output)) {
            writer.setOutput(imageOutput);
            writer.prepareWriteSequence(null);
            writer.writeToSequence(new IIOImage(new BufferedImage(4, 3, BufferedImage.TYPE_INT_RGB), null, null), null);
            writer.writeToSequence(new IIOImage(new BufferedImage(5, 3, BufferedImage.TYPE_INT_RGB), null, null), null);
            writer.endWriteSequence();
        } finally {
            writer.dispose();
        }
        return output.toByteArray();
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
        return jpegImage(4);
    }

    private static Attachment renderedAttachment(String id, String ownerId, String type, int width) throws Exception {
        var image = new RenderedImage(jpegImage(width), width, 3, "jpg", MediaType.IMAGE_JPEG_VALUE);
        return new Attachment(id, ownerId, type, id + ".jpg", null, null, () -> List.of(image));
    }

    private static byte[] jpegImage(int width) throws Exception {
        BufferedImage image = new BufferedImage(width, 3, BufferedImage.TYPE_INT_RGB);
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
