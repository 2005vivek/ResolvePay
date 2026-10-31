package com.resolvepay.api.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.credentials.path:}")
    private String credentialsPath;

    @Value("${firebase.project-id:resolvepay-sandbox}")
    private String projectId;

    @Bean
    public Firestore firestore() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = null;

                if (credentialsPath != null && !credentialsPath.isBlank()) {
                    File file = new File(credentialsPath);
                    if (file.exists()) {
                        serviceAccount = new FileInputStream(file);
                        log.info("Loading Firebase credentials from file: {}", credentialsPath);
                    }
                }

                if (serviceAccount == null) {
                    serviceAccount = getClass().getClassLoader().getResourceAsStream("firebase-service-account.json");
                }

                if (serviceAccount != null) {
                    FirebaseOptions options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .setProjectId(projectId)
                            .build();
                    FirebaseApp.initializeApp(options);
                    log.info("Firebase App initialized successfully with credentials.");
                    return FirestoreClient.getFirestore();
                } else {
                    log.warn("No Firebase service account credentials found. Real-time Firebase will run in Mock/Development Mode.");
                    return null;
                }
            } else {
                return FirestoreClient.getFirestore();
            }
        } catch (Exception e) {
            log.warn("Firebase initialization warning (running in safe offline/mock mode): {}", e.getMessage());
            return null;
        }
    }
}
