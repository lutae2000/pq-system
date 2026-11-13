package com.cheil.cheil_be.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
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
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class OracleCsvToUtf8MigrationTest {
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
            assertThat(Files.readString(output, StandardCharsets.UTF_8))
                    .as("Decoded CSV contents in %s", output)
                    .isEqualTo(Files.readString(input, sourceCharset));
            assertThat(Files.readString(excelOutput, StandardCharsets.UTF_8))
                    .as("Excel CSV with UTF-8 BOM in %s", excelOutput)
                    .isEqualTo("\uFEFF" + Files.readString(output, StandardCharsets.UTF_8));
            System.out.printf("%s -> %s (UTF-8)%n", input, output);
        }
        assertThat(inputs).hasSizeGreaterThan(0);
    }

    @Test
    void preservesKoreanAndCsvFormatting(@TempDir Path directory) throws IOException {
        Path input = directory.resolve("oracle.csv");
        Path output = directory.resolve("utf8/oracle.csv");
        String csv = "이름,설명\r\n홍길동,\"쉼표, 줄바꿈\n포함\"\r\n";
        Files.writeString(input, csv, Charset.forName("EUC-KR"));

        convert(input, output, Charset.forName("EUC-KR"), false);

        assertThat(Files.readString(output, StandardCharsets.UTF_8)).isEqualTo(csv);
        assertThat(Files.readAllBytes(output)).isEqualTo(csv.getBytes(StandardCharsets.UTF_8));
    }

    private static void convert(Path input, Path output, Charset sourceCharset, boolean excelBom) throws IOException {
        Files.createDirectories(output.getParent());
        Path temporary = Files.createTempFile(output.getParent(), ".csv-utf8-", ".tmp");
        try {
            try (Reader reader = new java.io.InputStreamReader(
                    Files.newInputStream(input), sourceCharset.newDecoder()
                            .onMalformedInput(CodingErrorAction.REPORT)
                            .onUnmappableCharacter(CodingErrorAction.REPORT));
                 Writer writer = Files.newBufferedWriter(temporary, StandardCharsets.UTF_8)) {
                if (excelBom) writer.write('\uFEFF');
                reader.transferTo(writer);
            }
            Files.move(temporary, output, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            Files.deleteIfExists(temporary);
        }
    }
}
