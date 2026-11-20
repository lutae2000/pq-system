package com.cheil.cheil_be.application.engineerperformancedoc.port.out;

import java.time.Instant;
import java.util.List;
import java.util.function.Supplier;

public interface PerformanceCertificateAttachmentRepository {
    List<Attachment> findByOwners(String ownerType, List<String> ownerIds);

    record Attachment(
            String fileId, String ownerId, String attachmentType, String filename,
            Integer displayOrder, Instant createdAt, Supplier<List<RenderedImage>> renderPages
    ) {
    }

    record RenderedImage(byte[] bytes, int width, int height, String extension, String mediaType) {
    }
}
