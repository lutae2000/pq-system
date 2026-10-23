package com.cheil.cheil_be.adapter.in.web.notice;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.notice.port.in.NoticeAdminUseCase;
import com.cheil.cheil_be.application.notice.port.in.NoticeAdminUseCase.NoticeListScope;
import com.cheil.cheil_be.domain.notice.Notice;

/** 시스템 공지사항을 조회하고 관리하는 API다. */
@RestController
@RequestMapping("/system/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeAdminUseCase noticeAdminService;

    @GetMapping
    public ResponseEntity<List<NoticeResponse>> list(@RequestParam(defaultValue = "DASHBOARD") NoticeListScope scope) {
        return ResponseEntity.ok(noticeAdminService.findAll(scope).stream().map(NoticeResponse::from).toList());
    }

    @GetMapping("/{noticeId}")
    public ResponseEntity<NoticeResponse> get(@PathVariable String noticeId) {
        return ResponseEntity.ok(NoticeResponse.from(noticeAdminService.findById(noticeId)));
    }

    @PostMapping
    public ResponseEntity<NoticeResponse> create(@RequestBody NoticeRequest request) {
        return ResponseEntity.ok(NoticeResponse.from(noticeAdminService.create(toDomain(request))));
    }

    @PutMapping("/{noticeId}")
    public ResponseEntity<NoticeResponse> update(@PathVariable String noticeId, @RequestBody NoticeRequest request) {
        return ResponseEntity.ok(NoticeResponse.from(noticeAdminService.update(noticeId, toDomain(request))));
    }

    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> delete(@PathVariable String noticeId) {
        noticeAdminService.delete(noticeId);
        return ResponseEntity.noContent().build();
    }

    private Notice toDomain(NoticeRequest request) {
        return request == null ? null : new Notice(
                request.active(), request.content(), request.exposureEndAt(), request.exposureStartAt(),
                request.id(), request.important(), request.publishAt(), request.title(), request.targetPath()
        );
    }

    public record NoticeRequest(
            boolean active,
            String content,
            String exposureEndAt,
            String exposureStartAt,
            String id,
            boolean important,
            String publishAt,
            String title,
            String targetPath
    ) {
    }

    public record NoticeResponse(
            boolean active,
            String content,
            String exposureEndAt,
            String exposureStartAt,
            String id,
            boolean important,
            String publishAt,
            String title,
            String targetPath
    ) {
        static NoticeResponse from(Notice notice) {
            return new NoticeResponse(
                    notice.isActive(), notice.getContent(), notice.getExposureEndAt(), notice.getExposureStartAt(),
                    notice.getId(), notice.isImportant(), notice.getPublishAt(), notice.getTitle(), notice.getTargetPath()
            );
        }
    }
}
