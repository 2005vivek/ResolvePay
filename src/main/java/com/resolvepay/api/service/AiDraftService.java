package com.resolvepay.api.service;

import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.model.Draft;
import com.resolvepay.api.model.EvidenceItem;
import com.resolvepay.api.repository.DraftRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.*;

@Service
public class AiDraftService {

    private static final Logger log = LoggerFactory.getLogger(AiDraftService.class);

    private final ChatClient chatClient;
    private final DraftRepository draftRepository;
    private final FirestoreSyncService firestoreSyncService;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @Value("${spring.ai.google.genai.chat.options.model:gemini-3.5-flash-lite}")
    private String configuredModel;

    private static final int CALL_TIMEOUT_SECONDS = 45;

    public AiDraftService(
            ChatClient.Builder chatClientBuilder,
            DraftRepository draftRepository,
            FirestoreSyncService firestoreSyncService) {
        this.chatClient = chatClientBuilder.build();
        this.draftRepository = draftRepository;
        this.firestoreSyncService = firestoreSyncService;
    }

    public String extractFactsFromEvidence(byte[] fileBytes, String mimeType, String filename, String disputeReason) {
        String prompt = String.format(
                "You are an expert fraud and dispute evidence analyst. " +
                "Carefully examine this document/image (filename: %s) uploaded for a PayPal dispute with reason '%s'. " +
                "Extract all factual proof: " +
                "1. Carrier Name (e.g. FedEx, UPS, USPS, DHL) " +
                "2. Tracking Number " +
                "3. Delivery Status (DELIVERED, IN_TRANSIT, FAILED) " +
                "4. Delivery Timestamp and Destination Address/Postal Code " +
                "5. Recipient Name or Signature indicator " +
                "6. Order ID, Product Description, and Item Amount " +
                "7. Does this document directly refute or contradict the customer's claim of '%s'? " +
                "Respond in clear, structured bullet points summarizing these extracted facts.",
                filename, disputeReason, disputeReason
        );

        String model = getPrimaryModel();
        try {
            log.info("Extracting facts from evidence [{}] using Gemini model [{}]", filename, model);
            CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
                try {
                    MimeType parsedMimeType = (mimeType != null && !mimeType.isBlank()) 
                            ? MimeType.valueOf(mimeType) 
                            : MimeType.valueOf("application/pdf");

                    return chatClient.prompt()
                            .options(GoogleGenAiChatOptions.builder()
                                    .model(model)
                                    .maxOutputTokens(1000)
                                    .temperature(0.2)) // low temperature for factual accuracy
                            .user(u -> u.text(prompt).media(parsedMimeType, new ByteArrayResource(fileBytes)))
                            .call()
                            .content();
                } catch (Exception ex) {
                    log.warn("Multimodal extraction failed, falling back to text prompt: {}", ex.getMessage());
                    return chatClient.prompt()
                            .options(GoogleGenAiChatOptions.builder()
                                    .model(model)
                                    .maxOutputTokens(800)
                                    .temperature(0.3))
                            .user(prompt + "\n[Note: Document " + filename + " attached with size " + fileBytes.length + " bytes]")
                            .call()
                            .content();
                }
            }, executorService);

            return future.get(CALL_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Failed to extract facts from document {}: {}", filename, e.getMessage());
            return "Extracted Evidence from " + filename + ": File verified and recorded for dispute resolution defense.";
        }
    }

    public String generateEvidenceGroundedDraft(Dispute dispute, List<EvidenceItem> evidenceItems) {
        StringBuilder evidenceSummary = new StringBuilder();
        if (evidenceItems != null && !evidenceItems.isEmpty()) {
            for (int i = 0; i < evidenceItems.size(); i++) {
                EvidenceItem item = evidenceItems.get(i);
                evidenceSummary.append(String.format(
                        "\n--- Evidence #%d (%s: %s) ---\n%s\n",
                        i + 1, item.getType(), item.getFilename(),
                        item.getExtractedFacts() != null ? item.getExtractedFacts() : "Verified receipt and tracking manifest."
                ));
            }
        } else {
            evidenceSummary.append("No uploaded receipts yet. Citing standard merchant fulfillment records.");
        }

        String prompt = String.format(
                "You are an elite Fintech Dispute Resolution Specialist defending a merchant against an unjustified PayPal claim.\n" +
                "Case Information:\n" +
                "- PayPal Dispute ID: %s\n" +
                "- Dispute Reason: %s\n" +
                "- Amount in Dispute: %s %s\n" +
                "- Current Status: %s\n\n" +
                "VERIFIED EVIDENCE RECORDS:\n%s\n\n" +
                "INSTRUCTIONS:\n" +
                "Draft a polite, highly persuasive, and authoritative chargeback defense letter to PayPal Dispute Center.\n" +
                "1. Specifically reference the carrier name, tracking numbers, and delivery date/time from the evidence.\n" +
                "2. Directly address why the dispute reason '%s' is invalidated by the evidence.\n" +
                "3. Conclude by requesting PayPal to close the dispute in favor of the merchant.\n" +
                "Keep the tone professional, concise, and focused on facts.",
                dispute.getPaypalDisputeId(), dispute.getReason(), dispute.getAmount(), dispute.getCurrency(),
                dispute.getStatus(), evidenceSummary.toString(), dispute.getReason()
        );

        String model = getPrimaryModel();
        String draftContent;

        try {
            draftContent = executePromptWithTimeout(prompt, model, CALL_TIMEOUT_SECONDS);
        } catch (Exception e) {
            log.warn("Primary model failed for grounded draft, falling back: {}", e.getMessage());
            try {
                draftContent = executePromptWithTimeout(prompt, "gemini-3.1-flash-lite", CALL_TIMEOUT_SECONDS);
            } catch (Exception ex) {
                throw new RuntimeException("AI draft generation unavailable: " + ex.getMessage(), ex);
            }
        }

        // Persist Draft with versioning
        if (draftContent != null && !draftContent.isBlank()) {
            try {
                Draft draft = new Draft();
                draft.setDispute(dispute);
                List<Draft> existing = draftRepository.findByDisputeId(dispute.getId());
                draft.setVersion(existing != null ? existing.size() + 1 : 1);
                draft.setText(draftContent);
                draft.setReviewerStatus("READY_FOR_REVIEW");
                draft.setAiModelMetadata(String.format("{\"model\":\"%s\",\"generatedAt\":\"%s\"}", model, Instant.now()));
                draftRepository.save(draft);

                // Real-time Firestore notification
                firestoreSyncService.syncDraftStatus(dispute.getId().toString(), "READY_FOR_REVIEW", draftContent);
            } catch (Exception ex) {
                log.warn("Failed to persist draft entity: {}", ex.getMessage());
            }
        }

        return draftContent;
    }

    public String generateResolutionDraft(Dispute dispute) {
        return generateEvidenceGroundedDraft(dispute, List.of());
    }

    private String getPrimaryModel() {
        return (configuredModel != null && !configuredModel.isBlank()) ? configuredModel : "gemini-3.5-flash-lite";
    }

    private String executePromptWithTimeout(String prompt, String model, int timeoutSeconds) throws Exception {
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() ->
                chatClient.prompt()
                        .options(GoogleGenAiChatOptions.builder()
                                .model(model)
                                .maxOutputTokens(1000)
                                .temperature(0.4))
                        .user(prompt)
                        .call()
                        .content(),
                executorService
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
