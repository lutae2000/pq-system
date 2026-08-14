package com.cheil.cheil_be.adapter.in.web.newtechnology;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.newtechnology.service.NewTechnologyInvestmentService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/new-technology-investments")
@RequiredArgsConstructor
public class NewTechnologyInvestmentController {

    private final NewTechnologyInvestmentService newTechnologyInvestmentService;

    @GetMapping
    public ResponseEntity<PageResponse<NewTechnologyInvestmentResponse>> list(
            @RequestParam(required = false) String yearFrom,
            @RequestParam(required = false) String yearTo,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<NewTechnologyInvestmentResponse> result = newTechnologyInvestmentService.findAll(
                yearFrom,
                yearTo,
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewTechnologyInvestmentResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(newTechnologyInvestmentService.findById(id));
    }

    @PostMapping
    public ResponseEntity<NewTechnologyInvestmentResponse> create(@RequestBody NewTechnologyInvestmentRequest request) {
        return ResponseEntity.ok(newTechnologyInvestmentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewTechnologyInvestmentResponse> update(
            @PathVariable Long id,
            @RequestBody NewTechnologyInvestmentRequest request
    ) {
        return ResponseEntity.ok(newTechnologyInvestmentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        newTechnologyInvestmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
