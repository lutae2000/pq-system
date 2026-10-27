package com.cheil.cheil_be.application.systempolicy.service;

import static com.cheil.cheil_be.application.systempolicy.model.BrandingPolicyKeys.COMPANY_LOGO;
import static com.cheil.cheil_be.application.systempolicy.model.BrandingPolicyKeys.FAVICON;
import static com.cheil.cheil_be.application.systempolicy.model.BrandingPolicyKeys.LOGIN_BACKGROUND;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.Locale;
import java.util.Map;

import javax.imageio.ImageIO;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.cheil.cheil_be.application.common.exception.ApplicationException;
import com.cheil.cheil_be.common.file.FileStorageResult;
import com.cheil.cheil_be.common.file.FileStorageService;
import com.cheil.cheil_be.application.systempolicy.port.in.SystemPolicyAdminUseCase;

@Service
@RequiredArgsConstructor
public class BrandingAssetService {

    public static final String DEFAULT_LOGIN_BACKGROUND_URL = "/login/login-light-hero-balanced-v2.png";
    public static final String DEFAULT_COMPANY_LOGO_URL = "/branding/logo_white_landscape.png";
    public static final String DEFAULT_FAVICON_URL = "";
    private static final String NO_FAVICON_POLICY_VALUE = "NONE";

    private static final Map<String, AssetDefinition> ASSET_DEFINITIONS = Map.of(
            "login-background", new AssetDefinition(
                    LOGIN_BACKGROUND,
                    "로그인 배경 이미지",
                    "로그인 화면에 표시할 배경 이미지입니다.",
                    200,
                    DEFAULT_LOGIN_BACKGROUND_URL
            ),
            "company-logo", new AssetDefinition(
                    COMPANY_LOGO,
                    "회사 로고",
                    "로그인 후 왼쪽 위에 표시할 회사 로고입니다.",
                    210,
                    DEFAULT_COMPANY_LOGO_URL
            ),
            "favicon", new AssetDefinition(
                    FAVICON,
                    "파비콘",
                    "브라우저 탭과 즐겨찾기에 표시할 아이콘입니다.",
                    220,
                    NO_FAVICON_POLICY_VALUE
            )
    );
    private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
            "png", "image/png",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "gif", "image/gif"
    );

    private final FileStorageService fileStorageService;
    private final SystemPolicyAdminUseCase systemPolicyAdminService;
    private final BrandingSettingsCacheService brandingSettingsCacheService;

    public BrandingSettings findSettings() {
        return brandingSettingsCacheService.getOrLoad(this::loadSettings);
    }

    private BrandingSettings loadSettings() {
        return new BrandingSettings(
                policyValue(LOGIN_BACKGROUND, DEFAULT_LOGIN_BACKGROUND_URL),
                policyValue(COMPANY_LOGO, DEFAULT_COMPANY_LOGO_URL),
                faviconValue()
        );
    }

    private String faviconValue() {
        String value = policyValue(FAVICON, DEFAULT_FAVICON_URL);
        return NO_FAVICON_POLICY_VALUE.equals(value) || "/branding/cheil-ci.svg".equals(value)
                ? DEFAULT_FAVICON_URL
                : value;
    }

    public BrandingSettings upload(String assetType, MultipartFile file) {
        AssetDefinition definition = requireAssetDefinition(assetType);
        validateImage(file);

        FileStorageResult uploaded = fileStorageService.upload(
                file,
                "SYSTEM_BRANDING",
                definition.policyKey(),
                assetType.toUpperCase(Locale.ROOT).replace('-', '_')
        );
        systemPolicyAdminService.upsertTextPolicy(
                definition.policyKey(),
                definition.policyName(),
                uploaded.downloadUrl(),
                definition.sortSeq(),
                definition.description()
        );
        return findSettings();
    }

    public BrandingSettings applyDefault(String assetType) {
        AssetDefinition definition = requireAssetDefinition(assetType);
        systemPolicyAdminService.upsertTextPolicy(
                definition.policyKey(),
                definition.policyName(),
                definition.defaultUrl(),
                definition.sortSeq(),
                definition.description()
        );
        return findSettings();
    }

    private static AssetDefinition requireAssetDefinition(String assetType) {
        AssetDefinition definition = ASSET_DEFINITIONS.get(assetType);
        if (definition == null) {
            throw ApplicationException.badRequest("지원하지 않는 브랜딩 이미지 유형입니다.");
        }
        return definition;
    }

    private String policyValue(String policyKey, String fallback) {
        return systemPolicyAdminService.findEnabledPolicy(policyKey)
                .map(policy -> policy.policyValue())
                .filter(StringUtils::hasText)
                .orElse(fallback);
    }

    private static void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApplicationException.badRequest("업로드할 이미지가 필요합니다.");
        }
        String filename = file.getOriginalFilename();
        String extension = extensionOf(filename);
        String expectedContentType = ALLOWED_IMAGE_TYPES.get(extension);
        if (expectedContentType == null || !expectedContentType.equalsIgnoreCase(file.getContentType())) {
            throw ApplicationException.badRequest("PNG, JPG, JPEG, GIF 이미지만 업로드할 수 있습니다.");
        }

        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null || image.getWidth() <= 0 || image.getHeight() <= 0) {
                throw ApplicationException.badRequest("올바른 이미지 파일이 아닙니다.");
            }
        } catch (IOException exception) {
            throw ApplicationException.badRequest("이미지 파일을 읽을 수 없습니다.", exception);
        }
    }

    private static String extensionOf(String filename) {
        if (!StringUtils.hasText(filename)) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return dot < 0 || dot == filename.length() - 1
                ? ""
                : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    public record BrandingSettings(String loginBackgroundUrl, String companyLogoUrl, String faviconUrl) {
    }

    private record AssetDefinition(String policyKey, String policyName, String description, int sortSeq, String defaultUrl) {
    }
}
