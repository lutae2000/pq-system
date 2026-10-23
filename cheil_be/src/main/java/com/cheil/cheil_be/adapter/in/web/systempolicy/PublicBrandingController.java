package com.cheil.cheil_be.adapter.in.web.systempolicy;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cheil.cheil_be.application.systempolicy.service.BrandingAssetService;

/** 로그인 전에도 필요한 공개 브랜딩 정보를 제공하는 API다. */
@RestController
@RequestMapping("/public/branding")
@RequiredArgsConstructor
public class PublicBrandingController {

    private final BrandingAssetService brandingAssetService;

    @GetMapping
    public ResponseEntity<BrandingAssetService.BrandingSettings> getBranding() {
        return ResponseEntity.ok(brandingAssetService.findSettings());
    }
}
