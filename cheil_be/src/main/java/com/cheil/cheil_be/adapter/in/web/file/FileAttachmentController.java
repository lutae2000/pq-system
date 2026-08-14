package com.cheil.cheil_be.adapter.in.web.file;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.common.file.FileAttachmentService;

@RestController
@RequiredArgsConstructor
public class FileAttachmentController {

    private final FileAttachmentService fileAttachmentService;

    @GetMapping("/file-attachments")
    public ResponseEntity<List<FileAttachmentResponse>> list(
            @RequestParam String ownerType,
            @RequestParam String ownerId
    ) {
        return ResponseEntity.ok(fileAttachmentService.findAll(ownerType, ownerId).stream()
                .map(FileAttachmentResponse::from)
                .toList());
    }

    @PostMapping("/file-attachments")
    public ResponseEntity<FileAttachmentResponse> add(@RequestBody FileAttachmentRequest request) {
        return ResponseEntity.ok(FileAttachmentResponse.from(fileAttachmentService.add(request)));
    }

    @DeleteMapping("/file-attachments/{attachmentId}")
    public ResponseEntity<Void> delete(@PathVariable Long attachmentId) {
        fileAttachmentService.delete(attachmentId);
        return ResponseEntity.noContent().build();
    }
}
