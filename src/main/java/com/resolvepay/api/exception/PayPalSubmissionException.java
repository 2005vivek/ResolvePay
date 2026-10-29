package com.resolvepay.api.exception;

import org.springframework.http.HttpStatus;

public class PayPalSubmissionException extends RuntimeException {

    private final HttpStatus status;

    public PayPalSubmissionException(String message) {
        super(message);
        this.status = HttpStatus.BAD_GATEWAY;
    }

    public PayPalSubmissionException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
