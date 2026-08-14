package com.cheil.cheil_be.adapter.in.web.file;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.multipart.MultipartFile;

import com.cheil.cheil_be.adapter.in.web.error.GlobalExceptionHandler;
import com.cheil.cheil_be.common.file.FileDownloadResult;
import com.cheil.cheil_be.common.file.FileStorageResult;
import com.cheil.cheil_be.common.file.FileStorageService;
import com.cheil.cheil_be.config.security.LoginJwtAuthenticationFilter;
import com.cheil.cheil_be.config.security.ServiceHeaderAuthenticationFilter;

@WebMvcTest(
        controllers = FileController.class,
        excludeFilters = {
                @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = ServiceHeaderAuthenticationFilter.class),
                @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = LoginJwtAuthenticationFilter.class)
        }
)
@AutoConfigureMockMvc(addFilters = false)
@org.springframework.context.annotation.Import(GlobalExceptionHandler.class)
class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FileStorageService fileStorageService;

    @Test
    void uploadReturnsCreatedResponse() throws Exception {
        when(fileStorageService.upload(
                any(MultipartFile.class),
                nullable(String.class),
                nullable(String.class),
                nullable(String.class)
        )).thenReturn(new FileStorageResult(
                "file-123",
                "report.txt",
                "text/plain",
                5L,
                "/files/file-123"
        ));

        mockMvc.perform(multipart("/files")
                        .file(new org.springframework.mock.web.MockMultipartFile(
                                "file",
                                "report.txt",
                                "text/plain",
                                "hello".getBytes(StandardCharsets.UTF_8)
                        )))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileId", is("file-123")))
                .andExpect(jsonPath("$.originalFilename", is("report.txt")))
                .andExpect(jsonPath("$.contentType", is("text/plain")))
                .andExpect(jsonPath("$.size", is(5)))
                .andExpect(jsonPath("$.downloadUrl", is("/files/file-123")))
                .andExpect(header().string("Location", "/files/file-123"));
    }

    @Test
    void downloadReturnsAttachmentHeaders() throws Exception {
        when(fileStorageService.download("file-123")).thenReturn(new FileDownloadResult(
                "file-123",
                new ByteArrayResource("hello".getBytes(StandardCharsets.UTF_8)),
                "report.txt",
                MediaType.TEXT_PLAIN,
                5L
        ));

        mockMvc.perform(get("/files/file-123"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, org.hamcrest.Matchers.containsString("text/plain")))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("report.txt")))
                .andExpect(content().bytes("hello".getBytes(StandardCharsets.UTF_8)));
    }
}
