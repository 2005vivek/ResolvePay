package com.resolvepay.api.repository;

import com.resolvepay.api.model.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {
    List<Dispute> findByMerchantId(String merchantId);
    Optional<Dispute> findByIdAndMerchantId(UUID id, String merchantId);
    Optional<Dispute> findByPaypalDisputeIdAndMerchantId(String paypalDisputeId, String merchantId);
    Optional<Dispute> findByPaypalDisputeId(String paypalDisputeId);
}
