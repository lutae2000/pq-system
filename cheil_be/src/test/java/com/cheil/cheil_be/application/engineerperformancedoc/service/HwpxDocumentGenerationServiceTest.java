package com.cheil.cheil_be.application.engineerperformancedoc.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.cheil.cheil_be.adapter.in.web.engineerperformancedoc.HwpxGenerateRequest;
import com.cheil.cheil_be.application.bidnotice.service.BidNoticeAdminService;
import com.cheil.cheil_be.application.engineer.EngineerDtos;
import com.cheil.cheil_be.application.engineer.port.in.EngineerAdminUseCase;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import javax.xml.parsers.DocumentBuilderFactory;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockMultipartFile;
import org.w3c.dom.Element;

class HwpxDocumentGenerationServiceTest {

    @Test
    void generatesTheLicenseIssueDateInTheFormatRequestedByEachFieldName() throws Exception {
        var engineerService = mock(EngineerAdminUseCase.class);
        var basic = mock(EngineerDtos.Basic.class);
        when(basic.nameKor()).thenReturn("기술인");
        when(engineerService.findByEngrId("E100")).thenReturn(
                new EngineerDtos.Profile(basic, List.of(), List.of(), List.of(), List.of(), List.of(), List.of()));

        var reviewService = mock(EngineerPerformanceDocumentService.class);
        when(reviewService.findReviewResults(7L, "E100", null)).thenReturn(List.of());
        var jdbc = mock(JdbcClient.class);
        var query = mock(JdbcClient.StatementSpec.class);
        var resultSet = mock(ResultSet.class);
        when(resultSet.getString("date_of_issue")).thenReturn("2024-02-09");
        when(jdbc.sql(anyString())).thenReturn(query);
        when(query.params(anyMap())).thenReturn(query);
        when(query.query(ArgumentMatchers.<RowMapper<Object>>any())).thenAnswer(invocation -> {
            var result = mock(JdbcClient.MappedQuerySpec.class);
            RowMapper<Object> rowMapper = invocation.getArgument(0);
            var values = rowMapper.mapRow(resultSet, 0);
            when(result.optional()).thenReturn(Optional.of(values));
            return result;
        });

        var service = new HwpxDocumentGenerationService(engineerService, mock(BidNoticeAdminService.class), reviewService, jdbc);
        String dotted = "기본_자격증취득일(yyyy.mm.dd)";
        String dashed = "기본_자격증취득일(yyyy-mm-dd)";
        String defaultFormat = "기본_자격증취득일";
        Map<String, String> mappings = Map.of(dotted, "basic.licenseIssueDate", dashed, "basic.licenseIssueDate",
                defaultFormat, "basic.licenseIssueDate");
        var request = new HwpxGenerateRequest(7L, List.of("E100"), null, mappings);
        byte[] result = service.generate(template(dotted, dashed, defaultFormat), request);

        byte[] document = zipEntry(result, "기술인_기술인실적.hwpx");
        byte[] section = zipEntry(document, "Contents/section0.xml");
        var cells = DocumentBuilderFactory.newInstance().newDocumentBuilder()
                .parse(new ByteArrayInputStream(section)).getElementsByTagName("hp:tc");
        Map<String, String> expected = Map.of(dotted, "2024.02.09", dashed, "2024-02-09", defaultFormat, "2024-02-09");
        assertThat(cells.getLength()).isEqualTo(expected.size());
        for (int index = 0; index < cells.getLength(); index++) {
            Element cell = (Element) cells.item(index);
            String field = cell.getAttribute("name");
            assertThat(cell.getTextContent()).as(field).isEqualTo(expected.get(field));
        }
    }

    private static MockMultipartFile template(String... fields) throws IOException {
        var section = new StringBuilder("<hp:section xmlns:hp=\"http://www.hancom.co.kr/hwpml/2011/paragraph\">");
        for (String field : fields) {
            section.append("<hp:tc name=\"").append(field)
                    .append("\"><hp:subList><hp:p><hp:run><hp:t>placeholder</hp:t></hp:run></hp:p></hp:subList></hp:tc>");
        }
        section.append("</hp:section>");
        var bytes = new ByteArrayOutputStream();
        try (var zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
            for (var entry : Map.of("Contents/section0.xml", section.toString(), "mimetype", "application/hwp+zip",
                    "Contents/content.hpf", "<content/>", "Contents/header.xml", "<header/>").entrySet()) {
                zip.putNextEntry(new ZipEntry(entry.getKey()));
                zip.write(entry.getValue().getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();
            }
        }
        return new MockMultipartFile("template", "test.hwpx", "application/hwp+zip", bytes.toByteArray());
    }

    private static byte[] zipEntry(byte[] bytes, String name) throws IOException {
        try (var zip = new ZipInputStream(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (name.equals(entry.getName())) return zip.readAllBytes();
            }
        }
        throw new AssertionError("Missing ZIP entry: " + name);
    }
}
