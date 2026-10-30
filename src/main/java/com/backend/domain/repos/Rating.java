package com.backend.domain.repos;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import com.backend.domain.identity.User;


@Entity
@Table(name = "RATING", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "resource_id"}))
public class Rating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private int score;

    @Column(name = "comment_text", length = 1000)
    private String comment;

    @Column(name = "rating_date", nullable = false)
    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resource_id")
    private Resource resource;

    protected Rating () {}

    public Long getId() { return id; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getDate() { return date; }

    public User getUser() { return user; }
    public Resource getResource() { return resource; }
}
