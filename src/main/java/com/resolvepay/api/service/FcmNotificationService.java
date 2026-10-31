package com.resolvepay.api.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class FcmNotificationService {

    private static final Logger log = LoggerFactory.getLogger(FcmNotificationService.class);

    public boolean sendUrgentDisputeAlert(String fcmToken, String disputeId, String amount, String currency, String reason, String urgency) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.info("[FCM MOCK/DEV] Urgent Notification to token [{}]: Dispute ID={}, Amount={} {}, Reason={}, Urgency={}",
                    fcmToken, disputeId, amount, currency, reason, urgency);
            return true;
        }

        try {
            String title = "🚨 Urgent PayPal Dispute Action Required";
            String body = String.format("Dispute for %s %s (%s). Immediate review needed before deadline!", amount, currency, reason);

            Map<String, String> data = new HashMap<>();
            data.put("type", "DISPUTE_DEADLINE_WARNING");
            data.put("disputeId", disputeId);
            data.put("urgency", urgency != null ? urgency : "HIGH");

            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data)
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Successfully sent FCM message: {}", response);
            return true;
        } catch (Exception e) {
            log.error("Failed to send FCM alert for dispute {}: {}", disputeId, e.getMessage());
            return false;
        }
    }
}
