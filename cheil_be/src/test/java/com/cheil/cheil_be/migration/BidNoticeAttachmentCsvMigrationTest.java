package com.cheil.cheil_be.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Stream;

import org.apache.commons.csv.CSVFormat;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class BidNoticeAttachmentCsvMigrationTest {

    private static final Path INPUT_DIRECTORY = Path.of(
            System.getProperty(
                    "bidNoticeMigrationInputDirectory",
                    "C:/Users/cheil/마이그레이션"
            )
    );
    private static final Path OUTPUT_DIRECTORY = INPUT_DIRECTORY;
    private static final Charset ORACLE_CSV_CHARSET = Charset.forName("EUC-KR");
    private static final String OWNER_TYPE = "BID_NOTICE";
    private static final String MIGRATION_TIMESTAMP = LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    private static final String CSV_HEADER = String.join(",",
            "owner_type",
            "owner_id",
            "attachment_type",
            "file_id",
            "original_filename",
            "stored_path",
            "stored_filename",
            "content_type",
            "file_size",
            "download_url",
            "display_order",
            "created_at",
            "created_id",
            "last_changed_at",
            "last_changed_id"
    );
    private static final List<SourceColumn> SOURCE_COLUMNS = List.of(
            new SourceColumn("GFILE_NAME", "announcement"),
            new SourceColumn("PFILE_NAME", "evaluation"),
            new SourceColumn("MFILE_NAME", "guide"),
            new SourceColumn("JFILE_NAME", "specification"),
            new SourceColumn("RFILE_NAME", "submission")
    );

    @Test
    void convertsBidNoticeAttachmentFilesToAppFileAttachmentsCsv() throws IOException {
        Assumptions.assumeTrue(Files.isDirectory(INPUT_DIRECTORY),
                "Input directory does not exist: " + INPUT_DIRECTORY);
        List<Path> inputs;
        try (Stream<Path> files = Files.list(INPUT_DIRECTORY)) {
            inputs = files
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().matches("(?i)CS_BIDS_APPEND_.*\\.(csv|xlsx)"))
                    .filter(path -> !path.getFileName().toString().toLowerCase(Locale.ROOT)
                            .endsWith("_app_file_attachments.csv"))
                    .filter(path -> isCsv(path) || !Files.isRegularFile(path.resolveSibling(
                            stripExtension(path.getFileName().toString()) + ".csv")))
                    .sorted()
                    .toList();
        }
        Assumptions.assumeTrue(!inputs.isEmpty(),
                "Put a CS_BIDS_APPEND_*.csv or CS_BIDS_APPEND_*.xlsx file in " + INPUT_DIRECTORY);

        Files.createDirectories(OUTPUT_DIRECTORY);
        for (Path input : inputs) {
            Path output = OUTPUT_DIRECTORY.resolve(
                    stripExtension(input.getFileName().toString()) + "_app_file_attachments.csv"
            );
            convert(input, output);
            assertThat(Files.size(output)).isGreaterThan(0L);
            System.out.printf("%s -> %s (UTF-8)%n", input, output);
        }
    }

    @Test
    void preservesKoreanAndQuotedFilenameInExistingOutputFormat(@TempDir Path directory) throws IOException {
        Path input = directory.resolve("CS_BIDS_APPEND_sample.csv");
        Path output = directory.resolve("CS_BIDS_APPEND_sample_app_file_attachments.csv");
        Files.writeString(input, """
                "BID_SEQ","GFILE_NAME","MFILE_NAME","PFILE_NAME","JFILE_NAME","RFILE_NAME"
                "123","입찰공고/자료/123______공고, ""정정"".pdf","","","",""
                """, ORACLE_CSV_CHARSET);

        convert(input, output);

        assertThat(Files.readAllLines(output, StandardCharsets.UTF_8)).containsExactly(
                "\uFEFF" + CSV_HEADER,
                toAttachmentRow("123", "announcement", "입찰공고/자료/123______공고, \"정정\".pdf").toCsvLine()
        );
    }

    private static void convert(Path input, Path output) throws IOException {
        Path temporary = Files.createTempFile(output.getParent(), ".bid-notice-attachments-", ".tmp");
        try {
            try (BufferedWriter writer = Files.newBufferedWriter(temporary, StandardCharsets.UTF_8)) {
                writer.write('\uFEFF');
                writer.write(CSV_HEADER);
                writer.newLine();
                if (isCsv(input)) {
                    convertOracleCsv(input, writer);
                } else {
                    convertExcel(input, writer);
                }
            }
            Files.move(temporary, output, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            Files.deleteIfExists(temporary);
        }
    }

    private static boolean isCsv(Path input) {
        return input.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".csv");
    }

    private static void convertOracleCsv(Path input, BufferedWriter writer) throws IOException {
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build();
        try (var reader = Files.newBufferedReader(input, ORACLE_CSV_CHARSET);
             var parser = format.parse(reader)) {
            validateColumns(parser.getHeaderMap());
            for (var row : parser) {
                writeAttachments(writer, column -> row.get(column).trim());
            }
        }
    }

    private static void convertExcel(Path input, BufferedWriter writer) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(input.toFile())) {
            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            Row header = workbook.getSheetAt(0).getRow(0);
            Map<String, Integer> columns = headerColumns(header, formatter);
            validateColumns(columns);

            for (Row row : workbook.getSheetAt(0)) {
                if (row.getRowNum() != 0) {
                    writeAttachments(writer, column -> cellValue(row, columns.get(column), formatter));
                }
            }
        }
    }

    private static void validateColumns(Map<String, Integer> columns) {
        assertThat(columns).containsKey("BID_SEQ");
        for (SourceColumn sourceColumn : SOURCE_COLUMNS) {
            assertThat(columns).containsKey(sourceColumn.sourceColumn());
        }
    }

    private static void writeAttachments(BufferedWriter writer, Function<String, String> value) throws IOException {
        String bidSeq = value.apply("BID_SEQ");
        if (bidSeq.isBlank()) {
            return;
        }

        for (SourceColumn sourceColumn : SOURCE_COLUMNS) {
            String sourcePath = value.apply(sourceColumn.sourceColumn());
            if (sourcePath.isBlank()) {
                continue;
            }

            AttachmentRow attachment = toAttachmentRow(bidSeq, sourceColumn.attachmentType(), sourcePath);
            writer.write(attachment.toCsvLine());
            writer.newLine();
        }
    }

    private static Map<String, Integer> headerColumns(Row header, DataFormatter formatter) {
        Map<String, Integer> columns = new java.util.HashMap<>();
        for (Cell cell : header) {
            columns.put(formatter.formatCellValue(cell).trim().toUpperCase(Locale.ROOT), cell.getColumnIndex());
        }
        return columns;
    }

    private static String cellValue(Row row, Integer columnIndex, DataFormatter formatter) {
        if (columnIndex == null) {
            return "";
        }
        Cell cell = row.getCell(columnIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        return cell == null ? "" : formatter.formatCellValue(cell).trim();
    }

    private static AttachmentRow toAttachmentRow(
            String bidSeq,
            String attachmentType,
            String sourcePath
    ) {
        String normalizedPath = normalizePath(sourcePath);
        int separator = normalizedPath.lastIndexOf('/');
        String storedPath = separator < 0 ? "" : normalizedPath.substring(0, separator);
        String storedFilename = separator < 0 ? normalizedPath : normalizedPath.substring(separator + 1);
        String originalFilename = displayFilename(storedFilename);
        String fileId = md5("bid-notice|" + bidSeq + "|" + attachmentType + "|" + normalizedPath);

        return new AttachmentRow(
                OWNER_TYPE,
                bidSeq,
                attachmentType,
                fileId,
                originalFilename,
                storedPath,
                storedFilename,
                contentType(storedFilename),
                "/files/" + fileId
        );
    }

    private static String normalizePath(String sourcePath) {
        String normalizedPath = sourcePath.replace('\\', '/').replaceAll("/+$", "");
        if (normalizedPath.equals("입찰공고")) {
            return "bid_notice";
        }
        if (normalizedPath.startsWith("입찰공고/")) {
            return "bid_notice/" + normalizedPath.substring("입찰공고/".length());
        }
        return normalizedPath;
    }

    private static String displayFilename(String storedFilename) {
        int marker = storedFilename.indexOf("______");
        if (marker < 0) {
            return storedFilename;
        }
        String displayFilename = storedFilename.substring(marker + "______".length());
        return displayFilename.isBlank() ? storedFilename : displayFilename;
    }

    private static String contentType(String filename) {
        int dot = filename.lastIndexOf('.');
        String extension = dot < 0 ? "" : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
        return switch (extension) {
            case "hwp" -> "application/x-hwp";
            case "hwpx" -> "application/haansofthwpx";
            case "pdf" -> "application/pdf";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "bmp" -> "image/bmp";
            case "tif", "tiff" -> "image/tiff";
            case "xls" -> "application/vnd.ms-excel";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            default -> "application/octet-stream";
        };
    }

    private static String md5(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("MD5")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(digest.length * 2);
            for (byte item : digest) {
                result.append(String.format(Locale.ROOT, "%02x", item));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("MD5 is not available", exception);
        }
    }

    private static String stripExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? filename : filename.substring(0, dot);
    }

    private record SourceColumn(String sourceColumn, String attachmentType) {
    }

    private record AttachmentRow(
            String ownerType,
            String ownerId,
            String attachmentType,
            String fileId,
            String originalFilename,
            String storedPath,
            String storedFilename,
            String contentType,
            String downloadUrl
    ) {

        private String toCsvLine() {
            return String.join(",",
                    csv(ownerType),
                    csv(ownerId),
                    csv(attachmentType),
                    csv(fileId),
                    csv(originalFilename),
                    csv(storedPath),
                    csv(storedFilename),
                    csv(contentType),
                    "",
                    csv(downloadUrl),
                    "",
                    csv(MIGRATION_TIMESTAMP),
                    csv("migration"),
                    csv(MIGRATION_TIMESTAMP),
                    csv("migration")
            );
        }
    }

    private static String csv(String value) {
        String normalized = value == null ? "" : value;
        return '"' + normalized.replace("\"", "\"\"") + '"';
    }
}
