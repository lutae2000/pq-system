package com.cheil.cheil_be.adapter.in.web.shinindo;

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

import com.cheil.cheil_be.application.shinindo.service.ShinindoManagementService;
import com.cheil.cheil_be.common.paging.PageRequests;
import com.cheil.cheil_be.common.web.PageResponse;

@RestController
@RequestMapping("/pq/shinindo-management")
@RequiredArgsConstructor
public class ShinindoManagementController {

    private final ShinindoManagementService shinindoManagementService;

    @GetMapping
    public ResponseEntity<PageResponse<ShinindoManagementResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String clientCode,
            @RequestParam(required = false) String referenceDate,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Page<ShinindoManagementResponse> result = shinindoManagementService.findAll(
                keyword,
                clientCode,
                referenceDate,
                PageRequests.of(page, size)
        );
        return ResponseEntity.ok(PageResponse.from(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShinindoManagementResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(shinindoManagementService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ShinindoManagementResponse> create(@RequestBody ShinindoManagementRequest request) {
        return ResponseEntity.ok(shinindoManagementService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShinindoManagementResponse> update(
            @PathVariable Long id,
            @RequestBody ShinindoManagementRequest request
    ) {
        return ResponseEntity.ok(shinindoManagementService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        shinindoManagementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
