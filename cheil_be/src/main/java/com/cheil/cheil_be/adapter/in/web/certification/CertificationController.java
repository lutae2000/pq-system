package com.cheil.cheil_be.adapter.in.web.certification;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.certification.port.in.CertificationSearchCondition;
import com.cheil.cheil_be.application.certification.service.CertificationAdminService;

@RestController
@RequestMapping("/code/certifications")
@RequiredArgsConstructor
public class CertificationController {

    private final CertificationAdminService certificationAdminService;

    @GetMapping
    public ResponseEntity<List<CertificationResponse>> list(
            @RequestParam(required = false) Integer certKind
    ) {
        return ResponseEntity.ok(certificationAdminService.findAll(new CertificationSearchCondition(certKind))
                .stream()
                .map(CertificationResponse::from)
                .toList());
    }

    @GetMapping("/{certCode}")
    public ResponseEntity<CertificationResponse> get(@PathVariable String certCode) {
        return ResponseEntity.ok(CertificationResponse.from(certificationAdminService.findByCertCode(certCode)));
    }

    @PostMapping
    public ResponseEntity<CertificationResponse> create(@RequestBody CertificationRequest request) {
        return ResponseEntity.ok(CertificationResponse.from(certificationAdminService.create(request.toCommand())));
    }

    @PutMapping("/{certCode}")
    public ResponseEntity<CertificationResponse> update(@PathVariable String certCode, @RequestBody CertificationRequest request) {
        return ResponseEntity.ok(CertificationResponse.from(certificationAdminService.update(certCode, request.toCommand())));
    }

    @DeleteMapping("/{certCode}")
    public ResponseEntity<Void> delete(@PathVariable String certCode) {
        certificationAdminService.delete(certCode);
        return ResponseEntity.noContent().build();
    }
}
