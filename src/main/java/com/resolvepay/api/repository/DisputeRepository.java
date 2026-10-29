package com.resolvepay.api.repository;

import com.resolvepay.api.model.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, UUID> {
}