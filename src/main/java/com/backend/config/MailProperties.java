package com.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de envío de correo transaccional para códigos de verificación.
 * Soporta los proveedores: {@code console} (desarrollo), {@code smtp}, {@code resend} y {@code brevo}.
 */
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

    private String provider = "console";
    private String from = "Alejandria UPC <noreply@alejandria.local>";
    private String resendApiKey = "";
    private String resendUrl = "https://api.resend.com/emails";
    private String brevoApiKey = "";
    private String brevoUrl = "https://api.brevo.com/v3/smtp/email";
    private String gasUrl = "";

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getResendApiKey() {
        return resendApiKey;
    }

    public void setResendApiKey(String resendApiKey) {
        this.resendApiKey = resendApiKey;
    }

    public String getResendUrl() {
        return resendUrl;
    }

    public void setResendUrl(String resendUrl) {
        this.resendUrl = resendUrl;
    }

    public String getBrevoApiKey() {
        return brevoApiKey;
    }

    public void setBrevoApiKey(String brevoApiKey) {
        this.brevoApiKey = brevoApiKey;
    }

    public String getBrevoUrl() {
        return brevoUrl;
    }

    public void setBrevoUrl(String brevoUrl) {
        this.brevoUrl = brevoUrl;
    }

    public String getGasUrl() {
        return gasUrl;
    }

    public void setGasUrl(String gasUrl) {
        this.gasUrl = gasUrl;
    }
}
