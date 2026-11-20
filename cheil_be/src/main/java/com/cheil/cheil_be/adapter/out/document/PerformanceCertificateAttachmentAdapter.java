package com.cheil.cheil_be.adapter.out.document;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.conflict;
import static com.cheil.cheil_be.application.common.exception.ApplicationException.notFound;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentEntity;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentJpaRepository;
import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateAttachmentRepository;
import com.cheil.cheil_be.common.file.FileStorageService;

@Component
@RequiredArgsConstructor
public class PerformanceCertificateAttachmentAdapter implements PerformanceCertificateAttachmentRepository {
    private final AppFileAttachmentJpaRepository attachmentRepository;
    private final FileStorageService storage;

    @Override
    public List<Attachment> findByOwners(String ownerType, List<String> ownerIds) {
        return attachmentRepository.findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc(ownerType, ownerIds).stream()
                .map(entity -> new Attachment(
                        entity.getFileId(), entity.getOwnerId(), entity.getAttachmentType(), entity.getOriginalFilename(),
                        entity.getDisplayOrder(), entity.getCreatedAt(), () -> render(entity)))
                .toList();
    }

    private List<RenderedImage> render(AppFileAttachmentEntity attachment) {
        try (InputStream input = storage.download(attachment).resource().getInputStream()) {
            String filename = Objects.toString(attachment.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
            String contentType = Objects.toString(attachment.getContentType(), "").toLowerCase(Locale.ROOT);
            if (contentType.contains("pdf") || filename.endsWith(".pdf")) {
                return renderPdf(input);
            }
            if (contentType.startsWith("image/") || filename.matches(".*\\.(jpg|jpeg|png|bmp|gif|tif|tiff)$")) {
                return renderImage(input);
            }
            throw badRequest("PDF 또는 지원되는 이미지 형식(JPG, PNG, BMP, GIF, TIFF)이 필요합니다.");
        } catch (ResponseStatusException exception) {
            throw switch (exception.getStatusCode().value()) {
                case 400 -> badRequest(exception.getReason(), exception);
                case 404 -> notFound(exception.getReason());
                case 409 -> conflict(exception.getReason());
                default -> exception;
            };
        } catch (IOException exception) {
            throw new ApplicationException(ApplicationErrorType.UNPROCESSABLE_CONTENT,
                    "첨부파일의 내용을 읽을 수 없습니다.", exception);
        }
    }

    private List<RenderedImage> renderPdf(InputStream input) throws IOException {
        try (PDDocument document = PDDocument.load(input)) {
            if (document.getNumberOfPages() == 0) {
                throw new IOException("PDF 페이지가 없습니다.");
            }
            var renderer = new PDFRenderer(document);
            var pages = new ArrayList<RenderedImage>();
            for (int page = 0; page < document.getNumberOfPages(); page++) {
                pages.add(encodePng(renderer.renderImageWithDPI(page, 150)));
            }
            return pages;
        }
    }

    private List<RenderedImage> renderImage(InputStream input) throws IOException {
        byte[] bytes = input.readAllBytes();
        try (ImageInputStream imageInput = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            if (imageInput == null) {
                throw new IOException("이미지를 읽을 수 없습니다.");
            }
            var readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext()) {
                throw new IOException("이미지를 읽을 수 없습니다.");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInput, false, true);
                return switch (reader.getFormatName().toLowerCase(Locale.ROOT)) {
                    case "png" -> List.of(new RenderedImage(bytes, reader.getWidth(0), reader.getHeight(0), "png", "image/png"));
                    case "jpeg", "jpg" -> List.of(new RenderedImage(bytes, reader.getWidth(0), reader.getHeight(0), "jpg", "image/jpeg"));
                    case "tif", "tiff" -> encodePages(reader, reader.getNumImages(true));
                    default -> encodePages(reader, 1);
                };
            } finally {
                reader.dispose();
            }
        }
    }

    private List<RenderedImage> encodePages(ImageReader reader, int pageCount) throws IOException {
        if (pageCount <= 0) {
            throw new IOException("이미지 페이지가 없습니다.");
        }
        var pages = new ArrayList<RenderedImage>(pageCount);
        for (int page = 0; page < pageCount; page++) {
            pages.add(encodePng(reader.read(page)));
        }
        return pages;
    }

    private RenderedImage encodePng(BufferedImage image) throws IOException {
        try {
            var output = new ByteArrayOutputStream();
            if (!ImageIO.write(image, "png", output)) {
                throw new IOException("PNG 인코더를 찾을 수 없습니다.");
            }
            return new RenderedImage(output.toByteArray(), image.getWidth(), image.getHeight(), "png", "image/png");
        } finally {
            image.flush();
        }
    }
}
