package com.cheil.cheil_be.adapter.in.web.certification;

import java.util.List;

import jakarta.validation.Valid;
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
import com.cheil.cheil_be.application.certification.port.in.CertificationUseCase;

/** 자격증 기준정보를 관리하는 API다. */
@RestController
@RequestMapping("/code/certifications")
@RequiredArgsConstructor
public class CertificationController {

    private final CertificationUseCase certificationUseCase;

    @GetMapping
    public ResponseEntity<List<CertificationResponse>> list(
            @RequestParam(required = false) Integer certKind
    ) {
        return ResponseEntity.ok(certificationUseCase.findAll(new CertificationSearchCondition(certKind))
                .stream()
                .map(CertificationResponse::from)
                .toList());
    }

    @GetMapping("/{certCode}")
    public ResponseEntity<CertificationResponse> get(@PathVariable String certCode) {
        return ResponseEntity.ok(CertificationResponse.from(certificationUseCase.findByCertCode(certCode)));
    }

    @PostMapping
    public ResponseEntity<CertificationResponse> create(@Valid @RequestBody CertificationRequest request) {
        return ResponseEntity.ok(CertificationResponse.from(certificationUseCase.create(request.toCommand())));
    }

    @PutMapping("/{certCode}")
    public ResponseEntity<CertificationResponse> update(@PathVariable String certCode, @Valid @RequestBody CertificationRequest request) {
        return ResponseEntity.ok(CertificationResponse.from(certificationUseCase.update(certCode, request.toCommand())));
    }

    @DeleteMapping("/{certCode}")
    public ResponseEntity<Void> delete(@PathVariable String certCode) {
        certificationUseCase.delete(certCode);
        return ResponseEntity.noContent().build();
    }
}
