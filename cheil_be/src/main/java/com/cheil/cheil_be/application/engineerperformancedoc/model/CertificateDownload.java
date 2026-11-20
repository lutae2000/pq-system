package com.cheil.cheil_be.application.engineerperformancedoc.model;

public record CertificateDownload(byte[] content, boolean archive, int documentCount, int failedAttachmentCount) {
}
