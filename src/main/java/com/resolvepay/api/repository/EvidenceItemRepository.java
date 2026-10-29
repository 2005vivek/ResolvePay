package com.resolvepay.api.repository;

import com.resolvepay.api.model.EvidenceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvidenceItemRepository extends JpaRepository<EvidenceItem, UUID> {
    List<EvidenceItem> findByDisputeId(UUID disputeId);
}