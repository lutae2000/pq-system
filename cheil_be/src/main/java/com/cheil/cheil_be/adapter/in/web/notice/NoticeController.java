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

import com.cheil.cheil_be.application.notice.service.NoticeAdminService;
import com.cheil.cheil_be.application.notice.service.NoticeAdminService.NoticeListScope;
import com.cheil.cheil_be.domain.notice.Notice;

@RestController
@RequestMapping("/system/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeAdminService noticeAdminService;

    @GetMapping
    public ResponseEntity<List<Notice>> list(@RequestParam(defaultValue = "DASHBOARD") NoticeListScope scope) {
        return ResponseEntity.ok(noticeAdminService.findAll(scope));
    }

    @GetMapping("/{noticeId}")
    public ResponseEntity<Notice> get(@PathVariable String noticeId) {
        return ResponseEntity.ok(noticeAdminService.findById(noticeId));
    }

    @PostMapping
    public ResponseEntity<Notice> create(@RequestBody Notice request) {
        return ResponseEntity.ok(noticeAdminService.create(request));
    }

    @PutMapping("/{noticeId}")
    public ResponseEntity<Notice> update(@PathVariable String noticeId, @RequestBody Notice request) {
        return ResponseEntity.ok(noticeAdminService.update(noticeId, request));
    }

    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> delete(@PathVariable String noticeId) {
        noticeAdminService.delete(noticeId);
        return ResponseEntity.noContent().build();
    }
}
