package com.backend.dto;

import com.backend.cross.ModerationAction;
import com.backend.cross.ReportReason;
import com.backend.cross.ReportStatus;
import com.backend.cross.ReportTargetType;
import com.backend.domain.governance.Decision;
import com.backend.domain.governance.Report;
import com.backend.domain.identity.User;

import java.time.LocalDateTime;

/**
 * DTO de reporte para la bandeja y el detalle administrativo de moderación.
 */
public class ReportResponseDto {

    private String id;
    private String targetType;
    private String targetId;
    private String targetLabel;
    private String reason;
    private String comment;
    private String reporterUsername;
    private String status;
    private String resolution;
    private String note;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private Object targetData;
    private AuthorSummary author;

    public static ReportResponseDto fromEntity(
            Report report,
            Decision decision,
            Object targetData,
            User authorUser
    ) {
        ReportResponseDto dto = new ReportResponseDto();
        dto.setId(String.valueOf(report.getId()));
        dto.setTargetType(toFrontendTargetType(report.getTargetType()));
        dto.setTargetId(resolveTargetId(report));
        dto.setTargetLabel(report.getTargetLabel() != null ? report.getTargetLabel() : dto.getTargetId());
        dto.setReason(toFrontendReason(report.getReason()));
        dto.setComment(report.getDescription());
        dto.setReporterUsername(report.getReporter() != null ? report.getReporter().getUsername() : null);
        dto.setStatus(toFrontendStatus(report.getStatus()));
        dto.setCreatedAt(report.getDate());
        dto.setTargetData(targetData);

        if (decision != null) {
            dto.setResolution(toFrontendAction(decision.getAction()));
            dto.setNote(decision.getJustification());
            dto.setResolvedAt(decision.getDate());
        }

        if (authorUser != null) {
            dto.setAuthor(new AuthorSummary(
                    authorUser.getId(),
                    authorUser.getUsername(),
                    authorUser.getName(),
                    authorUser.getInstitutionalEmail(),
                    authorUser.isSuspended()
            ));
        }

        return dto;
    }

    private static String resolveTargetId(Report report) {
        if (report.getTargetType() == ReportTargetType.REPOSITORY && report.getStudyRepository() != null) {
            return String.valueOf(report.getStudyRepository().getId());
        }
        if (report.getTargetType() == ReportTargetType.PROFILE && report.getTargetUser() != null) {
            return report.getTargetUser().getUsername();
        }
        if (report.getResource() != null) {
            return String.valueOf(report.getResource().getId());
        }
        return report.getTargetLabel();
    }

    public static String toFrontendTargetType(ReportTargetType targetType) {
        if (targetType == null) return "document";
        return switch (targetType) {
            case DOCUMENT -> "document";
            case REPOSITORY -> "repository";
            case PROFILE -> "profile";
        };
    }

    public static String toFrontendReason(ReportReason reason) {
        if (reason == null) return "mal-etiquetado";
        return switch (reason) {
            case MISLABELED -> "mal-etiquetado";
            case DUPLICATE -> "duplicado";
            case INAPPROPRIATE_CONTENT -> "inapropiado";
            case ACTIVE_EXAM -> "examen-vigente";
            case PLAGIARISM -> "plagio";
            case CORRUPTED_FILE -> "archivo-corrupto";
            case OTHER -> "otro";
        };
    }

    public static String toFrontendStatus(ReportStatus status) {
        if (status == ReportStatus.RESOLVED || status == ReportStatus.DISMISSED) {
            return "resuelto";
        }
        return "pendiente";
    }

    public static String toFrontendAction(ModerationAction action) {
        if (action == null) return null;
        return switch (action) {
            case KEEP -> "descartado";
            case HIDE -> "ocultado";
            case REMOVE -> "eliminado";
            case WARN_USER -> "advertencia";
            case SUSPEND_USER -> "suspension";
        };
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public String getTargetLabel() { return targetLabel; }
    public void setTargetLabel(String targetLabel) { this.targetLabel = targetLabel; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getReporterUsername() { return reporterUsername; }
    public void setReporterUsername(String reporterUsername) { this.reporterUsername = reporterUsername; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Object getTargetData() { return targetData; }
    public void setTargetData(Object targetData) { this.targetData = targetData; }

    public AuthorSummary getAuthor() { return author; }
    public void setAuthor(AuthorSummary author) { this.author = author; }

    public record AuthorSummary(Long id, String username, String name, String email, boolean suspended) {}
}
