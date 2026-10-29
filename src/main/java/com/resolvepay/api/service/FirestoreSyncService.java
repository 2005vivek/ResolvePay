package com.resolvepay.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class FirestoreSyncService {

    private static final Logger log = LoggerFactory.getLogger(FirestoreSyncService.class);

    private final Firestore firestore;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public FirestoreSyncService(@Autowired(required = false) Firestore firestore) {
        this.firestore = firestore;
    }

    public void syncProjectionFromOutboxPayload(String aggregateId, String payloadJson) {
        try {
            Map<String, Object> data = objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
            syncDisputeProjection(aggregateId, data);
        } catch (Exception e) {
            log.error("Failed to parse outbox payload for Firestore sync: {}", e.getMessage());
        }
    }

    public void syncDisputeProjection(String disputeId, Map<String, Object> data) {
        if (firestore == null) {
            log.info("[FIRESTORE MOCK/DEV] Projection sync for dispute [{}]: {}", disputeId, data);
            return;
        }

        try {
            firestore.collection("disputes")
                    .document(disputeId)
                    .set(data, SetOptions.merge())
                    .get(); // wait for sync
            log.info("Successfully pushed dispute projection to Firestore: {}", disputeId);
        } catch (Exception e) {
            log.error("Error writing projection to Firestore for dispute {}: {}", disputeId, e.getMessage(), e);
        }
    }

    public void syncEvidenceCount(String disputeId, int count) {
        Map<String, Object> update = new HashMap<>();
        update.put("evidenceCount", count);
        update.put("hasEvidence", count > 0);
        syncDisputeProjection(disputeId, update);
    }

    public void syncDraftStatus(String disputeId, String aiDraftStatus, String draftSnippet) {
        Map<String, Object> update = new HashMap<>();
        update.put("aiDraftStatus", aiDraftStatus);
        if (draftSnippet != null) {
            update.put("draftPreview", draftSnippet.length() > 200 ? draftSnippet.substring(0, 200) + "..." : draftSnippet);
        }
        syncDisputeProjection(disputeId, update);
    }
}
