package com.cheil.cheil_be.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

class PqImageInfoAttachmentCsvMigrationTest {

    private static final Path INPUT_DIRECTORY = Path.of(
            System.getProperty(
                    "pqImageInfoMigrationInputDirectory",
                    "C:/Users/cheil/마이그레이션"
            )
    );
    private static final Path OUTPUT_DIRECTORY = INPUT_DIRECTORY;
    private static final String OWNER_TYPE = "COMPANY_PERFORMANCE";
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

    @Test
    void convertsPqImageInfoExcelToAppFileAttachmentsCsv() throws Exception {
        try (Stream<Path> files = Files.list(INPUT_DIRECTORY)) {
            var inputs = files
                    .filter(path -> path.getFileName().toString()
                            .matches("(?i)PQ_IMAGE_INFO_.*\\.xlsx"))
                    .sorted()
                    .toList();
            Assumptions.assumeTrue(!inputs.isEmpty(),
                    "Put a PQ_IMAGE_INFO_*.xlsx file in " + INPUT_DIRECTORY);

            Files.createDirectories(OUTPUT_DIRECTORY);
            for (Path input : inputs) {
                Path output = OUTPUT_DIRECTORY.resolve(
                        stripExtension(input.getFileName().toString())
                                + "_app_file_attachments.csv"
                );
                convert(input, output);
                assertThat(Files.size(output)).isGreaterThan(0L);
            }
        }
    }

    private static void convert(Path input, Path output) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(input.toFile());
             BufferedWriter writer = Files.newBufferedWriter(output, StandardCharsets.UTF_8)) {
            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            Row header = workbook.getSheetAt(0).getRow(0);
            Map<String, Integer> columns = headerColumns(header, formatter);
            assertThat(columns).containsKeys(
                    "KEYCODE3",
                    "CATEGORY2",
                    "IMAGE_NAME",
                    "IMAGE_PATH",
                    "IMAGE_REALNAME",
                    "SORT_NO"
            );

            // Windows Excel detects UTF-8 reliably when the CSV starts with a BOM.
            writer.write('\uFEFF');
            writer.write(CSV_HEADER);
            writer.newLine();

            for (Row row : workbook.getSheetAt(0)) {
                if (row.getRowNum() == 0) {
                    continue;
                }

                String ownerId = cellValue(row, columns.get("KEYCODE3"), formatter);
                String category = cellValue(row, columns.get("CATEGORY2"), formatter);
                String storedFilename = cellValue(row, columns.get("IMAGE_REALNAME"), formatter);
                if (ownerId.isBlank() || "%".equals(ownerId)
                        || category.isBlank() || storedFilename.isBlank()) {
                    continue;
                }

                String storedPath = normalizePath(
                        cellValue(row, columns.get("IMAGE_PATH"), formatter)
                );
                String originalFilename = cellValue(row, columns.get("IMAGE_NAME"), formatter);
                String attachmentType = attachmentType(category);
                String displayOrder = displayOrder(
                        cellValue(row, columns.get("SORT_NO"), formatter)
                );
                String fileId = md5(String.join("|",
                        "pq-image",
                        OWNER_TYPE,
                        ownerId,
                        attachmentType,
                        storedPath,
                        storedFilename
                ));

                writer.write(String.join(",",
                        csv(OWNER_TYPE),
                        csv(ownerId),
                        csv(attachmentType),
                        csv(fileId),
                        csv(originalFilename),
                        csv(storedPath),
                        csv(storedFilename),
                        csv(contentType(storedFilename)),
                        "",
                        csv("/files/" + fileId),
                        displayOrder,
                        csv(MIGRATION_TIMESTAMP),
                        csv("migration"),
                        csv(MIGRATION_TIMESTAMP),
                        csv("migration")
                ));
                writer.newLine();
            }
        }
    }

    private static Map<String, Integer> headerColumns(Row header, DataFormatter formatter) {
        Map<String, Integer> columns = new java.util.HashMap<>();
        for (Cell cell : header) {
            columns.put(formatter.formatCellValue(cell).trim().toUpperCase(Locale.ROOT),
                    cell.getColumnIndex());
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

    private static String normalizePath(String path) {
        return path.replace('\\', '/').replaceAll("^/+|/+$", "");
    }

    private static String attachmentType(String category) {
        return switch (category.trim()) {
            case "실적증명서" -> "PERFORMANCE";
            case "참여자명단" -> "PARTICIPANT_LIST";
            default -> throw new IllegalArgumentException("Unknown CATEGORY2: " + category);
        };
    }

    private static String displayOrder(String value) {
        if (value.isBlank()) {
            return "";
        }
        try {
            int order = Integer.parseInt(value);
            return order >= 1 && order <= 99 ? Integer.toString(order) : "";
        } catch (NumberFormatException exception) {
            return "";
        }
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

    private static String csv(String value) {
        String normalized = value == null ? "" : value;
        return '"' + normalized.replace("\"", "\"\"") + '"';
    }
}
