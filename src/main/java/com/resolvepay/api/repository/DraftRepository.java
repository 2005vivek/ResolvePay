package com.resolvepay.api.repository;

import com.resolvepay.api.model.Draft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DraftRepository extends JpaRepository<Draft, UUID> {

    @Query("SELECT d FROM Draft d WHERE d.dispute.id = :disputeId")
    List<Draft> findByDisputeId(@Param("disputeId") UUID disputeId);
}
