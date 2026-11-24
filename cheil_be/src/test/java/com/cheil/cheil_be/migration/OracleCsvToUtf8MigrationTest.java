package com.cheil.cheil_be.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.Writer;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class OracleCsvToUtf8MigrationTest {
    private static final char ORACLE_LINE_BREAK = '\u007F';
    private static final Path INPUT_DIRECTORY = Path.of(System.getProperty(
            "oracleCsvDirectory", "C:/Users/cheil/오라클 csv"));
    private static final Path OUTPUT_DIRECTORY = INPUT_DIRECTORY.resolve("utf8");
    private static final Path EXCEL_OUTPUT_DIRECTORY = INPUT_DIRECTORY.resolve("utf8-excel");

    @Test
    void convertsAllOracleCsvFilesToUtf8() throws IOException {
        Assumptions.assumeTrue(Files.isDirectory(INPUT_DIRECTORY),
                "CSV directory does not exist: " + INPUT_DIRECTORY);
        List<Path> inputs;
        try (Stream<Path> paths = Files.walk(INPUT_DIRECTORY)) {
            inputs = paths.filter(Files::isRegularFile)
                    .filter(path -> !path.startsWith(OUTPUT_DIRECTORY))
                    .filter(path -> !path.startsWith(EXCEL_OUTPUT_DIRECTORY))
                    .filter(path -> path.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".csv"))
                    .sorted()
                    .toList();
        }
        Assumptions.assumeTrue(!inputs.isEmpty(), "No CSV files in " + INPUT_DIRECTORY);

        Charset sourceCharset = Charset.forName(System.getProperty("oracleCsvCharset", "EUC-KR"));
        for (Path input : inputs) {
            Path output = OUTPUT_DIRECTORY.resolve(INPUT_DIRECTORY.relativize(input));
            Path excelOutput = EXCEL_OUTPUT_DIRECTORY.resolve(INPUT_DIRECTORY.relativize(input));
            convert(input, output, sourceCharset, false);
            convert(input, excelOutput, sourceCharset, true);
            assertThat(Files.size(output) > 0).as("UTF-8 CSV %s", output)
                    .isEqualTo(Files.size(input) > 0);
            String source = Files.readString(input, sourceCharset);
            String converted = Files.readString(output, StandardCharsets.UTF_8);
            if (source.indexOf(ORACLE_LINE_BREAK) < 0) {
                assertThat(converted).as("Decoded CSV contents in %s", output).isEqualTo(source);
            } else {
                assertThat(converted).doesNotContain(String.valueOf(ORACLE_LINE_BREAK));
                try (CSVParser sourceRows = CSVParser.parse(source, CSVFormat.RFC4180);
                     CSVParser convertedRows = CSVParser.parse(converted, CSVFormat.RFC4180)) {
                    assertThat(convertedRows).as("CSV records in %s", output)
                            .extracting(CSVRecord::toList)
                            .containsExactlyElementsOf(sourceRows.stream()
                                    .map(row -> row.toList().stream()
                                            .map(field -> field.replace(ORACLE_LINE_BREAK, '\n'))
                                            .toList())
                                    .toList());
                }
            }
            assertThat(Files.readString(excelOutput, StandardCharsets.UTF_8))
                    .as("Excel CSV with UTF-8 BOM in %s", excelOutput)
                    .isEqualTo("\uFEFF" + converted);
            System.out.printf("%s -> %s (UTF-8)%n", input, output);
        }
        assertThat(inputs).hasSizeGreaterThan(0);
    }

    @Test
    void preservesKoreanAndLineEndingsInBothUtf8Outputs(@TempDir Path directory) throws IOException {
        Path input = directory.resolve("oracle.csv");
        Path output = directory.resolve("utf8/oracle.csv");
        Path excelOutput = directory.resolve("utf8-excel/oracle.csv");
        Charset sourceCharset = Charset.forName("EUC-KR");
        String quotedField = "\"첫 줄, \"\"인용\"\"\n\n다음 줄\r\n세 번째 줄\r마지막 줄";
        String source = "이름,설명\r\n"
                + "홍길동," + quotedField + "\u007F끝\"\n"
                + "김철수,첫 줄\u007F\u007F다음 줄\r"
                + "이영희,마지막 레코드\u007F";
        String expected = "이름,설명\r\n"
                + "홍길동," + quotedField + "\n끝\"\n"
                + "김철수,\"첫 줄\n\n다음 줄\"\r"
                + "이영희,\"마지막 레코드\n\"";
        Files.writeString(input, source, sourceCharset);

        convert(input, output, sourceCharset, false);
        convert(input, excelOutput, sourceCharset, true);

        assertThat(Files.readAllBytes(output)).isEqualTo(expected.getBytes(StandardCharsets.UTF_8));
        assertThat(Files.readAllBytes(excelOutput)).isEqualTo(("\uFEFF" + expected).getBytes(StandardCharsets.UTF_8));
    }

    private static void convert(Path input, Path output, Charset sourceCharset, boolean excelBom) throws IOException {
        Files.createDirectories(output.getParent());
        Path temporary = Files.createTempFile(output.getParent(), ".csv-utf8-", ".tmp");
        try {
            try (Reader reader = new BufferedReader(new InputStreamReader(
                    Files.newInputStream(input), sourceCharset.newDecoder()
                            .onMalformedInput(CodingErrorAction.REPORT)
                            .onUnmappableCharacter(CodingErrorAction.REPORT)));
                 Writer writer = Files.newBufferedWriter(temporary, StandardCharsets.UTF_8)) {
                if (excelBom) writer.write('\uFEFF');
                writeCsvWithRestoredLineBreaks(reader, writer);
            }
            Files.move(temporary, output, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            Files.deleteIfExists(temporary);
        }
    }

    private static void writeCsvWithRestoredLineBreaks(Reader reader, Writer writer) throws IOException {
        StringBuilder field = new StringBuilder();
        boolean insideQuotes = false;
        int next;
        while ((next = reader.read()) != -1) {
            char character = (char) next;
            if (!insideQuotes && (character == ',' || character == '\r' || character == '\n')) {
                writeField(field, writer);
                field.setLength(0);
                writer.write(character);
            } else {
                // An escaped quote pair toggles twice without closing the field.
                if (character == '"' && (field.isEmpty() || field.charAt(0) == '"')) {
                    insideQuotes = !insideQuotes;
                }
                field.append(character);
            }
        }
        writeField(field, writer);
    }

    private static void writeField(StringBuilder field, Writer writer) throws IOException {
        String rawField = field.toString();
        if (rawField.indexOf(ORACLE_LINE_BREAK) < 0) {
            writer.write(rawField);
            return;
        }
        String restored = rawField.replace(ORACLE_LINE_BREAK, '\n');
        if (rawField.charAt(0) == '"') {
            writer.write(restored);
        } else {
            writer.write('"');
            writer.write(restored.replace("\"", "\"\""));
            writer.write('"');
        }
    }
}
