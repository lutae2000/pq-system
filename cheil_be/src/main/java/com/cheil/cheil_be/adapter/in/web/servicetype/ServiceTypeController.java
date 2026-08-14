package com.cheil.cheil_be.adapter.in.web.servicetype;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.servicetype.service.ServiceTypeAdminService;

@RestController
@RequestMapping("/pq/service-types")
@RequiredArgsConstructor
public class ServiceTypeController {

    private final ServiceTypeAdminService serviceTypeAdminService;

    /**
     * 용역구분 목록을 조회한다.
     */
    @GetMapping
    public ResponseEntity<List<ServiceTypeResponse>> list() {
        return ResponseEntity.ok(serviceTypeAdminService.findAll().stream().map(ServiceTypeResponse::from).toList());
    }

    /**
     * 용역구분 단건을 조회한다.
     */
    @GetMapping("/{serviceTypeCode}")
    public ResponseEntity<ServiceTypeResponse> get(@PathVariable String serviceTypeCode) {
        return ResponseEntity.ok(ServiceTypeResponse.from(serviceTypeAdminService.findByServiceTypeCode(serviceTypeCode)));
    }

    /**
     * 용역구분을 신규 등록한다.
     */
    @PostMapping
    public ResponseEntity<ServiceTypeResponse> create(@RequestBody ServiceTypeRequest request) {
        return ResponseEntity.ok(ServiceTypeResponse.from(serviceTypeAdminService.create(request.toCommand())));
    }

    /**
     * 기존 용역구분을 수정한다.
     */
    @PutMapping("/{serviceTypeCode}")
    public ResponseEntity<ServiceTypeResponse> update(
            @PathVariable String serviceTypeCode,
            @RequestBody ServiceTypeRequest request
    ) {
        return ResponseEntity.ok(ServiceTypeResponse.from(serviceTypeAdminService.update(serviceTypeCode, request.toCommand())));
    }

    /**
     * 용역구분을 삭제한다.
     */
    @DeleteMapping("/{serviceTypeCode}")
    public ResponseEntity<Void> delete(@PathVariable String serviceTypeCode) {
        serviceTypeAdminService.delete(serviceTypeCode);
        return ResponseEntity.noContent().build();
    }
}
