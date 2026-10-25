package com.backend.domain.analytic;

import com.backend.domain.academy.Subject;
import jakarta.persistence.*;

@Entity
@Table(
        name = "DEMAND_METRIC",
        uniqueConstraints = @UniqueConstraint(columnNames = {"subject_id", "academic_period"})
)
public class DemandMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "academic_period", nullable = false, length = 10)
    private String academicPeriod;          // ejemplo: "2026-2"

    @Column(name = "total_queries", nullable = false)
    private int totalQueries;

    @Column(name = "total_downloads", nullable = false)
    private int totalDownloads;

    @Column(name = "total_searches", nullable = false)
    private int totalSearches;

    @Column(name = "demand_index", nullable = false)
    private double demandIndex;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    protected DemandMetric() {}

    public DemandMetric(Subject subject, String academicPeriod) {
        this.subject = subject;
        this.academicPeriod = academicPeriod;
    }

    public void update(int totalQueries, int totalDownloads, int totalSearches, double demandIndex) {
        this.totalQueries = totalQueries;
        this.totalDownloads = totalDownloads;
        this.totalSearches = totalSearches;
        this.demandIndex = demandIndex;
    }

    public Long getId() { return id; }
    public String getAcademicPeriod() { return academicPeriod; }
    public int getTotalQueries() { return totalQueries; }
    public int getTotalDownloads() { return totalDownloads; }
    public int getTotalSearches() { return totalSearches; }
    public double getDemandIndex() { return demandIndex; }
    public Subject getSubject() { return subject; }
}