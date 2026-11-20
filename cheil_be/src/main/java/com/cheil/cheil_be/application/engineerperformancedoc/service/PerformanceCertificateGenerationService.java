package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static com.cheil.cheil_be.application.common.exception.ApplicationException.badRequest;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.zip.CRC32;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.cheil.cheil_be.application.common.exception.ApplicationErrorType;
import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.application.common.port.out.CurrentActorPort;
import com.cheil.cheil_be.application.engineerperformancedoc.model.CertificateDownload;
import com.cheil.cheil_be.application.engineerperformancedoc.model.PerformanceCertificateCommand;
import com.cheil.cheil_be.application.engineerperformancedoc.port.in.PerformanceCertificateUseCase;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateAttachmentRepository;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateAttachmentRepository.Attachment;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateAttachmentRepository.RenderedImage;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository;
import com.cheil.cheil_be.application.engineerperformancedoc.port.out.PerformanceCertificateQueryRepository.PerformanceTarget;

@Service
@RequiredArgsConstructor
public class PerformanceCertificateGenerationService implements PerformanceCertificateUseCase {

    private static final String OWNER_TYPE = "COMPANY_PERFORMANCE";
    private static final String ATTACHMENT_TYPE = "PERFORMANCE";
    private static final String PARTICIPANT_LIST_ATTACHMENT_TYPE = "PARTICIPANT_LIST";
    private static final String BASE_TEMPLATE = "hwpx/blank-a4.hwpx";
    private static final String ATTACHMENT_ERROR_REPORT = "첨부파일_변환_오류.txt";

    private final PerformanceCertificateAttachmentRepository attachmentRepository;
    private final CurrentActorPort currentActor;
    private final PerformanceCertificateQueryRepository queryRepository;

    @Override
    public CertificateDownload generateBatch(PerformanceCertificateCommand request) {
        validate(request);
        List<String> engineerIds = normalizedEngineerIds(request.engineerIds());
        if (engineerIds.isEmpty()) {
            throw badRequest("기술인별 실적증명서 생성 대상이 없습니다.");
        }

        Map<String, List<Long>> performanceSeqsByEngineer = findPerformanceSeqsByEngineer(
                request.bidSeq(),
                engineerIds
        );
        List<String> ownerIds = performanceSeqsByEngineer.values().stream()
                .flatMap(List::stream)
                .distinct()
                .map(String::valueOf)
                .toList();
        Map<String, List<Attachment>> attachmentsByOwnerId = findAttachmentsByOwnerId(OWNER_TYPE, ownerIds);
        Map<Long, Integer> remainingPerformanceReferences = performanceReferenceCounts(performanceSeqsByEngineer);
        Map<String, List<RenderedImage>> sharedRenderedAttachments = new HashMap<>();
        Map<String, String> attachmentErrors = new LinkedHashMap<>();
        Set<String> zipNames = new HashSet<>();
        boolean includeParticipantList = request.includeParticipantList();

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
                        attachmentErrors,
                        includeParticipantList
                );
                if (pages.isEmpty()) {
                    continue;
                }
                writeBatchEntry(zip, zipNames, engineerId, buildHwpx(pages), request.engineerNames(), includeParticipantList);
                documentCount++;
            }
            if (documentCount == 0) {
                if (!attachmentErrors.isEmpty()) {
                    throw new ApplicationException(ApplicationErrorType.UNPROCESSABLE_CONTENT,
                            "변환할 수 있는 첨부파일이 없습니다. " + attachmentErrors.values().iterator().next());
                }
                throw badRequest("첨부파일이 있는 기술인의 실적증명서가 없습니다.");
            }
            if (!attachmentErrors.isEmpty()) {
                writeAttachmentErrorReport(zip, attachmentErrors);
            }
            zip.finish();
            return new CertificateDownload(output.toByteArray(), true, documentCount, attachmentErrors.size());
        } catch (IOException exception) {
            throw new IllegalStateException("기술인별 실적증명서 ZIP 생성에 실패했습니다.", exception);
        }
    }

    private void writeAttachmentErrorReport(ZipOutputStream zip, Map<String, String> attachmentErrors) throws IOException {
        String report = "다음 첨부파일은 실적증명서에 포함되지 않았습니다. 원본 파일을 확인해 주세요.\n\n"
                + String.join("\n", attachmentErrors.values()) + "\n";
        writeZipEntry(zip, ATTACHMENT_ERROR_REPORT, report.getBytes(StandardCharsets.UTF_8));
    }

    private Map<String, List<Long>> findPerformanceSeqsByEngineer(Long bidSeq, List<String> engineerIds) {
        Map<String, Integer> engineerOrder = new HashMap<>();
        for (int index = 0; index < engineerIds.size(); index++) {
            engineerOrder.put(engineerIds.get(index), index);
        }
        Map<String, Set<Long>> ordered = new LinkedHashMap<>();
        engineerIds.forEach(engineerId -> ordered.put(engineerId, new LinkedHashSet<>()));
        queryRepository.findPerformanceTargets(bidSeq, engineerIds, currentActor.currentActor()).stream()
                .sorted(Comparator
                        .comparingInt((PerformanceTarget target) -> engineerOrder.getOrDefault(target.engineerId(), Integer.MAX_VALUE))
                        .thenComparing(PerformanceTarget::displayOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(PerformanceTarget::reviewId))
                .filter(target -> target.performanceSeq() != null && target.performanceSeq() > 0)
                .forEach(target -> ordered
                        .computeIfAbsent(target.engineerId(), ignored -> new LinkedHashSet<>())
                        .add(target.performanceSeq()));

        Map<String, List<Long>> result = new LinkedHashMap<>();
        ordered.forEach((engineerId, seqs) -> result.put(engineerId, List.copyOf(seqs)));
        return result;
    }

    private Map<String, List<Attachment>> findAttachmentsByOwnerId(String ownerType, List<String> ownerIds) {
        Map<String, List<Attachment>> result = new LinkedHashMap<>();
        if (ownerIds.isEmpty()) {
            return result;
        }
        attachmentRepository.findByOwners(ownerType, ownerIds)
                .forEach(attachment -> result
                        .computeIfAbsent(attachment.ownerId(), ignored -> new ArrayList<>())
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
            Map<String, List<Attachment>> attachmentsByOwnerId,
            Map<Long, Integer> remainingPerformanceReferences,
            Map<String, List<RenderedImage>> sharedRenderedAttachments,
            Map<String, String> attachmentErrors,
            boolean includeParticipantList
    ) {
        List<RenderedImage> pages = new ArrayList<>();
        for (Long performanceSeq : performanceSeqs) {
            List<Attachment> attachments = attachmentsByOwnerId.getOrDefault(
                    String.valueOf(performanceSeq),
                    List.of()
            );
            for (Attachment attachment : attachments) {
                if (!isIncludedAttachment(attachment, includeParticipantList)
                        || attachmentErrors.containsKey(attachment.fileId())) {
                    continue;
                }
                if (remainingPerformanceReferences.getOrDefault(performanceSeq, 0) > 1
                        || sharedRenderedAttachments.containsKey(attachment.fileId())) {
                    pages.addAll(sharedRenderedAttachments.computeIfAbsent(
                            attachment.fileId(),
                            ignored -> renderAttachmentForDownload(attachment, attachmentErrors)
                    ));
                } else {
                    pages.addAll(renderAttachmentForDownload(attachment, attachmentErrors));
                }
            }
            int remaining = remainingPerformanceReferences.merge(performanceSeq, -1, Integer::sum);
            if (remaining <= 0) {
                attachments.forEach(attachment -> sharedRenderedAttachments.remove(attachment.fileId()));
            }
        }
        return pages;
    }

    private List<RenderedImage> renderAttachmentForDownload(Attachment attachment, Map<String, String> errors) {
        try {
            return attachment.renderPages().get();
        } catch (ApplicationException exception) {
            switch (exception.errorType()) {
                case NOT_FOUND, CONFLICT, BAD_REQUEST, UNPROCESSABLE_CONTENT ->
                        errors.put(attachment.fileId(), "회사실적 " + attachment.ownerId() + " - "
                                + attachmentLabel(attachment) + ": " + exception.getMessage());
                default -> throw exception;
            }
            return List.of();
        }
    }

    private String attachmentLabel(Attachment attachment) {
        String filename = attachment.filename();
        return StringUtils.hasText(filename) ? filename.replaceAll("[\\r\\n]", " ") : attachment.fileId();
    }

    private boolean isIncludedAttachment(Attachment attachment, boolean includeParticipantList) {
        return ATTACHMENT_TYPE.equalsIgnoreCase(attachment.attachmentType())
                || (includeParticipantList
                && PARTICIPANT_LIST_ATTACHMENT_TYPE.equalsIgnoreCase(attachment.attachmentType()));
    }

    private void writeBatchEntry(
            ZipOutputStream zip,
            Set<String> zipNames,
            String engineerId,
            byte[] content,
            Map<String, String> engineerNames,
            boolean includeParticipantList
    ) throws IOException {
        String suffix = includeParticipantList ? "실적증명서_참여자명단" : "실적증명서";
        String engineerName = engineerNames == null ? null : engineerNames.get(engineerId);
        String filenamePrefix = StringUtils.hasText(engineerName) ? engineerName : engineerId;
        writeZipEntry(zip, uniqueZipName(zipNames, filenamePrefix, suffix), content);
    }

    private String uniqueZipName(Set<String> usedNames, String prefix, String suffix) {
        String base = safeFilename(prefix) + "_" + suffix;
        String name = base + ".hwpx";
        for (int collision = 2; !usedNames.add(name.toLowerCase(Locale.ROOT)); collision++) {
            name = base + " (" + collision + ").hwpx";
        }
        return name;
    }

    private void writeZipEntry(ZipOutputStream zip, String filename, byte[] content) throws IOException {
        zip.putNextEntry(new ZipEntry(filename));
        zip.write(content);
        zip.closeEntry();
    }

    @Override
    public byte[] generateWorkOverlapBatch(Long bidSeq, String workDutyId, boolean includeParticipantList) {
        if (bidSeq == null || !StringUtils.hasText(workDutyId)) {
            throw badRequest("공고와 업무 담당자가 필요합니다.");
        }
        Map<String, WorkOverlapEngineer> engineers = new LinkedHashMap<>();
        queryRepository.findWorkOverlapTargets(bidSeq, workDutyId.trim())
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
        Map<String, List<Attachment>> attachmentsByContractNo = findAttachmentsByOwnerId("WORK_OVERLAP_CONTRACT", contractNos);
        Set<String> zipNames = new HashSet<>();
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            zip.setLevel(Deflater.BEST_SPEED);
            String suffix = includeParticipantList ? "업무중복도_계약서_참여자명단" : "업무중복도_계약서";
            for (WorkOverlapEngineer engineer : engineers.values()) {
                List<RenderedImage> pages = engineer.contractNos().stream()
                        .flatMap(contractNo -> attachmentsByContractNo.getOrDefault(contractNo, List.of()).stream()
                                .filter(attachment -> "EVIDENCE".equalsIgnoreCase(attachment.attachmentType())
                                        || (includeParticipantList && PARTICIPANT_LIST_ATTACHMENT_TYPE.equalsIgnoreCase(attachment.attachmentType())))
                                .sorted(Comparator.comparing(Attachment::displayOrder, Comparator.nullsLast(Integer::compareTo))
                                        .thenComparing(Attachment::createdAt, Comparator.nullsLast(Comparator.naturalOrder()))))
                        .flatMap(attachment -> renderAttachmentIfAvailable(attachment).stream())
                        .toList();
                if (!pages.isEmpty()) {
                    String prefix = StringUtils.hasText(engineer.name()) ? engineer.name() : engineer.engineerId();
                    writeZipEntry(zip, uniqueZipName(zipNames, prefix, suffix), buildHwpx(pages));
                }
            }
            if (zipNames.isEmpty()) {
                throw badRequest("선택 기술인의 계약서 첨부파일이 없습니다.");
            }
            zip.finish();
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("업무중복도 HWPX ZIP 생성에 실패했습니다.", exception);
        }
    }

    @Override
    public String findProjectName(Long bidSeq) {
        return queryRepository.findProjectName(bidSeq).orElse("업무중복도");
    }

    private record WorkOverlapEngineer(String engineerId, String name, List<String> contractNos) {
        private WorkOverlapEngineer(String engineerId, String name) {
            this(engineerId, name, new ArrayList<>());
        }
    }

    @Override
    public CertificateDownload generate(PerformanceCertificateCommand request) {
        validate(request);
        List<Long> performanceSeqs = orderedPerformanceSeqs(request);
        if (performanceSeqs.isEmpty()) {
            throw badRequest("실적증명서를 생성할 회사실적이 없습니다.");
        }

        boolean includeParticipantList = request.includeParticipantList();
        List<RenderedImage> pages = new ArrayList<>();
        Map<String, String> attachmentErrors = new LinkedHashMap<>();
        List<String> ownerIds = performanceSeqs.stream().map(String::valueOf).toList();
        Map<String, List<Attachment>> attachmentsByOwnerId = findAttachmentsByOwnerId(OWNER_TYPE, ownerIds);
        for (String ownerId : ownerIds) {
            List<Attachment> attachments = attachmentsByOwnerId.getOrDefault(ownerId, List.of());
            for (Attachment attachment : attachments) {
                if (isIncludedAttachment(attachment, includeParticipantList)) {
                    pages.addAll(renderAttachmentForDownload(attachment, attachmentErrors));
                }
            }
        }
        if (!attachmentErrors.isEmpty()) {
            return packageCertificateWithErrors(pages, attachmentErrors, includeParticipantList);
        }
        if (pages.isEmpty()) {
            throw badRequest("선택한 회사실적에 첨부파일이 없습니다.");
        }
        return new CertificateDownload(buildHwpx(pages), false, 1, 0);
    }

    private CertificateDownload packageCertificateWithErrors(
            List<RenderedImage> pages, Map<String, String> attachmentErrors, boolean includeParticipantList
    ) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            zip.setLevel(Deflater.BEST_SPEED);
            if (!pages.isEmpty()) {
                String filename = includeParticipantList ? "실적증명서_참여자명단.hwpx" : "실적증명서.hwpx";
                writeZipEntry(zip, filename, buildHwpx(pages));
            }
            writeAttachmentErrorReport(zip, attachmentErrors);
            zip.finish();
            return new CertificateDownload(output.toByteArray(), true, pages.isEmpty() ? 0 : 1, attachmentErrors.size());
        } catch (IOException exception) {
            throw new IllegalStateException("실적증명서 ZIP 생성에 실패했습니다.", exception);
        }
    }

    private List<RenderedImage> renderAttachmentIfAvailable(Attachment attachment) {
        try {
            return attachment.renderPages().get();
        } catch (ApplicationException exception) {
            if (exception.errorType() == ApplicationErrorType.NOT_FOUND) {
                return List.of();
            }
            throw exception;
        }
    }

    private String safeFilename(String value) {
        return value.replaceAll("[\\p{Cntrl}\\\\/:*?\"<>|]", "_");
    }

    private List<Long> orderedPerformanceSeqs(PerformanceCertificateCommand request) {
        Set<Long> ordered = new LinkedHashSet<>();
        if (request.companyPerformanceSeqs() != null) {
            request.companyPerformanceSeqs().stream().filter(seq -> seq != null && seq > 0).forEach(ordered::add);
        }
        List<String> engineerIds = normalizedEngineerIds(request.engineerIds());
        if (!engineerIds.isEmpty()) {
            findPerformanceSeqsByEngineer(request.bidSeq(), engineerIds).values().forEach(ordered::addAll);
        }
        return new ArrayList<>(ordered);
    }

    private List<String> normalizedEngineerIds(List<String> engineerIds) {
        if (engineerIds == null) {
            return List.of();
        }
        return engineerIds.stream().filter(StringUtils::hasText).map(String::trim).distinct().toList();
    }

    private byte[] buildHwpx(List<RenderedImage> pages) {
        try (InputStream template = getClass().getClassLoader().getResourceAsStream(BASE_TEMPLATE)) {
            if (template == null) throw new IllegalStateException("빈 A4 HWPX 템플릿을 찾을 수 없습니다.");
            Map<String, byte[]> entries = readZip(template);
            String section = readTemplateEntry(entries, "Contents/section0.xml");
            String contentHpf = readTemplateEntry(entries, "Contents/content.hpf");
            if (!section.contains("<hp:linesegarray>") || !section.contains("</hp:p>") || !contentHpf.contains("</opf:manifest>")) {
                throw new IOException("HWPX 템플릿에서 이미지와 매니페스트를 삽입할 위치를 찾을 수 없습니다.");
            }
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
                if (i > 0) {
                    paragraphs.append(imageParagraph(id, page.width(), page.height(), true));
                }
            }
            contentHpf = contentHpf.replace("</opf:manifest>", manifestItems + "</opf:manifest>");
            section = applyNarrowPageMargins(section);
            RenderedImage firstPage = pages.get(0);
            String firstImageRun = imageRun("image1", firstPage.width(), firstPage.height());
            section = section.replaceFirst(
                    "<hp:linesegarray>",
                    java.util.regex.Matcher.quoteReplacement(firstImageRun) + "<hp:linesegarray>"
            );
            section = section.replaceFirst("</hp:p>", "</hp:p>\\n" + java.util.regex.Matcher.quoteReplacement(paragraphs.toString()));
            entries.put("Contents/section0.xml", section.getBytes(StandardCharsets.UTF_8));
            entries.put("Contents/content.hpf", contentHpf.getBytes(StandardCharsets.UTF_8));
            return writeZip(entries);
        } catch (IOException exception) {
            throw new IllegalStateException("빈 A4 HWPX 생성에 실패했습니다.", exception);
        }
    }

    private String readTemplateEntry(Map<String, byte[]> entries, String name) throws IOException {
        byte[] bytes = entries.get(name);
        if (bytes == null || bytes.length == 0) {
            throw new IOException("HWPX 템플릿에 필수 항목이 없습니다. " + name);
        }
        return new String(bytes, StandardCharsets.UTF_8);
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
        byte[] mimetype = entries.get("mimetype");
        if (mimetype == null || mimetype.length == 0) {
            throw new IOException("HWPX 템플릿에 mimetype이 없습니다.");
        }
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(output, StandardCharsets.UTF_8)) {
            zip.setLevel(Deflater.BEST_SPEED);
            CRC32 checksum = new CRC32();
            checksum.update(mimetype);
            ZipEntry mimetypeEntry = new ZipEntry("mimetype");
            mimetypeEntry.setMethod(ZipEntry.STORED);
            mimetypeEntry.setSize(mimetype.length);
            mimetypeEntry.setCompressedSize(mimetype.length);
            mimetypeEntry.setCrc(checksum.getValue());
            zip.putNextEntry(mimetypeEntry);
            zip.write(mimetype);
            zip.closeEntry();
            for (var entry : entries.entrySet()) {
                if (!"mimetype".equals(entry.getKey())) {
                    writeZipEntry(zip, entry.getKey(), entry.getValue());
                }
            }
        }
        return output.toByteArray();
    }

    private void validate(PerformanceCertificateCommand request) {
        if (request == null || request.bidSeq() == null || request.bidSeq() <= 0) {
            throw badRequest("공고를 선택해 주세요.");
        }
        if ((request.engineerIds() == null || request.engineerIds().isEmpty())
                && (request.companyPerformanceSeqs() == null || request.companyPerformanceSeqs().isEmpty())) {
            throw badRequest("실적증명서를 생성할 대상을 선택해 주세요.");
        }
    }

}
