package com.cheil.cheil_be.adapter.in.web.bidnotice;

import com.cheil.cheil_be.application.bidnotice.port.in.BidNoticeSubmissionStatusUseCase;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pq/submit-stat")
@RequiredArgsConstructor
public class BidNoticeSubmissionStatusController {
    private final BidNoticeSubmissionStatusUseCase useCase;

    @GetMapping
    public List<SubmissionCountResponse> list(
            @RequestParam int year,
            @RequestParam(defaultValue = "12") int throughMonth
    ) {
        return useCase.findByDepartmentAndYear(year, throughMonth).stream()
                .map(count -> new SubmissionCountResponse(count.departmentCode(), count.year(), count.count(), count.total()))
                .toList();
    }

    public record SubmissionCountResponse(String departmentCode, int year, long count, boolean total) {}
}
