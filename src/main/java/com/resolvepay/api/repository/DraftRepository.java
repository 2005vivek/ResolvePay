package com.resolvepay.api.repository;

import com.resolvepay.api.model.Draft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DraftRepository extends JpaRepository<Draft, UUID> {
    List<Draft> findByDisputeId(UUID disputeId);
}