package com.cheil.cheil_be.adapter.in.web.educationreminder;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.educationreminder.service.EducationReminderSendService;

/** 교육 알림 발송, 재시도, 발송 이력 조회를 제공하는 API다. */
@RestController
@RequestMapping("/education-reminders")
@RequiredArgsConstructor
public class EducationReminderSendController {

    private final EducationReminderSendService sendService;

    @PostMapping("/send")
    public ResponseEntity<EducationReminderSendResponse> send(@RequestBody EducationReminderSendRequest request) {
        return ResponseEntity.ok(sendService.send(request));
    }

    @PostMapping("/send-history/retry")
    public ResponseEntity<EducationReminderSendRetryResponse> retry(@RequestBody EducationReminderSendRetryRequest request) {
        return ResponseEntity.ok(sendService.retry(request));
    }

    @GetMapping("/send-history")
    public ResponseEntity<List<EducationReminderSendHistoryResponse>> listSendHistory(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String requestedFrom,
            @RequestParam(required = false) String requestedTo
    ) {
        return ResponseEntity.ok(sendService.findSendHistory(keyword, status, channel, requestedFrom, requestedTo));
    }
}
