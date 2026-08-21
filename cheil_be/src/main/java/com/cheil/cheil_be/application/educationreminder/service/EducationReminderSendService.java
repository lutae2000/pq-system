package com.cheil.cheil_be.application.educationreminder.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderNotificationTargetResponse;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderSendHistoryResponse;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderSendRequest;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderSendRetryRequest;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderSendRetryResponse;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderSendResponse;
import com.cheil.cheil_be.adapter.in.web.educationreminder.EducationReminderTemplateResponse;
import com.cheil.cheil_be.adapter.out.persistence.educationreminder.EducationReminderTemplateEntity;
import com.cheil.cheil_be.adapter.out.persistence.educationreminder.EducationReminderTemplateJpaRepository;
import com.cheil.cheil_be.common.security.AuditActorResolver;
import com.cheil.cheil_be.config.educationreminder.AppEducationReminderSendProperties;

@Service
@RequiredArgsConstructor
@Slf4j
public class EducationReminderSendService {

    private static final int ENGINEER_ID_MAX_LENGTH = 20;
    private static final int PHONE_NO_MAX_LENGTH = 50;
    private static final int TEMPLATE_NAME_MAX_LENGTH = 300;
    private static final int CHANNEL_MAX_LENGTH = 10;
    private static final int SMS_MAX_BYTES = 90;

    private final JdbcClient jdbcClient;
    private final EducationReminderCompletionService completionService;
    private final EducationReminderTemplateJpaRepository templateRepository;
    private final AppEducationReminderSendProperties sendProperties;
    @Qualifier("educationReminderSendExecutor")
    private final TaskExecutor educationReminderSendExecutor;

    private record PendingSendItem(
            Long logId,
            String rowKey,
            String engineerId,
            String engineerName,
            String departmentName,
            String targetPhoneNo,
            String actualPhoneNo,
            String channel,
            String templateName,
            String messageContent,
            boolean testSend
    ) {
    }

    private record RetrySourceSendLog(
            Long logId,
            Long templateId,
            String templateName,
            String channel,
            String rowKey,
            String engineerId,
            String engineerName,
            String departmentName,
            String targetPhoneNo,
            String actualPhoneNo,
            String messageContent,
            boolean testSend
    ) {
    }

    private record RetryDispatchPlan(
            long batchId,
            PendingSendItem item
    ) {
    }

    @Transactional(readOnly = true)
    public List<EducationReminderSendHistoryResponse> findSendHistory(
            String keyword,
            String status,
            String channel,
            String requestedFrom,
            String requestedTo
    ) {
        String normalizedKeyword = like(keyword);
        String normalizedStatus = nullIfBlank(status);
        String normalizedChannel = nullIfBlank(channel);
        LocalDate normalizedRequestedFrom = parseOptionalDate(requestedFrom, "requestedFrom");
        LocalDate normalizedRequestedTo = parseOptionalDate(requestedTo, "requestedTo");

        return jdbcClient.sql("""
                        SELECT
                            l.id AS log_id,
                            l.batch_id,
                            l.requested_at,
                            b.requested_by,
                            l.template_name,
                            l.channel,
                            l.engineer_name,
                            l.department_name,
                            l.target_phone_no,
                            l.actual_phone_no,
                            l.message_content,
                            l.status,
                            l.failure_reason,
                            l.sent_at,
                            l.is_test_send
                        FROM education_reminder_send_logs l
                        JOIN education_reminder_send_batches b ON b.id = l.batch_id
                        WHERE 1 = 1
                        %s
                        ORDER BY l.id DESC
                        """.formatted(buildSendHistoryWhere(normalizedKeyword, normalizedStatus, normalizedChannel, normalizedRequestedFrom, normalizedRequestedTo)))
                .params(buildSendHistoryParams(normalizedKeyword, normalizedStatus, normalizedChannel, normalizedRequestedFrom, normalizedRequestedTo))
                .query((rs, rowNum) -> new EducationReminderSendHistoryResponse(
                        rs.getLong("log_id"),
                        rs.getLong("batch_id"),
                        timestampToString(rs.getTimestamp("requested_at")),
                        rs.getString("requested_by"),
                        rs.getString("template_name"),
                        rs.getString("channel"),
                        rs.getString("engineer_name"),
                        rs.getString("department_name"),
                        rs.getString("target_phone_no"),
                        rs.getString("actual_phone_no"),
                        rs.getString("message_content"),
                        rs.getString("status"),
                        rs.getString("failure_reason"),
                        timestampToString(rs.getTimestamp("sent_at")),
                        rs.getBoolean("is_test_send")
                ))
                .list();
    }

    public EducationReminderSendResponse send(EducationReminderSendRequest request) {
        List<String> targetRowKeys = request.targetRowKeys() == null ? List.of() : request.targetRowKeys().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();
        if (targetRowKeys.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetRowKeys is required.");
        }

        boolean testSend = Boolean.TRUE.equals(request.testSend());
        String testPhoneNo = normalizePhoneNo(request.testPhoneNo());
        if (testSend && !StringUtils.hasText(testPhoneNo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "testPhoneNo is required for test send.");
        }

        boolean manualMode = StringUtils.hasText(request.manualContent());
        EducationReminderTemplateEntity template = null;
        String channel;
        String templateName;
        String messageSource;

        if (manualMode) {
            channel = normalizeChannel(request.manualChannel());
            if (!"SMS".equals(channel) && !"LMS".equals(channel)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Manual messages must use SMS or LMS.");
            }
            templateName = "Manual message";
            messageSource = request.manualContent().trim();
        } else {
            Long templateId = request.templateId();
            if (templateId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "templateId is required.");
            }
            template = templateRepository.findById(templateId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found."));
            if (!template.isActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Template is inactive.");
            }
            channel = normalizeChannel(template.getChannel());
            templateName = normalizeTemplateName(template.getName());
            messageSource = template.getContent();
        }

        List<EducationReminderNotificationTargetResponse> selectedTargets = completionService.findNotificationTargets(null, null, null)
                .stream()
                .filter(row -> targetRowKeys.contains(row.rowKey()))
                .toList();
        if (selectedTargets.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Selected send targets were not found.");
        }

        if (testSend) {
            selectedTargets = List.of(selectedTargets.get(0));
        }

        if ("SMS".equals(channel) && selectedTargets.stream()
                .map(target -> renderMessage(messageSource, target))
                .anyMatch(message -> smsByteLength(message) > SMS_MAX_BYTES)) {
            channel = "LMS";
        }

        String actor = normalizeActor(AuditActorResolver.resolve());
        String previewMessage = renderMessage(messageSource, selectedTargets.get(0));
        long batchId = insertBatch(actor, manualMode ? 0L : template.getId(), templateName, channel, selectedTargets.size(), testSend, testPhoneNo, previewMessage);
        List<PendingSendItem> pendingItems = insertSendLogs(
                batchId,
                actor,
                manualMode ? 0L : template.getId(),
                templateName,
                messageSource,
                channel,
                selectedTargets,
                testSend,
                testPhoneNo
        );
        afterCommit(() -> educationReminderSendExecutor.execute(() -> processBatch(batchId, actor, pendingItems)));

        return new EducationReminderSendResponse(
                batchId,
                selectedTargets.size(),
                pendingItems.size(),
                testSend,
                channel,
                templateName,
                previewMessage
        );
    }

    public EducationReminderSendRetryResponse retry(EducationReminderSendRetryRequest request) {
        List<EducationReminderSendRetryRequest.Item> items = request.items() == null ? List.of() : request.items().stream()
                .filter(Objects::nonNull)
                .filter(item -> item.logId() != null)
                .toList();
        if (items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "items is required.");
        }

        String actor = normalizeActor(AuditActorResolver.resolve());
        List<RetryDispatchPlan> plans = new ArrayList<>();

        for (EducationReminderSendRetryRequest.Item item : items) {
            RetrySourceSendLog source = findRetrySourceSendLog(item.logId());
            String actualPhoneNo = normalizePhoneNo(item.actualPhoneNo());
            if (!StringUtils.hasText(actualPhoneNo)) {
                actualPhoneNo = normalizePhoneNo(source.actualPhoneNo());
            }
            if (!StringUtils.hasText(actualPhoneNo)) {
                actualPhoneNo = normalizePhoneNo(source.targetPhoneNo());
            }
            if (!StringUtils.hasText(actualPhoneNo)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "actualPhoneNo is required for retry.");
            }

            PendingSendItem pendingItem = new PendingSendItem(
                    null,
                    source.rowKey(),
                    source.engineerId(),
                    source.engineerName(),
                    source.departmentName(),
                    source.targetPhoneNo(),
                    actualPhoneNo,
                    source.channel(),
                    source.templateName(),
                    source.messageContent(),
                    source.testSend()
            );
            long batchId = insertRetryBatch(actor, source, actualPhoneNo);
            long logId = insertRetryLog(batchId, actor, source, actualPhoneNo);
            plans.add(new RetryDispatchPlan(batchId, new PendingSendItem(
                    logId,
                    pendingItem.rowKey(),
                    pendingItem.engineerId(),
                    pendingItem.engineerName(),
                    pendingItem.departmentName(),
                    pendingItem.targetPhoneNo(),
                    pendingItem.actualPhoneNo(),
                    pendingItem.channel(),
                    pendingItem.templateName(),
                    pendingItem.messageContent(),
                    pendingItem.testSend()
            )));
        }

        afterCommit(() -> educationReminderSendExecutor.execute(() -> {
            for (RetryDispatchPlan plan : plans) {
                processBatch(plan.batchId(), actor, List.of(plan.item()));
            }
        }));

        return new EducationReminderSendRetryResponse(items.size(), plans.size(), plans.size());
    }

    private RetrySourceSendLog findRetrySourceSendLog(Long logId) {
        RetrySourceSendLog source = jdbcClient.sql("""
                        SELECT
                            l.id AS log_id,
                            l.template_id,
                            l.template_name,
                            l.channel,
                            l.target_row_key,
                            l.engineer_id,
                            l.engineer_name,
                            l.department_name,
                            l.target_phone_no,
                            l.actual_phone_no,
                            l.message_content,
                            l.is_test_send
                        FROM education_reminder_send_logs l
                        WHERE l.id = :logId
                        """)
                .param("logId", logId)
                .query((rs, rowNum) -> new RetrySourceSendLog(
                        rs.getLong("log_id"),
                        rs.getLong("template_id"),
                        rs.getString("template_name"),
                        rs.getString("channel"),
                        rs.getString("target_row_key"),
                        rs.getString("engineer_id"),
                        rs.getString("engineer_name"),
                        rs.getString("department_name"),
                        rs.getString("target_phone_no"),
                        rs.getString("actual_phone_no"),
                        rs.getString("message_content"),
                        rs.getBoolean("is_test_send")
                ))
                .optional()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Retry source log not found."));

        return source;
    }

    private String buildSendHistoryWhere(String keyword, String status, String channel, LocalDate requestedFrom, LocalDate requestedTo) {
        StringBuilder where = new StringBuilder();
        if (keyword != null) {
            where.append("\n                          AND (LOWER(l.engineer_name) LIKE :keyword")
                    .append(" OR LOWER(l.department_name) LIKE :keyword")
                    .append(" OR LOWER(l.actual_phone_no) LIKE :keyword")
                    .append(" OR LOWER(l.template_name) LIKE :keyword")
                    .append(" OR LOWER(l.message_content) LIKE :keyword")
                    .append(" OR LOWER(COALESCE(l.failure_reason, '')) LIKE :keyword)")
                    .append("\n");
        }
        if (status != null) {
            where.append("\n                          AND l.status = :status");
        }
        if (channel != null) {
            where.append("\n                          AND l.channel = :channel");
        }
        if (requestedFrom != null) {
            where.append("\n                          AND l.requested_at >= CAST(:requestedFrom AS date)");
        }
        if (requestedTo != null) {
            where.append("\n                          AND l.requested_at < CAST(:requestedTo AS date) + INTERVAL '1 day'");
        }
        return where.toString();
    }

    private Map<String, Object> buildSendHistoryParams(
            String keyword,
            String status,
            String channel,
            LocalDate requestedFrom,
            LocalDate requestedTo
    ) {
        Map<String, Object> params = new LinkedHashMap<>();
        if (keyword != null) {
            params.put("keyword", keyword);
        }
        if (status != null) {
            params.put("status", status);
        }
        if (channel != null) {
            params.put("channel", channel);
        }
        if (requestedFrom != null) {
            params.put("requestedFrom", requestedFrom);
        }
        if (requestedTo != null) {
            params.put("requestedTo", requestedTo);
        }
        return params;
    }

    private LocalDate parseOptionalDate(String value, String fieldName) {
        String normalized = nullIfBlank(value);
        if (normalized == null) {
            return null;
        }
        try {
            return LocalDate.parse(normalized);
        } catch (java.time.format.DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be yyyy-MM-dd.");
        }
    }

    private long insertBatch(
            String actor,
            long templateId,
            String templateName,
            String channel,
            int targetCount,
            boolean testSend,
            String testPhoneNo,
            String previewMessage
    ) {
        return jdbcClient.sql("""
                        INSERT INTO education_reminder_send_batches (
                            requested_at,
                            requested_by,
                            template_id,
                            template_name,
                            channel,
                            is_test_send,
                            test_phone_no,
                            target_count,
                            success_count,
                            fail_count,
                            status,
                            preview_message,
                            created_at,
                            created_id,
                            last_changed_at,
                            last_changed_id
                        )
                        VALUES (
                            CURRENT_TIMESTAMP,
                            :requestedBy,
                            :templateId,
                            :templateName,
                            :channel,
                            :testSend,
                            :testPhoneNo,
                            :targetCount,
                            0,
                            0,
                            'PENDING',
                            :previewMessage,
                            CURRENT_TIMESTAMP,
                            :requestedBy,
                            CURRENT_TIMESTAMP,
                            :requestedBy
                        )
                        RETURNING id
                        """)
                .param("requestedBy", actor)
                .param("templateId", templateId)
                .param("templateName", templateName)
                .param("channel", channel)
                .param("testSend", testSend)
                .param("testPhoneNo", testPhoneNo)
                .param("targetCount", targetCount)
                .param("previewMessage", previewMessage)
                .query(Long.class)
                .single();
    }

    private List<PendingSendItem> insertSendLogs(
            long batchId,
            String actor,
            long templateId,
            String templateName,
            String messageSource,
            String channel,
            List<EducationReminderNotificationTargetResponse> targets,
            boolean testSend,
            String testPhoneNo
    ) {
        List<PendingSendItem> items = new ArrayList<>();
        for (EducationReminderNotificationTargetResponse target : targets) {
            String actualPhoneNo = testSend ? testPhoneNo : normalizePhoneNo(target.phoneNo());
            String messageContent = renderMessage(messageSource, target);
            validateMessageLength(channel, messageContent);
            Long logId = jdbcClient.sql("""
                            INSERT INTO education_reminder_send_logs (
                                batch_id,
                                target_row_key,
                                engineer_id,
                                engineer_name,
                                department_name,
                                target_phone_no,
                                actual_phone_no,
                                channel,
                                template_id,
                                template_name,
                                message_content,
                                is_test_send,
                                status,
                                requested_at,
                                created_at,
                                created_id,
                                last_changed_at,
                                last_changed_id
                            )
                            VALUES (
                                :batchId,
                                :targetRowKey,
                                :engineerId,
                                :engineerName,
                                :departmentName,
                                :targetPhoneNo,
                                :actualPhoneNo,
                                :channel,
                                :templateId,
                                :templateName,
                                :messageContent,
                                :testSend,
                                'PENDING',
                                CURRENT_TIMESTAMP,
                                CURRENT_TIMESTAMP,
                                :requestedBy,
                                CURRENT_TIMESTAMP,
                                :requestedBy
                            )
                            RETURNING id
                            """)
                    .param("batchId", batchId)
                    .param("targetRowKey", target.rowKey())
                    .param("engineerId", target.engineerId())
                    .param("engineerName", target.name())
                    .param("departmentName", target.department())
                    .param("targetPhoneNo", normalizePhoneNo(target.phoneNo()))
                    .param("actualPhoneNo", actualPhoneNo)
                    .param("channel", channel)
                    .param("templateId", templateId)
                    .param("templateName", templateName)
                    .param("messageContent", messageContent)
                    .param("testSend", testSend)
                    .param("requestedBy", actor)
                    .query(Long.class)
                    .single();

            items.add(new PendingSendItem(
                    logId,
                    target.rowKey(),
                    target.engineerId(),
                    target.name(),
                    target.department(),
                    normalizePhoneNo(target.phoneNo()),
                    actualPhoneNo,
                    channel,
                    templateName,
                    messageContent,
                    testSend
            ));
        }
        return items;
    }

    private long insertRetryBatch(String actor, RetrySourceSendLog source, String actualPhoneNo) {
        String testPhoneNo = source.testSend() ? actualPhoneNo : null;
        return jdbcClient.sql("""
                        INSERT INTO education_reminder_send_batches (
                            requested_at,
                            requested_by,
                            template_id,
                            template_name,
                            channel,
                            is_test_send,
                            test_phone_no,
                            target_count,
                            success_count,
                            fail_count,
                            status,
                            preview_message,
                            created_at,
                            created_id,
                            last_changed_at,
                            last_changed_id
                        )
                        VALUES (
                            CURRENT_TIMESTAMP,
                            :requestedBy,
                            :templateId,
                            :templateName,
                            :channel,
                            :testSend,
                            :testPhoneNo,
                            1,
                            0,
                            0,
                            'PENDING',
                            :previewMessage,
                            CURRENT_TIMESTAMP,
                            :requestedBy,
                            CURRENT_TIMESTAMP,
                            :requestedBy
                        )
                        RETURNING id
                        """)
                .param("requestedBy", actor)
                .param("templateId", source.templateId())
                .param("templateName", source.templateName())
                .param("channel", source.channel())
                .param("testSend", source.testSend())
                .param("testPhoneNo", testPhoneNo)
                .param("previewMessage", source.messageContent())
                .query(Long.class)
                .single();
    }

    private long insertRetryLog(long batchId, String actor, RetrySourceSendLog source, String actualPhoneNo) {
        return jdbcClient.sql("""
                        INSERT INTO education_reminder_send_logs (
                            batch_id,
                            target_row_key,
                            engineer_id,
                            engineer_name,
                            department_name,
                            target_phone_no,
                            actual_phone_no,
                            channel,
                            template_id,
                            template_name,
                            message_content,
                            is_test_send,
                            status,
                            requested_at,
                            created_at,
                            created_id,
                            last_changed_at,
                            last_changed_id
                        )
                        VALUES (
                            :batchId,
                            :targetRowKey,
                            :engineerId,
                            :engineerName,
                            :departmentName,
                            :targetPhoneNo,
                            :actualPhoneNo,
                            :channel,
                            :templateId,
                            :templateName,
                            :messageContent,
                            :testSend,
                            'PENDING',
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP,
                            :requestedBy,
                            CURRENT_TIMESTAMP,
                            :requestedBy
                        )
                        RETURNING id
                        """)
                .param("batchId", batchId)
                .param("targetRowKey", source.rowKey())
                .param("engineerId", source.engineerId())
                .param("engineerName", source.engineerName())
                .param("departmentName", source.departmentName())
                .param("targetPhoneNo", source.targetPhoneNo())
                .param("actualPhoneNo", actualPhoneNo)
                .param("channel", source.channel())
                .param("templateId", source.templateId())
                .param("templateName", source.templateName())
                .param("messageContent", source.messageContent())
                .param("testSend", source.testSend())
                .param("requestedBy", actor)
                .query(Long.class)
                .single();
    }

    private void processBatch(long batchId, String actor, Collection<PendingSendItem> items) {
        int successCount = 0;
        int failCount = 0;

        for (PendingSendItem item : items) {
            ChannelDispatchResult result = dispatch(item);
            if (result.success()) {
                successCount += 1;
            } else {
                failCount += 1;
            }
            updateSendLog(item.logId(), actor, result);
        }

        updateBatch(batchId, actor, successCount, failCount);
    }

    private ChannelDispatchResult dispatch(PendingSendItem item) {
        AppEducationReminderSendProperties.ChannelProperties channelProperties = sendProperties.channel(item.channel());
        if (!sendProperties.enabled() || !channelProperties.enabled() || !StringUtils.hasText(channelProperties.endpointUrl()) || channelProperties.simulate()) {
            return ChannelDispatchResult.success("SIMULATED");
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            Map<String, Object> payload = Map.of(
                    "channel", item.channel(),
                    "phoneNo", item.actualPhoneNo(),
                    "templateName", item.templateName(),
                    "messageContent", item.messageContent(),
                    "testSend", item.testSend(),
                    "engineerId", item.engineerId(),
                    "engineerName", item.engineerName(),
                    "departmentName", item.departmentName()
            );
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(channelProperties.endpointUrl()))
                    .timeout(Duration.ofSeconds(15))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("X-Sender-Name", nullToEmpty(channelProperties.senderName()))
                    .header("X-Api-Key", nullToEmpty(channelProperties.apiKey()))
                    .POST(HttpRequest.BodyPublishers.ofString(toJson(payload)))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return ChannelDispatchResult.success(response.body());
            }
            return ChannelDispatchResult.failure("Channel returned HTTP " + response.statusCode(), response.body());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return ChannelDispatchResult.failure("Dispatch interrupted.", ex.getMessage());
        } catch (IOException ex) {
            return ChannelDispatchResult.failure("Dispatch failed.", ex.getMessage());
        } catch (RuntimeException ex) {
            return ChannelDispatchResult.failure("Dispatch failed.", ex.getMessage());
        }
    }

    private void updateSendLog(long logId, String actor, ChannelDispatchResult result) {
        jdbcClient.sql("""
                        UPDATE education_reminder_send_logs
                        SET status = :status,
                            failure_reason = :failureReason,
                            response_payload = :responsePayload,
                            sent_at = CASE WHEN :success THEN CURRENT_TIMESTAMP ELSE sent_at END,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :logId
                        """)
                .param("status", result.success() ? "SUCCESS" : "FAILED")
                .param("failureReason", result.success() ? null : result.failureReason())
                .param("responsePayload", result.responsePayload())
                .param("success", result.success())
                .param("actor", actor)
                .param("logId", logId)
                .update();
    }

    private void updateBatch(long batchId, String actor, int successCount, int failCount) {
        String batchStatus = failCount == 0 ? "COMPLETED" : successCount == 0 ? "FAILED" : "PARTIAL";
        jdbcClient.sql("""
                        UPDATE education_reminder_send_batches
                        SET success_count = :successCount,
                            fail_count = :failCount,
                            status = :status,
                            completed_at = CURRENT_TIMESTAMP,
                            last_changed_at = CURRENT_TIMESTAMP,
                            last_changed_id = :actor
                        WHERE id = :batchId
                        """)
                .param("successCount", successCount)
                .param("failCount", failCount)
                .param("status", batchStatus)
                .param("actor", actor)
                .param("batchId", batchId)
                .update();
    }

    private void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
            return;
        }

        action.run();
    }

    private String renderMessage(String templateContent, EducationReminderNotificationTargetResponse target) {
        String content = StringUtils.hasText(templateContent) ? templateContent : "";
        return content
                .replace("{대상자명}", nullToEmpty(target.name()))
                .replace("{이름}", nullToEmpty(target.name()))
                .replace("{부서명}", nullToEmpty(target.department()))
                .replace("{교육명}", nullToEmpty(target.targetEducationNames()))
                .replace("{교육이름}", nullToEmpty(target.targetEducationNames()))
                .replace("{전화번호}", nullToEmpty(target.phoneNo()))
                .replace("{채널}", nullToEmpty(target.highlightTone() == null ? "" : target.highlightTone().name()))
                .trim();
    }

    private String normalizePhoneNo(String value) {
        return StringUtils.hasText(value) ? value.replaceAll("\\D", "") : "";
    }

    private void validateMessageLength(String channel, String messageContent) {
        if ("SMS".equalsIgnoreCase(channel) && smsByteLength(messageContent) > SMS_MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SMS message must be 90 bytes or less.");
        }
    }

    private int smsByteLength(String value) {
        return (int) value.codePoints().mapToLong(codePoint -> codePoint > 0x7F ? 2 : 1).sum();
    }

    private String normalizeActor(String value) {
        return StringUtils.hasText(value) ? value.trim() : "system";
    }

    private String normalizeChannel(String value) {
        return StringUtils.hasText(value) ? value.trim().toUpperCase() : "LMS";
    }

    private String normalizeTemplateName(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String toJson(Map<String, Object> payload) {
        return payload.entrySet().stream()
                .map(entry -> "\"" + escapeJson(entry.getKey()) + "\":" + toJsonValue(entry.getValue()))
                .collect(Collectors.joining(",", "{", "}"));
    }

    private String toJsonValue(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof Boolean || value instanceof Number) {
            return value.toString();
        }
        return "\"" + escapeJson(String.valueOf(value)) + "\"";
    }

    private String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n")
                .replace("\t", "\\t");
    }

    private String like(String value) {
        return StringUtils.hasText(value) ? "%" + value.trim().toLowerCase() + "%" : null;
    }

    private String nullIfBlank(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String timestampToString(java.sql.Timestamp value) {
        return value == null ? null : value.toLocalDateTime().toString();
    }

    private record ChannelDispatchResult(boolean success, String failureReason, String responsePayload) {
        static ChannelDispatchResult success(String responsePayload) {
            return new ChannelDispatchResult(true, null, responsePayload);
        }

        static ChannelDispatchResult failure(String failureReason, String responsePayload) {
            return new ChannelDispatchResult(false, failureReason, responsePayload);
        }
    }
}
