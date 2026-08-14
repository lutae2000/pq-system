package com.cheil.cheil_be.adapter.in.web.dashboard.bidnotice;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.bidnotice.service.BidNoticeDashboardService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/dashboard/bid-notices")
public class BidNoticeDashboardController {

    private final BidNoticeDashboardService bidNoticeDashboardService;

    @GetMapping("/calendar")
    public ResponseEntity<List<BidNoticeCalendarResponse>> calendar(
            @RequestParam(required = false) String yearMonth,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String deptCode
    ) {
        List<BidNoticeCalendarResponse> response = yearMonth != null && !yearMonth.isBlank()
                ? bidNoticeDashboardService.findCalendarByYearMonth(yearMonth, deptCode)
                .stream()
                .map(BidNoticeCalendarResponse::from)
                .toList()
                : bidNoticeDashboardService.findCalendarByMonth(requiredInt(year, "year"), requiredInt(month, "month"), deptCode)
                .stream()
                .map(BidNoticeCalendarResponse::from)
                .toList();

        return ResponseEntity.ok(response);
    }

    private int requiredInt(Integer value, String name) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, name + " is required when yearMonth is not provided.");
        }
        return value;
    }
}
