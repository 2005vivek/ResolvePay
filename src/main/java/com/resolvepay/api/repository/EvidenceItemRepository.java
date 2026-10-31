package com.resolvepay.api.repository;

import com.resolvepay.api.model.EvidenceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EvidenceItemRepository extends JpaRepository<EvidenceItem, UUID> {

    @Query("SELECT e FROM EvidenceItem e WHERE e.dispute.id = :disputeId")
    List<EvidenceItem> findByDisputeId(@Param("disputeId") UUID disputeId);

    @Query("SELECT e FROM EvidenceItem e WHERE e.dispute.id = :disputeId AND e.merchantId = :merchantId")
    List<EvidenceItem> findByDisputeIdAndMerchantId(@Param("disputeId") UUID disputeId, @Param("merchantId") String merchantId);

    Optional<EvidenceItem> findByIdAndMerchantId(UUID id, String merchantId);
}
