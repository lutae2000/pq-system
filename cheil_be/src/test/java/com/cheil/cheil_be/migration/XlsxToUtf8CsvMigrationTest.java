package com.cheil.cheil_be.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Test;

class XlsxToUtf8CsvMigrationTest {
    private static final Path DIRECTORY = Path.of(
            System.getProperty("xlsxMigrationDirectory", "C:/Users/cheil/migr"));

    @Test
    void convertsEveryXlsxInMigrationDirectoryToUtf8Csv() throws IOException {
        List<Path> inputs;
        try (Stream<Path> files = Files.list(DIRECTORY)) {
            inputs = files.filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".xlsx"))
                    .filter(path -> !path.getFileName().toString().startsWith("~$"))
                    .sorted().toList();
        }
        assertThat(inputs).as("XLSX files in %s", DIRECTORY).isNotEmpty();

        for (Path input : inputs) {
            try (Workbook workbook = WorkbookFactory.create(input.toFile())) {
                DataFormatter formatter = new DataFormatter(Locale.KOREA);
                var evaluator = workbook.getCreationHelper().createFormulaEvaluator();
                for (int sheetIndex = 0; sheetIndex < workbook.getNumberOfSheets(); sheetIndex++) {
                    Sheet sheet = workbook.getSheetAt(sheetIndex);
                    String stem = input.getFileName().toString().replaceFirst("(?i)\\.xlsx$", "");
                    String suffix = workbook.getNumberOfSheets() == 1 ? "" : "_sheet" + (sheetIndex + 1);
                    Path output = DIRECTORY.resolve(stem + suffix + ".csv");
                    int columns = sheet.getRow(0) == null ? 0 : sheet.getRow(0).getLastCellNum();
                    assertThat(columns).as("header columns in %s / %s", input, sheet.getSheetName()).isPositive();

                    long rows = 0;
                    String koreanSample = null;
                    // Windows Excel detects UTF-8 reliably when the CSV starts with a BOM.
                    try (BufferedWriter writer = Files.newBufferedWriter(output, StandardCharsets.UTF_8)) {
                        writer.write('\uFEFF');
                        for (int rowIndex = 0; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                            Row row = sheet.getRow(rowIndex);
                            for (int column = 0; column < columns; column++) {
                                if (column > 0) writer.write(',');
                                String value = row == null ? "" : formatter.formatCellValue(
                                        row.getCell(column, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL), evaluator);
                                if (koreanSample == null && value.matches("(?s).*[가-힣].*")) koreanSample = value;
                                writer.write(csv(value));
                            }
                            writer.newLine();
                            rows++;
                        }
                    }
                    assertThat(Files.size(output)).as("CSV output %s", output).isPositive();
                    byte[] bytes = Files.readAllBytes(output);
                    String decoded;
                    try {
                        decoded = StandardCharsets.UTF_8.newDecoder()
                                .onMalformedInput(CodingErrorAction.REPORT)
                                .onUnmappableCharacter(CodingErrorAction.REPORT)
                                .decode(ByteBuffer.wrap(bytes)).toString();
                    } catch (java.nio.charset.CharacterCodingException exception) {
                        throw new IOException("Invalid UTF-8 in " + output, exception);
                    }
                    assertThat(decoded).as("CSV must start with a UTF-8 BOM").startsWith("\uFEFF");
                    if (koreanSample != null) assertThat(decoded).contains(koreanSample);
                    System.out.printf("%s -> %s (%d data rows, %d columns)%n",
                            input.getFileName(), output.getFileName(), rows - 1, columns);
                }
            }
        }
    }

    private static String csv(String value) {
        if (value == null) return "";
        if (value.indexOf(',') < 0 && value.indexOf('"') < 0
                && value.indexOf('\n') < 0 && value.indexOf('\r') < 0) return value;
        return '"' + value.replace("\"", "\"\"") + '"';
    }
}
