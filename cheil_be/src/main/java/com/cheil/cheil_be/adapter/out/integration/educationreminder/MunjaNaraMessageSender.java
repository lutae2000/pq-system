package com.cheil.cheil_be.adapter.out.integration.educationreminder;

import static com.cheil.cheil_be.common.text.StringValues.emptyIfNull;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import com.cheil.cheil_be.application.educationreminder.model.EducationReminderMessageSendCommand;
import com.cheil.cheil_be.application.educationreminder.model.EducationReminderMessageSendResult;
import com.cheil.cheil_be.application.educationreminder.port.out.EducationReminderMessageSender;
import com.cheil.cheil_be.config.educationreminder.AppEducationReminderSendProperties;

/** 문자나라의 레거시 GET 연동 규격을 애플리케이션 포트로 감싼 출력 어댑터. */
@Component
@RequiredArgsConstructor
@Slf4j
public class MunjaNaraMessageSender implements EducationReminderMessageSender {

    private final RestClient munjaNaraRestClient;
    private final AppEducationReminderSendProperties sendProperties;

    @Override
    public EducationReminderMessageSendResult send(EducationReminderMessageSendCommand command) {
        AppEducationReminderSendProperties.MunjaNaraProperties properties = sendProperties.munjanara();
        if (properties == null || !sendProperties.enabled() || !properties.enabled()) {
            return EducationReminderMessageSendResult.failure("문자나라 연동이 활성화되지 않았습니다.", null);
        }
        if (!StringUtils.hasText(properties.userId())
                || !StringUtils.hasText(properties.secondPassword())
                || !StringUtils.hasText(properties.senderNumber())) {
            return EducationReminderMessageSendResult.failure(
                    "문자나라 연동 설정(userid, 2차 비밀번호, 발신번호)이 없습니다.", null);
        }

        try {
            log.info("문자나라 발송 요청: channel={}, receiver={}, messageBytes={}, testSend={}",
                    command.channel(), maskPhoneNo(command.receiverNumber()), messageByteLength(command.message()), command.testSend());
            String encodedMessage = encodeMessage(command.message(), properties.messageCharset());
            log.info("문자나라 메시지 URL 인코딩 완료: charset={}, encodedLength={}, encode=1",
                    resolveMessageCharset(properties.messageCharset()).name(), encodedMessage.length());
            URI requestUri = UriComponentsBuilder.fromUriString(properties.endpointUrl())
                    .queryParam("userid", properties.userId())
                    .queryParam("passwd", properties.secondPassword())
                    .queryParam("sender", properties.senderNumber())
                    .queryParam("receiver", command.receiverNumber())
                    // 문자나라의 encode=1은 URL 디코딩을 사용한다는 의미입니다.
                    .queryParam("encode", "1")
                    .queryParam("allow_mms", "LMS".equalsIgnoreCase(command.channel()) ? "1" : "0")
                    .queryParam("end_alert", "0")
                    .queryParam("admin_phone", emptyIfNull(properties.adminNumber()))
                    // 메시지 값은 문자나라가 URL 디코딩할 수 있도록 이미 인코딩한 값을 전달합니다.
                    .queryParam("message", encodedMessage)
                    .build(true)
                    .toUri();

            String responseBody = munjaNaraRestClient.get()
                    .uri(requestUri)
                    .retrieve()
                    .body(String.class);

            EducationReminderMessageSendResult result = parseResponse(responseBody);
            log.info("문자나라 발송 응답: channel={}, receiver={}, resultCode={}, success={}",
                    command.channel(), maskPhoneNo(command.receiverNumber()), resultCode(responseBody), result.success());
            return result;
        } catch (RestClientResponseException exception) {
            return EducationReminderMessageSendResult.failure(
                    "문자나라 HTTP " + exception.getStatusCode().value(), null);
        } catch (RuntimeException exception) {
            log.warn("문자나라 메시지 발송 중 오류가 발생했습니다.", exception);
            return EducationReminderMessageSendResult.failure("문자나라 호출에 실패했습니다.", exception.getMessage());
        }
    }

    private EducationReminderMessageSendResult parseResponse(String responseBody) {
        String normalized = emptyIfNull(responseBody).trim();
        String resultCode = normalized.split("\\|", 2)[0].trim();
        if ("9".equals(resultCode)) {
            return EducationReminderMessageSendResult.success(normalized);
        }
        return EducationReminderMessageSendResult.failure(
                "문자나라 발송 실패(" + resultCode + "): " + resultDescription(resultCode), normalized);
    }

    private String resultDescription(String resultCode) {
        return switch (resultCode) {
            case "1" -> "필수 전달값 누락";
            case "2" -> "존재하지 않는 아이디";
            case "3" -> "2차 비밀번호 인증 실패";
            case "4" -> "잔액 부족";
            case "6", "12" -> "발신번호 오류";
            case "7" -> "사용 중지된 아이디";
            case "11" -> "중복 전송";
            case "13" -> "등록되지 않은 발신번호";
            case "14" -> "허용되지 않은 접속 IP";
            case "15" -> "비정상적인 반복 접속";
            default -> "문자나라 응답 확인 필요";
        };
    }

    private String resultCode(String responseBody) {
        return emptyIfNull(responseBody).trim().split("\\|", 2)[0].trim();
    }

    private int messageByteLength(String message) {
        return (int) emptyIfNull(message).codePoints()
                .mapToLong(codePoint -> codePoint > 0x7F ? 2 : 1)
                .sum();
    }

    /**
     * 문자나라의 encode=1 처리를 위해 메시지 바이트를 지정 문자셋으로 변환한 뒤
     * UTF-8 URL이 아닌 해당 문자셋 기준으로 percent encoding 합니다.
     * 기본값은 문자나라 공식 예제의 한글 깨짐 대응 방식인 EUC-KR입니다.
     */
    private String encodeMessage(String message, String charsetName) {
        Charset charset = resolveMessageCharset(charsetName);
        return URLEncoder.encode(emptyIfNull(message), charset);
    }

    private Charset resolveMessageCharset(String charsetName) {
        if (!StringUtils.hasText(charsetName)) {
            return StandardCharsets.UTF_8;
        }
        try {
            return Charset.forName(charsetName.trim());
        } catch (Exception exception) {
            log.warn("지원하지 않는 문자나라 메시지 문자셋입니다. UTF-8을 사용합니다: {}", charsetName);
            return StandardCharsets.UTF_8;
        }
    }

    private String maskPhoneNo(String value) {
        String phoneNo = emptyIfNull(value);
        if (phoneNo.length() <= 4) {
            return "****";
        }
        return "*".repeat(Math.max(0, phoneNo.length() - 4)) + phoneNo.substring(phoneNo.length() - 4);
    }

}
