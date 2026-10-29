package com.resolvepay.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiApplication {

	public static void main(String[] args) {
		// Prefer IPv4 stack and addresses to eliminate unreachable IPv6 delays on Windows
		System.setProperty("java.net.preferIPv4Stack", "true");
		System.setProperty("java.net.preferIPv4Addresses", "true");
		SpringApplication.run(ApiApplication.class, args);
	}

}
