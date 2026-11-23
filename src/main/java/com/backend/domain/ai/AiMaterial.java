package com.backend.domain.ai;

import com.backend.cross.AiContentType;
import com.backend.domain.identity.User;
import com.backend.domain.repos.StudyRepository;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.type.NumericBooleanConverter;

import java.time.LocalDateTime;

@Entity
@Table(name = "MATERIAL_IA")
public class AiMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repositorio_id")
    private StudyRepository studyRepository;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_contenido", nullable = false, length = 15)
    private AiContentType contentType;

    @Column(name = "titulo", nullable = false, length = 150)
    private String title;

    @Column(name = "nombre_repositorio", nullable = false, length = 100)
    private String repositoryName;

    @Column(name = "nombre_materia", nullable = false, length = 80)
    private String subjectName;

    @Column(name = "alcance", nullable = false, length = 10)
    private String scope;

    @Column(name = "valor_alcance", length = 80)
    private String scopeValue;

    @Column(name = "etiqueta_alcance", nullable = false, length = 100)
    private String scopeLabel;

    @Lob
    @Column(name = "contenido_json", nullable = false)
    private String contentJson;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "guardado_estudio", nullable = false)
    private boolean savedInMyStudy = false;

    @Column(name = "ultima_puntuacion")
    private Integer lastScore;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime createdAt;

    protected AiMaterial() {
    }

    public AiMaterial(
            User owner,
            StudyRepository studyRepository,
            AiContentType contentType,
            String title,
            String repositoryName,
            String subjectName,
            String scope,
            String scopeValue,
            String scopeLabel,
            String contentJson
    ) {
        this.owner = owner;
        this.studyRepository = studyRepository;
        this.contentType = contentType;
        this.title = title;
        this.repositoryName = repositoryName;
        this.subjectName = subjectName;
        this.scope = scope;
        this.scopeValue = scopeValue;
        this.scopeLabel = scopeLabel;
        this.contentJson = contentJson;
        this.savedInMyStudy = false;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }

    public User getOwner() { return owner; }

    public StudyRepository getStudyRepository() { return studyRepository; }
    public void setStudyRepository(StudyRepository studyRepository) { this.studyRepository = studyRepository; }

    public AiContentType getContentType() { return contentType; }

    public String getTitle() { return title; }

    public String getRepositoryName() { return repositoryName; }

    public String getSubjectName() { return subjectName; }

    public String getScope() { return scope; }

    public String getScopeValue() { return scopeValue; }

    public String getScopeLabel() { return scopeLabel; }

    public String getContentJson() { return contentJson; }

    public boolean isSavedInMyStudy() { return savedInMyStudy; }
    public void setSavedInMyStudy(boolean savedInMyStudy) { this.savedInMyStudy = savedInMyStudy; }

    public Integer getLastScore() { return lastScore; }
    public void setLastScore(Integer lastScore) { this.lastScore = lastScore; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
