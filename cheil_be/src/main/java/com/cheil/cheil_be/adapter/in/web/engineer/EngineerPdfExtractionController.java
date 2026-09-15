package com.cheil.cheil_be.adapter.in.web.engineer;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cheil.cheil_be.application.engineer.EngineerPdfExtractionDtos;
import com.cheil.cheil_be.application.engineer.EngineerPdfExtractionService;

@RestController
@RequestMapping("/pq/engineers/pdf-extractions")
@RequiredArgsConstructor
public class EngineerPdfExtractionController {

    private final EngineerPdfExtractionService engineerPdfExtractionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EngineerPdfExtractionDtos.Response> extract(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(engineerPdfExtractionService.extract(file));
    }
}
