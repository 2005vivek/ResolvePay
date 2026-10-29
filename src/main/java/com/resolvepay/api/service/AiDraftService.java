package com.resolvepay.api.service;

import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.model.Draft;
import com.resolvepay.api.repository.DraftRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
public class AiDraftService {

    private static final Logger log = LoggerFactory.getLogger(AiDraftService.class);

    private final ChatClient chatClient;
    private final DraftRepository draftRepository;
    private final ExecutorService virtualThreadExecutor = Executors.newVirtualThreadPerTaskExecutor();

    @Value("${spring.ai.google.genai.chat.options.model:gemini-3.5-flash-lite}")
    private String configuredModel;

    private static final int CALL_TIMEOUT_SECONDS = 45;

    public AiDraftService(ChatClient.Builder chatClientBuilder, DraftRepository draftRepository) {
        this.chatClient = chatClientBuilder.build();
        this.draftRepository = draftRepository;
    }

    public String generateResolutionDraft(Dispute dispute) {
        String prompt = String.format(
                "You are a professional payment dispute resolution specialist. " +
                        "Draft a concise, polite message to a customer regarding their PayPal dispute (ID: %s). " +
                        "The dispute reason is '%s' for the amount of %s %s. " +
                        "Ask them to provide any relevant shipping tracking numbers or communication logs so we can resolve this quickly.",
                dispute.getPaypalDisputeId(), dispute.getReason(), dispute.getAmount(), dispute.getCurrency()
        );

        String primaryModel = (configuredModel != null && !configuredModel.isBlank()) ? configuredModel : "gemini-3.5-flash-lite";
        String fallbackModel = "gemini-3.5-flash-lite".equalsIgnoreCase(primaryModel)
                ? "gemini-3.1-flash-lite"
                : "gemini-3.5-flash-lite";

        String draftContent = null;
        String usedModel = primaryModel;
        long startTime = System.currentTimeMillis();

        try {
            log.info("Generating resolution draft for dispute {} using primary model [{}]", dispute.getId(), primaryModel);
            draftContent = executePromptWithTimeout(prompt, primaryModel, CALL_TIMEOUT_SECONDS);
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("Successfully generated draft with primary model [{}] in {}ms", primaryModel, elapsed);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            log.warn("Primary model [{}] failed after {}ms: {}. Triggering fallback to [{}]",
                    primaryModel, elapsed, e.getMessage(), fallbackModel);
            try {
                usedModel = fallbackModel;
                long fallbackStart = System.currentTimeMillis();
                draftContent = executePromptWithTimeout(prompt, fallbackModel, CALL_TIMEOUT_SECONDS);
                long fallbackElapsed = System.currentTimeMillis() - fallbackStart;
                log.info("Successfully generated draft with fallback model [{}] in {}ms", fallbackModel, fallbackElapsed);
            } catch (Exception fallbackEx) {
                log.error("Fallback model [{}] also failed for dispute {}: {}", fallbackModel, dispute.getId(), fallbackEx.getMessage());
                throw new RuntimeException("AI draft generation unavailable. Both primary (" + primaryModel +
                        ") and fallback (" + fallbackModel + ") failed: " + fallbackEx.getMessage(), fallbackEx);
            }
        }

        // Persist draft in repository
        if (draftContent != null && !draftContent.isBlank()) {
            try {
                Draft draft = new Draft();
                draft.setDispute(dispute);
                List<Draft> existingDrafts = draftRepository.findByDisputeId(dispute.getId());
                draft.setVersion(existingDrafts != null ? existingDrafts.size() + 1 : 1);
                draft.setText(draftContent);
                draft.setReviewerStatus("PENDING_REVIEW");
                draft.setAiModelMetadata(String.format("{\"model\":\"%s\",\"generatedAt\":\"%s\"}", usedModel, Instant.now()));
                draftRepository.save(draft);
                log.info("Persisted draft v{} for dispute {}", draft.getVersion(), dispute.getId());
            } catch (Exception ex) {
                log.warn("Failed to persist draft entity for dispute {}: {}", dispute.getId(), ex.getMessage());
            }
        }

        return draftContent;
    }

    private String executePromptWithTimeout(String prompt, String model, int timeoutSeconds) throws Exception {
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() ->
                chatClient.prompt()
                        .options(GoogleGenAiChatOptions.builder()
                                .model(model)
                                .maxOutputTokens(800)
                                .temperature(0.7))
                        .user(prompt)
                        .call()
                        .content(),
                virtualThreadExecutor
        );

        try {
            return future.get(timeoutSeconds, TimeUnit.SECONDS);
        } catch (TimeoutException te) {
            future.cancel(true);
            throw new RuntimeException("Request to model [" + model + "] timed out after " + timeoutSeconds + "s", te);
        } catch (Exception e) {
            Throwable cause = e.getCause() != null ? e.getCause() : e;
            throw new RuntimeException("Model [" + model + "] error: " + cause.getMessage(), cause);
        }
    }
}
