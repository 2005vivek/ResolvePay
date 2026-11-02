package com.resolvepay.api.config;

import com.resolvepay.api.model.Dispute;
import com.resolvepay.api.repository.DisputeRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DisputeDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DisputeDataSeeder.class);

    private final DisputeRepository disputeRepository;

    @Override
    public void run(String... args) {
        long count = disputeRepository.count();
        if (count == 0) {
            log.info("No disputes found in database. Seeding initial baseline disputes for merchant_resolvepay_01...");

            Dispute d1 = new Dispute();
            d1.setMerchantId("merchant_resolvepay_01");
            d1.setPaypalDisputeId("PP-D-258533");
            d1.setStatus("REQUIRED_ACTION");
            d1.setAmount(new BigDecimal("249.99"));
            d1.setCurrency("USD");
            d1.setReason("MERCHANDISE_OR_SERVICE_NOT_RECEIVED");
            d1.setDeadline(LocalDateTime.now().plusDays(2).plusHours(14));
            d1.setDisputeLifeCycleStage("CHARGEBACK");
            d1.setDisputeChannel("INTERNAL");
            d1.setLastSyncedTime(LocalDateTime.now());

            Dispute d2 = new Dispute();
            d2.setMerchantId("merchant_resolvepay_01");
            d2.setPaypalDisputeId("PP-D-373981");
            d2.setStatus("REQUIRED_ACTION");
            d2.setAmount(new BigDecimal("185.00"));
            d2.setCurrency("USD");
            d2.setReason("MERCHANDISE_OR_SERVICE_NOT_RECEIVED");
            d2.setDeadline(LocalDateTime.now().plusDays(4).plusHours(6));
            d2.setDisputeLifeCycleStage("CHARGEBACK");
            d2.setDisputeChannel("INTERNAL");
            d2.setLastSyncedTime(LocalDateTime.now());

            Dispute d3 = new Dispute();
            d3.setMerchantId("merchant_resolvepay_01");
            d3.setPaypalDisputeId("PP-D-599026");
            d3.setStatus("REQUIRED_ACTION");
            d3.setAmount(new BigDecimal("350.00"));
            d3.setCurrency("USD");
            d3.setReason("MERCHANDISE_OR_SERVICE_NOT_RECEIVED");
            d3.setDeadline(LocalDateTime.now().plusHours(18));
            d3.setDisputeLifeCycleStage("CHARGEBACK");
            d3.setDisputeChannel("INTERNAL");
            d3.setLastSyncedTime(LocalDateTime.now());

            Dispute d4 = new Dispute();
            d4.setMerchantId("merchant_resolvepay_01");
            d4.setPaypalDisputeId("PP-D-884920");
            d4.setStatus("UNDER_REVIEW");
            d4.setAmount(new BigDecimal("420.50"));
            d4.setCurrency("USD");
            d4.setReason("UNAUTHORISED");
            d4.setDeadline(LocalDateTime.now().plusDays(5));
            d4.setDisputeLifeCycleStage("PRE_ARBITRATION");
            d4.setDisputeChannel("INTERNAL");
            d4.setLastSyncedTime(LocalDateTime.now());

            Dispute d5 = new Dispute();
            d5.setMerchantId("merchant_resolvepay_01");
            d5.setPaypalDisputeId("PP-D-102948");
            d5.setStatus("RESOLVED");
            d5.setAmount(new BigDecimal("99.00"));
            d5.setCurrency("USD");
            d5.setReason("MERCHANDISE_OR_SERVICE_NOT_RECEIVED");
            d5.setDeadline(LocalDateTime.now().minusDays(1));
            d5.setDisputeLifeCycleStage("RESOLVED");
            d5.setDisputeChannel("INTERNAL");
            d5.setLastSyncedTime(LocalDateTime.now());

            disputeRepository.saveAll(List.of(d1, d2, d3, d4, d5));
            log.info("Successfully seeded 5 initial dispute records into database.");
        } else {
            log.info("Database already contains {} dispute record(s). Skipping seed.", count);
        }
    }
}
