package com.cheil.cheil_be.adapter.in.web.notice;

import java.util.Map;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.notice.service.NotificationPreferenceService;
import com.cheil.cheil_be.domain.notice.NotificationPreferenceOption;

@RestController
@RequestMapping("/system/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {
    private final NotificationPreferenceService service;

    @GetMapping
    public ResponseEntity<Map<String, Boolean>> list() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/options")
    public ResponseEntity<List<NotificationPreferenceOption>> options() {
        return ResponseEntity.ok(service.findOptions());
    }

    @PutMapping
    public ResponseEntity<Void> save(@RequestBody PreferenceRequest request) {
        service.save(request.menuPath(), request.receiveYn());
        return ResponseEntity.noContent().build();
    }

    public record PreferenceRequest(String menuPath, Boolean receiveYn) {}
}
