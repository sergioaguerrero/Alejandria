package com.backend.controller;

import com.backend.cross.InteractionType;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.dto.DocumentDto;
import com.backend.dto.DocumentPageResponse;
import com.backend.service.AnalyticsService;
import com.backend.service.DocumentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
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

    @RequestMapping(value = "/documents/{id}/download", method = {RequestMethod.GET, RequestMethod.HEAD})
    public void downloadDocument(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
            @AuthenticationPrincipal User viewer,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        boolean isHead = "HEAD".equalsIgnoreCase(request.getMethod());
        Resource resource = documentService.getFileMetadata(id, !isHead);
        if (!isHead) {
            analyticsService.recordInteraction(
                    InteractionType.DOWNLOAD,
                    viewer != null ? viewer.getId() : null,
                    id,
                    resource.getSubject() != null ? resource.getSubject().getId() : null,
                    null
            );
        }
        streamFileResponse(resource, false, isHead, rangeHeader, response);
    }

    @RequestMapping(value = "/documents/{id}/preview", method = {RequestMethod.GET, RequestMethod.HEAD})
    public void previewDocument(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        boolean isHead = "HEAD".equalsIgnoreCase(request.getMethod());
        Resource resource = documentService.getFileMetadata(id, false);
        streamFileResponse(resource, true, isHead, rangeHeader, response);
    }

    private void streamFileResponse(
            Resource resource,
            boolean inline,
            boolean isHead,
            String rangeHeader,
            HttpServletResponse response
    ) throws IOException {
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

        long totalBytes = Math.max(0L, resource.getFileSizeBytes());
        long start = 0L;
        long end = totalBytes > 0 ? totalBytes - 1L : 0L;
        boolean isPartial = false;

        if (rangeHeader != null && rangeHeader.startsWith("bytes=") && totalBytes > 0) {
            String rangeSpec = rangeHeader.substring("bytes=".length()).trim();
            int commaIdx = rangeSpec.indexOf(',');
            if (commaIdx > 0) {
                rangeSpec = rangeSpec.substring(0, commaIdx).trim();
            }
            int dashIdx = rangeSpec.indexOf('-');
            if (dashIdx >= 0) {
                try {
                    String startPart = rangeSpec.substring(0, dashIdx).trim();
                    String endPart = rangeSpec.substring(dashIdx + 1).trim();
                    if (startPart.isEmpty()) {
                        long suffixLen = Long.parseLong(endPart);
                        start = Math.max(0L, totalBytes - suffixLen);
                        end = totalBytes - 1L;
                    } else {
                        start = Long.parseLong(startPart);
                        end = endPart.isEmpty() ? totalBytes - 1L : Math.min(Long.parseLong(endPart), totalBytes - 1L);
                    }
                    if (start >= 0 && start <= end && start < totalBytes) {
                        isPartial = true;
                    } else {
                        response.setStatus(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE.value());
                        response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes */" + totalBytes);
                        return;
                    }
                } catch (NumberFormatException ignored) {
                    start = 0L;
                    end = totalBytes - 1L;
                }
            }
        }

        long contentLength = totalBytes > 0 ? (end - start + 1L) : 0L;

        response.setStatus(isPartial ? HttpServletResponse.SC_PARTIAL_CONTENT : HttpServletResponse.SC_OK);
        response.setContentType(mediaType.toString());
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, disposition.toString());
        response.setHeader(HttpHeaders.ACCEPT_RANGES, "bytes");
        response.setHeader(
                HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS,
                String.join(", ", HttpHeaders.CONTENT_DISPOSITION, HttpHeaders.ACCEPT_RANGES, HttpHeaders.CONTENT_RANGE, HttpHeaders.CONTENT_LENGTH)
        );
        response.setHeader("X-Content-Type-Options", "nosniff");
        if (inline) {
            response.setHeader(HttpHeaders.CACHE_CONTROL, "private, max-age=3600");
        }
        if (isPartial) {
            response.setHeader(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + totalBytes);
        }
        if (contentLength > 0) {
            response.setContentLengthLong(contentLength);
        }

        if (!isHead && totalBytes > 0) {
            documentService.streamFileBytes(resource.getId(), start, end, response.getOutputStream());
        }
    }

    private String currentBaseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }
}
