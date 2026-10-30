package com.backend.domain.governance;

import com.backend.cross.ReportReason;
import com.backend.cross.ReportStatus;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;   // ajusta si renombraste el paquete
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "REPORT")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportReason reason;

    @Column(length = 1000)
    private String description;

    @Column(name = "report_date", nullable = false)
    private LocalDateTime date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id")
    private Resource resource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderator_id")
    private User moderator;

    protected Report() {}

    public Report(ReportReason reason, String description, User reporter, Resource resource) {
        this.reason = reason;
        this.description = description;
        this.reporter = reporter;
        this.resource = resource;
        this.date = LocalDateTime.now();
        this.status = ReportStatus.OPEN;
    }

    public void assignModerator(User moderator) {
        this.moderator = moderator;
        this.status = ReportStatus.UNDER_REVIEW;
    }

    public void close() {
        this.status = ReportStatus.RESOLVED;
    }

    public Long getId() { return id; }
    public ReportReason getReason() { return reason; }
    public String getDescription() { return description; }
    public LocalDateTime getDate() { return date; }
    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }
    public User getReporter() { return reporter; }
    public Resource getResource() { return resource; }
    public User getModerator() { return moderator; }
    public void setDate(LocalDateTime date) {
        this.date = date;
    }
}