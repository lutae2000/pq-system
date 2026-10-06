package com.cheil.cheil_be.application.engineerperformancedoc.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.PerformanceCertificateGenerateRequest;
import com.cheil.cheil_be.adapter.in.web.workoverlap.docs.WorkOverlapHwpxGenerateRequest;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentEntity;
import com.cheil.cheil_be.adapter.out.persistence.file.AppFileAttachmentJpaRepository;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository.PerformanceTarget;
import com.cheil.cheil_be.common.file.FileDownloadResult;
import com.cheil.cheil_be.common.file.FileStorageService;
import com.cheil.cheil_be.common.security.AuditActorResolver;

@Service
@RequiredArgsConstructor
public class PerformanceCertificateGenerationService {

    private static final String OWNER_TYPE = "COMPANY_PERFORMANCE";
    private static final String ATTACHMENT_TYPE = "PERFORMANCE";
    private static final String PARTICIPANT_LIST_ATTACHMENT_TYPE = "PARTICIPANT_LIST";
    private static final String HWP_NS = "http://www.hancom.co.kr/hwpml/2011/paragraph";
    private static final String BASE_TEMPLATE = "hwpx/blank-a4.hwpx";

    private final AppFileAttachmentJpaRepository attachmentRepository;
    private final FileStorageService fileStorageService;
    private final PerformanceCertificateQueryRepository queryRepository;

    public byte[] generate(PerformanceCertificateGenerateRequest request) {
        return generateDocument(request, false);
    }

    public byte[] generateBatch(PerformanceCertificateGenerateRequest request) {
        validate(request);
        if (request.engineerIds() == null || request.engineerIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기술인별 실적증명서 생성 대상이 없습니다.");
        }

        List<String> engineerIds = request.engineerIds().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();
        Map<String, List<Long>> performanceSeqsByEngineer = findPerformanceSeqsByEngineer(
                request.bidSeq(),
                engineerIds
        );
        List<String> ownerIds = performanceSeqsByEngineer.values().stream()
                .flatMap(List::stream)
                .distinct()
                .map(String::valueOf)
                .toList();
        Map<String, List<AppFileAttachmentEntity>> attachmentsByOwnerId = findAttachmentsByOwnerId(ownerIds);
        Map<Long, Integer> remainingPerformanceReferences = performanceReferenceCounts(performanceSeqsByEngineer);
        Map<String, List<RenderedImage>> sharedRenderedAttachments = new HashMap<>();
        boolean includeParticipantList = request.includeParticipantList() == Boolean.TRUE;

        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            zip.setLevel(Deflater.BEST_SPEED);
            int documentCount = 0;
            for (String engineerId : engineerIds) {
                List<RenderedImage> pages = collectPages(
                        performanceSeqsByEngineer.getOrDefault(engineerId, List.of()),
                        attachmentsByOwnerId,
                        remainingPerformanceReferences,
                        sharedRenderedAttachments,
                        includeParticipantList
                );
                if (pages.isEmpty()) {
                    continue;
                }
                writeBatchEntry(zip, engineerId, buildHwpx(pages), request.engineerNames(), includeParticipantList);
                documentCount++;
            }
            if (documentCount == 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "첨부파일이 있는 기술인의 실적증명서가 없습니다.");
            }
            zip.finish();
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("기술인별 실적증명서 ZIP 생성에 실패했습니다.", exception);
        }
    }

    private Map<String, List<Long>> findPerformanceSeqsByEngineer(Long bidSeq, List<String> engineerIds) {
        Map<String, Integer> engineerOrder = new HashMap<>();
        for (int index = 0; index < engineerIds.size(); index++) {
            engineerOrder.put(engineerIds.get(index), index);
        }
        Map<String, LinkedHashMap<Long, Boolean>> ordered = new LinkedHashMap<>();
        engineerIds.forEach(engineerId -> ordered.put(engineerId, new LinkedHashMap<>()));
        queryRepository.findPerformanceTargets(bidSeq, engineerIds, AuditActorResolver.resolve()).stream()
                .sorted(Comparator
                        .comparingInt((PerformanceTarget target) -> engineerOrder.getOrDefault(target.engineerId(), Integer.MAX_VALUE))
                        .thenComparing(PerformanceTarget::displayOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(PerformanceTarget::reviewId))
                .filter(target -> target.performanceSeq() != null && target.performanceSeq() > 0)
                .forEach(target -> ordered
                        .computeIfAbsent(target.engineerId(), ignored -> new LinkedHashMap<>())
                        .put(target.performanceSeq(), true));

        Map<String, List<Long>> result = new LinkedHashMap<>();
        ordered.forEach((engineerId, seqs) -> result.put(engineerId, new ArrayList<>(seqs.keySet())));
        return result;
    }

    private Map<String, List<AppFileAttachmentEntity>> findAttachmentsByOwnerId(List<String> ownerIds) {
        Map<String, List<AppFileAttachmentEntity>> result = new LinkedHashMap<>();
        if (ownerIds.isEmpty()) {
            return result;
        }
        attachmentRepository.findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc(OWNER_TYPE, ownerIds)
                .forEach(attachment -> result
                        .computeIfAbsent(attachment.getOwnerId(), ignored -> new ArrayList<>())
                        .add(attachment));
        return result;
    }

    private Map<Long, Integer> performanceReferenceCounts(Map<String, List<Long>> performanceSeqsByEngineer) {
        Map<Long, Integer> result = new HashMap<>();
        performanceSeqsByEngineer.values().forEach(seqs -> seqs.forEach(seq -> result.merge(seq, 1, Integer::sum)));
        return result;
    }

    private List<RenderedImage> collectPages(
            List<Long> performanceSeqs,
            Map<String, List<AppFileAttachmentEntity>> attachmentsByOwnerId,
            Map<Long, Integer> remainingPerformanceReferences,
            Map<String, List<RenderedImage>> sharedRenderedAttachments,
            boolean includeParticipantList
    ) {
        List<RenderedImage> pages = new ArrayList<>();
        for (Long performanceSeq : performanceSeqs) {
            List<AppFileAttachmentEntity> attachments = attachmentsByOwnerId.getOrDefault(
                    String.valueOf(performanceSeq),
                    List.of()
            );
            for (AppFileAttachmentEntity attachment : attachments) {
                if (!isIncludedAttachment(attachment, includeParticipantList)) {
                    continue;
                }
                if (remainingPerformanceReferences.getOrDefault(performanceSeq, 0) > 1
                        || sharedRenderedAttachments.containsKey(attachment.getFileId())) {
                    pages.addAll(sharedRenderedAttachments.computeIfAbsent(
                            attachment.getFileId(),
                            ignored -> renderAttachmentIfAvailable(attachment)
                    ));
                } else {
                    pages.addAll(renderAttachmentIfAvailable(attachment));
                }
            }
            int remaining = remainingPerformanceReferences.merge(performanceSeq, -1, Integer::sum);
            if (remaining <= 0) {
                attachments.forEach(attachment -> sharedRenderedAttachments.remove(attachment.getFileId()));
            }
        }
        return pages;
    }

    private boolean isIncludedAttachment(AppFileAttachmentEntity attachment, boolean includeParticipantList) {
        return ATTACHMENT_TYPE.equalsIgnoreCase(attachment.getAttachmentType())
                || (includeParticipantList
                && PARTICIPANT_LIST_ATTACHMENT_TYPE.equalsIgnoreCase(attachment.getAttachmentType()));
    }

    private void writeBatchEntry(
            ZipOutputStream zip,
            String engineerId,
            byte[] content,
            Map<String, String> engineerNames,
            boolean includeParticipantList
    ) throws IOException {
        String suffix = includeParticipantList ? "실적증명서_참여자명단.hwpx" : "실적증명서.hwpx";
        String engineerName = engineerNames == null ? null : engineerNames.get(engineerId);
        String filenamePrefix = StringUtils.hasText(engineerName) ? engineerName : engineerId;
        zip.putNextEntry(new ZipEntry(safeFilename(filenamePrefix) + "_" + suffix));
        zip.write(content);
        zip.closeEntry();
    }

    public byte[] generateWorkOverlapBatch(WorkOverlapHwpxGenerateRequest request) {
        if (request == null || request.bidSeq() == null || !StringUtils.hasText(request.workDutyId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "공고와 업무 담당자가 필요합니다.");
        }
        boolean includeParticipantList = request.includeParticipantList() == Boolean.TRUE;
        Map<String, WorkOverlapEngineer> engineers = new LinkedHashMap<>();
        queryRepository.findWorkOverlapTargets(request.bidSeq(), request.workDutyId().trim())
                .forEach(target -> engineers.computeIfAbsent(
                                target.engineerId(),
                                id -> new WorkOverlapEngineer(id, target.engineerName())
                        )
                        .contractNos()
                        .add(target.contractNo()));
        List<String> contractNos = engineers.values().stream()
                .flatMap(engineer -> engineer.contractNos().stream())
                .filter(StringUtils::hasText)
                .distinct()
                .toList();
        Map<String, List<AppFileAttachmentEntity>> attachmentsByContractNo = new LinkedHashMap<>();
        if (!contractNos.isEmpty()) {
            attachmentRepository
                    .findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc("WORK_OVERLAP_CONTRACT", contractNos)
                    .forEach(attachment -> attachmentsByContractNo
                            .computeIfAbsent(attachment.getOwnerId(), ignored -> new ArrayList<>())
                            .add(attachment));
        }
        List<BatchDocument> documents = new ArrayList<>();
        for (WorkOverlapEngineer engineer : engineers.values()) {
            List<RenderedImage> pages = new ArrayList<>();
            for (String contractNo : engineer.contractNos()) {
                attachmentsByContractNo.getOrDefault(contractNo, List.of())
                        .stream()
                        .filter(attachment -> "EVIDENCE".equalsIgnoreCase(attachment.getAttachmentType())
                                || (includeParticipantList && "PARTICIPANT_LIST".equalsIgnoreCase(attachment.getAttachmentType())))
                        .sorted(java.util.Comparator.comparing(AppFileAttachmentEntity::getDisplayOrder,
                                        java.util.Comparator.nullsLast(Integer::compareTo))
                                .thenComparing(AppFileAttachmentEntity::getCreatedAt,
                                        java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                        .forEach(attachment -> pages.addAll(renderAttachmentIfAvailable(attachment)));
            }
            if (!pages.isEmpty()) {
                documents.add(new BatchDocument(engineer.engineerId(), buildHwpx(pages)));
            }
        }
        if (documents.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "선택 기술인의 계약서 첨부파일이 없습니다.");
        }
        return buildWorkOverlapZip(documents, includeParticipantList, engineers);
    }

    public String findProjectName(Long bidSeq) {
        return queryRepository.findProjectName(bidSeq)
                .orElse("업무중복도");
    }

    private byte[] buildWorkOverlapZip(List<BatchDocument> documents, boolean includeParticipantList,
                                        Map<String, WorkOverlapEngineer> engineers) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            zip.setLevel(Deflater.BEST_SPEED);
            String suffix = includeParticipantList ? "업무중복도_계약서_참여자명단.hwpx" : "업무중복도_계약서.hwpx";
            for (BatchDocument document : documents) {
                WorkOverlapEngineer engineer = engineers.get(document.engineerId());
                String prefix = engineer != null && StringUtils.hasText(engineer.name()) ? engineer.name() : document.engineerId();
                zip.putNextEntry(new ZipEntry(safeFilename(prefix) + "_" + suffix));
                zip.write(document.content());
                zip.closeEntry();
            }
            zip.finish();
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("업무중복도 HWPX ZIP 생성에 실패했습니다.", exception);
        }
    }

    private record WorkOverlapEngineer(String engineerId, String name, List<String> contractNos) {
        private WorkOverlapEngineer(String engineerId, String name) {
            this(engineerId, name, new ArrayList<>());
        }
    }

    private byte[] generateDocument(PerformanceCertificateGenerateRequest request, boolean allowEmpty) {
        validate(request);
        List<Long> performanceSeqs = orderedPerformanceSeqs(request);
        if (performanceSeqs.isEmpty()) {
            if (allowEmpty) return null;
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "실적증명서를 생성할 회사실적이 없습니다.");
        }

        List<RenderedImage> pages = new ArrayList<>();
        List<String> ownerIds = performanceSeqs.stream().map(String::valueOf).toList();
        Map<String, List<AppFileAttachmentEntity>> attachmentsByOwnerId = new LinkedHashMap<>();
        attachmentRepository
                .findByOwnerTypeAndOwnerIdInOrderByCreatedAtAsc(OWNER_TYPE, ownerIds)
                .forEach(attachment -> attachmentsByOwnerId
                        .computeIfAbsent(attachment.getOwnerId(), ignored -> new ArrayList<>())
                        .add(attachment));
        for (Long seq : performanceSeqs) {
            List<AppFileAttachmentEntity> attachments = attachmentsByOwnerId.getOrDefault(String.valueOf(seq), List.of());
            for (AppFileAttachmentEntity attachment : attachments) {
                boolean isPerformance = ATTACHMENT_TYPE.equalsIgnoreCase(attachment.getAttachmentType());
                boolean isParticipantList = request.includeParticipantList() == Boolean.TRUE
                        && PARTICIPANT_LIST_ATTACHMENT_TYPE.equalsIgnoreCase(attachment.getAttachmentType());
                if (!isPerformance && !isParticipantList) continue;
                pages.addAll(renderAttachmentIfAvailable(attachment));
            }
        }
        if (pages.isEmpty()) {
            if (allowEmpty) return null;
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "선택한 회사실적에 첨부파일이 없습니다.");
        }
        return buildHwpx(pages);
    }

    private List<RenderedImage> renderAttachmentIfAvailable(AppFileAttachmentEntity attachment) {
        try {
            return renderAttachment(attachment);
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode() == HttpStatus.NOT_FOUND) {
                return List.of();
            }
            throw exception;
        }
    }

    private String safeFilename(String value) {
        return value.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private List<Long> orderedPerformanceSeqs(PerformanceCertificateGenerateRequest request) {
        LinkedHashMap<Long, Boolean> ordered = new LinkedHashMap<>();
        if (request.companyPerformanceSeqs() != null) {
            request.companyPerformanceSeqs().stream().filter(seq -> seq != null && seq > 0).forEach(seq -> ordered.put(seq, true));
        }
        if (request.engineerIds() != null) {
            List<String> engineerIds = request.engineerIds().stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .distinct()
                    .toList();
            Map<String, Integer> engineerOrder = new HashMap<>();
            for (int index = 0; index < engineerIds.size(); index++) {
                engineerOrder.put(engineerIds.get(index), index);
            }
            queryRepository.findPerformanceTargets(request.bidSeq(), engineerIds, AuditActorResolver.resolve()).stream()
                    .sorted(Comparator
                            .comparingInt((PerformanceTarget target) -> engineerOrder.getOrDefault(target.engineerId(), Integer.MAX_VALUE))
                            .thenComparing(PerformanceTarget::displayOrder, Comparator.nullsLast(Integer::compareTo))
                            .thenComparing(PerformanceTarget::reviewId))
                    .map(PerformanceTarget::performanceSeq)
                    .filter(seq -> seq != null && seq > 0)
                    .forEach(seq -> ordered.put(seq, true));
        }
        return new ArrayList<>(ordered.keySet());
    }

    private List<RenderedImage> renderAttachment(AppFileAttachmentEntity attachment) {
        FileDownloadResult download = fileStorageService.download(attachment);
        try (InputStream input = download.resource().getInputStream()) {
            String filename = attachment.getOriginalFilename() == null ? "" : attachment.getOriginalFilename().toLowerCase();
            String contentType = attachment.getContentType() == null ? "" : attachment.getContentType().toLowerCase();
            if (contentType.contains("pdf") || filename.endsWith(".pdf")) return renderPdf(input);
            if (contentType.startsWith("image/") || filename.matches(".*\\.(jpg|jpeg|png|bmp|gif)$")) {
                return List.of(readImagePage(input));
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PDF, JPG, PNG 파일만 실적증명서에 포함할 수 있습니다.");
        } catch (IOException exception) {
            throw new IllegalStateException("첨부파일을 실적증명서로 변환하지 못했습니다.", exception);
        }
    }

    private List<RenderedImage> renderPdf(InputStream input) throws IOException {
        List<RenderedImage> result = new ArrayList<>();
        try (PDDocument document = PDDocument.load(input)) {
            PDFRenderer renderer = new PDFRenderer(document);
            for (int page = 0; page < document.getNumberOfPages(); page++) {
                result.add(toPngPage(renderer.renderImageWithDPI(page, 150)));
            }
        }
        return result;
    }

    private RenderedImage readImagePage(InputStream input) throws IOException {
        byte[] bytes = input.readAllBytes();
        try (ImageInputStream imageInput = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            if (imageInput == null) {
                throw new IOException("이미지를 읽을 수 없습니다.");
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext()) {
                throw new IOException("이미지를 읽을 수 없습니다.");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInput, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                String format = reader.getFormatName().toLowerCase();
                if ("png".equals(format)) {
                    return new RenderedImage(bytes, width, height, "png", "image/png");
                }
                if ("jpeg".equals(format) || "jpg".equals(format)) {
                    return new RenderedImage(bytes, width, height, "jpg", "image/jpeg");
                }
                return toPngPage(reader.read(0));
            } finally {
                reader.dispose();
            }
        }
    }

    private RenderedImage toPngPage(BufferedImage image) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return new RenderedImage(output.toByteArray(), image.getWidth(), image.getHeight(), "png", "image/png");
    }

    private byte[] buildHwpx(List<RenderedImage> pages) {
        try (InputStream template = getClass().getClassLoader().getResourceAsStream(BASE_TEMPLATE)) {
            if (template == null) throw new IllegalStateException("빈 A4 HWPX 템플릿을 찾을 수 없습니다.");
            Map<String, byte[]> entries = readZip(template);
            String section = new String(entries.get("Contents/section0.xml"), StandardCharsets.UTF_8);
            String contentHpf = new String(entries.get("Contents/content.hpf"), StandardCharsets.UTF_8);
            StringBuilder paragraphs = new StringBuilder();
            StringBuilder manifestItems = new StringBuilder();
            for (int i = 0; i < pages.size(); i++) {
                RenderedImage page = pages.get(i);
                String id = "image" + (i + 1);
                String filename = id + "." + page.extension();
                // content.hpf와 section0.xml의 BinData 참조는 HWPX 루트 기준이다.
                entries.put("BinData/" + filename, page.bytes());
                manifestItems.append("<opf:item id=\"")
                        .append(id)
                        .append("\" href=\"BinData/")
                        .append(filename)
                        .append("\" media-type=\"")
                        .append(page.mediaType())
                        .append("\" isEmbeded=\"1\"/>");
                paragraphs.append(imageParagraph(id, page.width(), page.height(), i > 0));
            }
            contentHpf = contentHpf.replace("</opf:manifest>", manifestItems + "</opf:manifest>");
            section = applyNarrowPageMargins(section);
            RenderedImage firstPage = pages.get(0);
            String firstImageRun = imageRun("image1", firstPage.width(), firstPage.height());
            String remainingParagraphs = paragraphs.substring(paragraphs.indexOf("</hp:p>") + "</hp:p>".length());
            section = section.replaceFirst(
                    "<hp:linesegarray>",
                    java.util.regex.Matcher.quoteReplacement(firstImageRun) + "<hp:linesegarray>"
            );
            section = section.replaceFirst("</hp:p>", "</hp:p>\\n" + java.util.regex.Matcher.quoteReplacement(remainingParagraphs));
            entries.put("Contents/section0.xml", section.getBytes(StandardCharsets.UTF_8));
            entries.put("Contents/content.hpf", contentHpf.getBytes(StandardCharsets.UTF_8));
            return writeZip(entries);
        } catch (IOException exception) {
            throw new IllegalStateException("빈 A4 HWPX 생성에 실패했습니다.", exception);
        }
    }

    private String imageParagraph(String id, int width, int height, boolean pageBreak) {
        int maxWidth = 52328;
        int maxHeight = 76986;
        // 이미지 픽셀을 96 DPI 기준 HWP 단위로 환산한 뒤, 비율을 유지하면서 A4 본문 영역에 맞춘다.
        double originalWidth = Math.max(1d, width * 75d);
        double originalHeight = Math.max(1d, height * 75d);
        double scale = Math.min(1d, Math.min(maxWidth / originalWidth, maxHeight / originalHeight));
        int w = Math.max(1, (int) Math.round(originalWidth * scale));
        int h = Math.max(1, (int) Math.round(originalHeight * scale));
        int centerX = w / 2;
        int centerY = h / 2;
        String page = pageBreak ? "1" : "0";
        return "<hp:p id=\"" + (1000000000 + id.hashCode() & 0x7fffffff) + "\" paraPrIDRef=\"0\" styleIDRef=\"0\" pageBreak=\"" + page + "\" columnBreak=\"0\" merged=\"0\">"
                + "<hp:run charPrIDRef=\"0\"><hp:pic id=\"" + (2000000000 + id.hashCode() & 0x7fffffff) + "\" zOrder=\"0\" numberingType=\"PICTURE\" textWrap=\"TOP_AND_BOTTOM\" textFlow=\"BOTH_SIDES\" lock=\"0\" dropcapstyle=\"None\" href=\"\" groupLevel=\"0\" instid=\"" + (300000000 + id.hashCode() & 0x7fffffff) + "\" reverse=\"0\">"
                + "<hp:offset x=\"0\" y=\"0\"/><hp:orgSz width=\"" + w + "\" height=\"" + h + "\"/><hp:curSz width=\"" + w + "\" height=\"" + h + "\"/><hp:flip horizontal=\"0\" vertical=\"0\"/><hp:rotationInfo angle=\"0\" centerX=\"" + centerX + "\" centerY=\"" + centerY + "\" rotateimage=\"0\"/><hp:renderingInfo><hc:transMatrix e1=\"1\" e2=\"0\" e3=\"0\" e4=\"0\" e5=\"1\" e6=\"0\"/><hc:scaMatrix e1=\"1\" e2=\"0\" e3=\"0\" e4=\"0\" e5=\"1\" e6=\"0\"/><hc:rotMatrix e1=\"1\" e2=\"0\" e3=\"0\" e4=\"0\" e5=\"1\" e6=\"0\"/></hp:renderingInfo>"
                + "<hc:img binaryItemIDRef=\"" + id + "\" bright=\"0\" contrast=\"0\" effect=\"REAL_PIC\" alpha=\"0\"/><hp:imgRect><hc:pt0 x=\"0\" y=\"0\"/><hc:pt1 x=\"" + w + "\" y=\"0\"/><hc:pt2 x=\"" + w + "\" y=\"" + h + "\"/><hc:pt3 x=\"0\" y=\"" + h + "\"/></hp:imgRect><hp:imgClip left=\"0\" right=\"" + w + "\" top=\"0\" bottom=\"" + h + "\"/><hp:inMargin left=\"0\" right=\"0\" top=\"0\" bottom=\"0\"/><hp:imgDim dimwidth=\"" + w + "\" dimheight=\"" + h + "\"/><hp:effects/><hp:sz width=\"" + w + "\" widthRelTo=\"ABSOLUTE\" height=\"" + h + "\" heightRelTo=\"ABSOLUTE\" protect=\"0\"/><hp:pos treatAsChar=\"1\" affectLSpacing=\"0\" flowWithText=\"1\" allowOverlap=\"0\" holdAnchorAndSO=\"0\" vertRelTo=\"PARA\" horzRelTo=\"COLUMN\" vertAlign=\"TOP\" horzAlign=\"CENTER\" vertOffset=\"0\" horzOffset=\"0\"/><hp:outMargin left=\"0\" right=\"0\" top=\"0\" bottom=\"0\"/></hp:pic><hp:t/></hp:run></hp:p>\n";
    }

    private String imageRun(String id, int width, int height) {
        String paragraph = imageParagraph(id, width, height, false);
        int runStart = paragraph.indexOf("<hp:run");
        int runEnd = paragraph.lastIndexOf("</hp:run>") + "</hp:run>".length();
        return paragraph.substring(runStart, runEnd);
    }

    private String applyNarrowPageMargins(String section) {
        return section.replaceFirst(
                "<hp:margin header=\"[^\"]*\" footer=\"[^\"]*\" gutter=\"[^\"]*\" left=\"[^\"]*\" right=\"[^\"]*\" top=\"[^\"]*\" bottom=\"[^\"]*\"/>",
                "<hp:margin header=\"3600\" footer=\"3600\" gutter=\"0\" left=\"3600\" right=\"3600\" top=\"3600\" bottom=\"3600\"/>"
        );
    }

    private Map<String, byte[]> readZip(InputStream input) throws IOException {
        Map<String, byte[]> entries = new LinkedHashMap<>();
        try (ZipInputStream zip = new ZipInputStream(input, StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                // Windows에서 생성된 ZIP은 경로 구분자가 '\\'일 수 있으므로 HWPX 표준 경로로 정규화한다.
                entries.put(entry.getName().replace('\\', '/'), zip.readAllBytes());
            }
        }
        return entries;
    }

    private byte[] writeZip(Map<String, byte[]> entries) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            zip.setLevel(Deflater.BEST_SPEED);
            if (entries.containsKey("mimetype")) {
                zip.putNextEntry(new ZipEntry("mimetype"));
                zip.write(entries.get("mimetype"));
                zip.closeEntry();
            }
            entries.forEach((name, bytes) -> {
                if ("mimetype".equals(name)) return;
                try {
                    zip.putNextEntry(new ZipEntry(name));
                    zip.write(bytes);
                    zip.closeEntry();
                } catch (IOException exception) {
                    throw new IllegalStateException(exception);
                }
            });
        }
        return output.toByteArray();
    }

    private void validate(PerformanceCertificateGenerateRequest request) {
        if (request == null || request.bidSeq() == null || request.bidSeq() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "공고를 선택해 주세요.");
        }
        if ((request.engineerIds() == null || request.engineerIds().isEmpty())
                && (request.companyPerformanceSeqs() == null || request.companyPerformanceSeqs().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "실적증명서를 생성할 대상을 선택해 주세요.");
        }
    }

    private record RenderedImage(byte[] bytes, int width, int height, String extension, String mediaType) {
    }

    private record BatchDocument(String engineerId, byte[] content) {
    }
}
