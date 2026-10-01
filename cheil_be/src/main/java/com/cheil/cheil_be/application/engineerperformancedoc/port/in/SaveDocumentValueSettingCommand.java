package com.cheil.cheil_be.application.engineerperformancedoc.port.in;

/** 화면 입력을 application 계층으로 전달하기 위한 문서 값 설정 저장 명령이다. */
public record SaveDocumentValueSettingCommand(
        Long bidSeq,
        String engineerId,
        Long educationId,
        Long licenseId
) {
}
