package com.backend.domain.governance;

import com.backend.cross.ModerationAction;
import com.backend.domain.identity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "DECISION")
public class Decision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_action", nullable = false, length = 30)
    private ModerationAction action;

    @Column(nullable = false, length = 1000)
    private String justification;

    @Column(name = "decision_date", nullable = false)
    private LocalDateTime date;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_id", unique = true)
    private Report report;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "moderator_id")
    private User moderator;

    protected Decision() {}

    public Decision(ModerationAction action, String justification, Report report, User moderator) {
        this.action = action;
        this.justification = justification;
        this.report = report;
        this.moderator = moderator;
        this.date = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public ModerationAction getAction() { return action; }
    public String getJustification() { return justification; }
    public LocalDateTime getDate() { return date; }
    public Report getReport() { return report; }
    public User getModerator() { return moderator; }
}