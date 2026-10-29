package com.resolvepay.api.repository;

import com.resolvepay.api.model.WebhookInbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface WebhookInboxRepository extends JpaRepository<WebhookInbox, UUID> {
    Optional<WebhookInbox> findByProviderAndProviderEventId(String provider, String providerEventId);
    List<WebhookInbox> findByProcessingStatus(String processingStatus);
}
