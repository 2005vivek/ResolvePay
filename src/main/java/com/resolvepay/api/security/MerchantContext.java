package com.resolvepay.api.security;

/**
 * Thread-local security context holding the authenticated merchant identity
 * for the current HTTP request thread.
 */
public final class MerchantContext {

    private static final ThreadLocal<String> CURRENT_MERCHANT = new ThreadLocal<>();

    private MerchantContext() {}

    public static void setCurrentMerchantId(String merchantId) {
        CURRENT_MERCHANT.set(merchantId);
    }

    public static String getCurrentMerchantId() {
        return CURRENT_MERCHANT.get();
    }

    public static void clear() {
        CURRENT_MERCHANT.remove();
    }
}
