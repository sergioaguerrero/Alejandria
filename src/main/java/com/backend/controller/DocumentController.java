package com.backend.controller;

import com.backend.cross.InteractionType;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.dto.DocumentDto;
import com.backend.dto.DocumentPageResponse;
import com.backend.service.AnalyticsService;
import com.backend.service.DocumentService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Expone los endpoints REST para subir, consultar, editar, descargar y eliminar documentos.
 */
@RestController
@RequestMapping("/api")
public class DocumentController {

    private final DocumentService documentService;
    private final AnalyticsService analyticsService;

    public DocumentController(
            DocumentService documentService,
            AnalyticsService analyticsService
    ) {
        this.documentService = documentService;
        this.analyticsService = analyticsService;
    }

    @PostMapping(value = "/repositories/{repositoryId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDto> uploadDocument(
            @PathVariable Long repositoryId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "term", required = false) Integer term,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "tags", required = false) String tagsJson,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        DocumentDto created = documentService.upload(
                repositoryId,
                title,
                description,
                type,
                term,
                topic,
                tagsJson,
                file,
                currentUser,
                currentBaseUrl()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/repositories/{repositoryId}/documents")
    public ResponseEntity<List<DocumentDto>> listByRepository(
            @PathVariable Long repositoryId,
            @RequestParam(required = false) Integer term
    ) {
        return ResponseEntity.ok(documentService.listByRepository(repositoryId, term, currentBaseUrl()));
    }

    @GetMapping("/documents")
    public ResponseEntity<DocumentPageResponse> searchDocuments(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) Integer term,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String topic,
            @RequestParam(defaultValue = "recent") String order,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int size,
            @AuthenticationPrincipal User viewer
    ) {
        String effectiveQuery = (q != null && !q.isBlank()) ? q : search;
        if (effectiveQuery != null && !effectiveQuery.isBlank()) {
            analyticsService.recordInteraction(
                    InteractionType.SEARCH,
                    viewer != null ? viewer.getId() : null,
                    null,
                    subjectId,
                    effectiveQuery
            );
        }
        return ResponseEntity.ok(documentService.search(
                effectiveQuery,
                subjectId,
                semester,
                term,
                type,
                topic,
                order,
                page,
                size,
                currentBaseUrl()
        ));
    }

    @GetMapping("/users/{username}/documents")
    public ResponseEntity<List<DocumentDto>> listByUser(@PathVariable String username) {
        return ResponseEntity.ok(documentService.listByUser(username, currentBaseUrl()));
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<DocumentDto> getDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User viewer
    ) {
        DocumentDto dto = documentService.getDetailAndIncrementView(id, currentBaseUrl());
        Long subjectId = dto.getSubject() != null ? dto.getSubject().getId() : null;
        analyticsService.recordInteraction(
                InteractionType.VIEW,
                viewer != null ? viewer.getId() : null,
                id,
                subjectId,
                null
        );
        return ResponseEntity.ok(dto);
    }

    @PutMapping(value = "/documents/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDto> updateDocument(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "term", required = false) Integer term,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "tags", required = false) String tagsJson,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        return ResponseEntity.ok(documentService.update(
                id,
                title,
                description,
                type,
                term,
                topic,
                tagsJson,
                file,
                currentUser,
                currentBaseUrl()
        ));
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        documentService.delete(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal User viewer
    ) {
        Resource resource = documentService.getFileResource(id, true);
        analyticsService.recordInteraction(
                InteractionType.DOWNLOAD,
                viewer != null ? viewer.getId() : null,
                id,
                resource.getSubject() != null ? resource.getSubject().getId() : null,
                null
        );
        return buildFileResponse(resource, false);
    }

    @GetMapping("/documents/{id}/preview")
    public ResponseEntity<byte[]> previewDocument(@PathVariable Long id) {
        Resource resource = documentService.getFileResource(id, false);
        return buildFileResponse(resource, true);
    }

    private ResponseEntity<byte[]> buildFileResponse(Resource resource, boolean inline) {
        String filename = (resource.getFileName() != null && !resource.getFileName().isBlank())
                ? resource.getFileName()
                : "documento-" + resource.getId();

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(resource.getMimeType());
        } catch (Exception ex) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        ContentDisposition disposition = (inline ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(filename, StandardCharsets.UTF_8)
                .build();

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .header("X-Content-Type-Options", "nosniff");
        if (inline) {
            builder.header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600");
        }
        return builder.body(resource.getFileBytes());
    }

    private String currentBaseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }
}
