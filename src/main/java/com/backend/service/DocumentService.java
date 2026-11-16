package com.backend.service;

import com.backend.cross.CollaboratorStatus;
import com.backend.cross.ResourceStatus;
import com.backend.cross.ResourceType;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.domain.repos.Tag;
import com.backend.dto.DocumentDto;
import com.backend.dto.DocumentPageResponse;
import com.backend.exception.AuthException;
import com.backend.repository.InteractionRepository;
import com.backend.repository.RepositoryCollaboratorRepository;
import com.backend.repository.ResourceRepository;
import com.backend.repository.StudyRepositoryRepository;
import com.backend.repository.TagRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Gestiona la subida, consulta, edición, eliminación y descarga de documentos académicos.
 */
@Service
public class DocumentService {

    private static final long MAX_FILE_SIZE_BYTES = 25L * 1024L * 1024L;
    private static final int MIN_TOPIC_LENGTH = 3;
    private static final int MAX_TOPIC_LENGTH = 60;
    private static final Pattern TOPIC_ALLOWED_CHARS = Pattern.compile("^[\\p{L}\\p{N}\\s\\-/+*#.:()]+$");
    private static final Pattern TOPIC_HAS_LETTER = Pattern.compile(".*\\p{L}.*");
    private static final Pattern TOPIC_REPEATED_LETTER = Pattern.compile(".*(\\p{L})\\1{2,}.*", Pattern.CASE_INSENSITIVE);

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "jpg", "jpeg", "png"
    );

    private static final Map<String, String> EXTENSION_TO_MIME = Map.of(
            "pdf", "application/pdf",
            "doc", "application/msword",
            "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "ppt", "application/vnd.ms-powerpoint",
            "pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "xls", "application/vnd.ms-excel",
            "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = new LinkedHashSet<>(EXTENSION_TO_MIME.values());

    private final ResourceRepository resourceRepository;
    private final StudyRepositoryRepository studyRepositoryRepository;
    private final TagRepository tagRepository;
    private final RepositoryCollaboratorRepository repositoryCollaboratorRepository;
    private final InteractionRepository interactionRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public DocumentService(
            ResourceRepository resourceRepository,
            StudyRepositoryRepository studyRepositoryRepository,
            TagRepository tagRepository,
            RepositoryCollaboratorRepository repositoryCollaboratorRepository,
            InteractionRepository interactionRepository,
            NotificationService notificationService,
            ObjectMapper objectMapper
    ) {
        this.resourceRepository = resourceRepository;
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.tagRepository = tagRepository;
        this.repositoryCollaboratorRepository = repositoryCollaboratorRepository;
        this.interactionRepository = interactionRepository;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public DocumentDto upload(
            Long repositoryId,
            String title,
            String description,
            String type,
            Integer term,
            String topic,
            String tagsJson,
            MultipartFile file,
            User currentUser,
            String baseUrl
    ) throws IOException {
        User author = requireAuthenticated(currentUser, "Debes iniciar sesión para subir documentos.");
        StudyRepository repo = studyRepositoryRepository.findByIdWithDetails(repositoryId)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "REPOSITORY_NOT_FOUND",
                        "El repositorio no existe o fue eliminado."
                ));

        boolean isOwner = repo.getAuthor() != null && repo.getAuthor().getId().equals(author.getId());
        boolean isCollaborator = !isOwner && repositoryCollaboratorRepository
                .existsByStudyRepositoryIdAndUserIdAndStatus(repo.getId(), author.getId(), CollaboratorStatus.ACEPTADO);
        if (!isOwner && !isCollaborator) {
            throw new AuthException(
                    HttpStatus.FORBIDDEN,
                    "FORBIDDEN",
                    "Solo el dueño o un colaborador aceptado puede subir documentos."
            );
        }

        Map<String, String> fields = validateFields(title, description, type, term, topic, file, true);
        if (!fields.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Revisa los datos del documento.",
                    fields
            );
        }

        ResourceType resourceType = parseResourceType(type);
        ValidatedFile validatedFile = validateAndReadFile(file);

        Resource resource = new Resource(
                title.trim(),
                description.trim(),
                resourceType,
                validatedFile.bytes(),
                validatedFile.mimeType(),
                validatedFile.sizeBytes(),
                author,
                repo.getSubject()
        );
        resource.setStudyRepository(repo);
        resource.setTerm(term);
        resource.setTopic(normalizeTopic(topic));
        resource.setFileName(validatedFile.originalName());
        resource.setStatus(ResourceStatus.PUBLISHED);
        resource.setTags(resolveTags(tagsJson));

        Resource saved = resourceRepository.save(resource);
        notificationService.notifyFollowersOfNewContent(author, repo, saved);
        return toDto(saved, baseUrl);
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> listByRepository(Long repositoryId, Integer term, String baseUrl) {
        if (!studyRepositoryRepository.existsById(repositoryId)) {
            throw new AuthException(
                    HttpStatus.NOT_FOUND,
                    "REPOSITORY_NOT_FOUND",
                    "El repositorio no existe o fue eliminado."
            );
        }

        List<Resource> resources = (term != null && term >= 1 && term <= 3)
                ? resourceRepository.findByStudyRepositoryIdAndTermWithDetails(repositoryId, term)
                : resourceRepository.findByStudyRepositoryIdWithDetails(repositoryId);

        return resources.stream()
                .map(r -> toDto(r, baseUrl))
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentPageResponse search(
            String query,
            Long subjectId,
            Integer semester,
            Integer term,
            String type,
            String topic,
            String order,
            int page,
            int size,
            String baseUrl
    ) {
        int safePage = Math.max(1, page);
        int safeSize = Math.min(Math.max(1, size), 50);
        Sort sort = resolveSort(order);
        PageRequest pageRequest = PageRequest.of(safePage - 1, safeSize, sort);

        Specification<Resource> spec = buildSearchSpec(query, subjectId, semester, term, type, topic);
        Page<Resource> result = resourceRepository.findAll(spec, pageRequest);

        List<DocumentDto> items = result.getContent().stream()
                .map(r -> toDto(r, baseUrl))
                .toList();

        return new DocumentPageResponse(
                items,
                result.getTotalElements(),
                safePage,
                safeSize,
                Math.max(1, result.getTotalPages())
        );
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> listByUser(String username, String baseUrl) {
        return resourceRepository.findByAuthorUsernameWithDetails(username).stream()
                .map(r -> toDto(r, baseUrl))
                .toList();
    }

    @Transactional
    public DocumentDto getDetailAndIncrementView(Long id, String baseUrl) {
        Resource resource = findResourceOrThrow(id);
        resource.setTotalViews(resource.getTotalViews() + 1);
        Resource saved = resourceRepository.save(resource);
        return toDto(saved, baseUrl);
    }

    @Transactional
    public DocumentDto update(
            Long id,
            String title,
            String description,
            String type,
            Integer term,
            String topic,
            String tagsJson,
            MultipartFile file,
            User currentUser,
            String baseUrl
    ) throws IOException {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para editar este documento.");
        Resource resource = findResourceOrThrow(id);
        requireAuthor(resource, user, "Solo el autor puede editar este documento.");

        Map<String, String> fields = validateFields(title, description, type, term, topic, file, false);
        if (!fields.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Revisa los datos del documento.",
                    fields
            );
        }

        resource.setTitle(title.trim());
        resource.setDescription(description.trim());
        resource.setType(parseResourceType(type));
        resource.setTerm(term);
        resource.setTopic(normalizeTopic(topic));
        resource.setTags(resolveTags(tagsJson));

        if (file != null && !file.isEmpty()) {
            ValidatedFile validatedFile = validateAndReadFile(file);
            resource.setFileName(validatedFile.originalName());
            resource.setFileBytes(validatedFile.bytes());
            resource.setMimeType(validatedFile.mimeType());
            resource.setFileSizeBytes(validatedFile.sizeBytes());
        }

        Resource saved = resourceRepository.save(resource);
        return toDto(saved, baseUrl);
    }

    @Transactional
    public void delete(Long id, User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para eliminar este documento.");
        Resource resource = findResourceOrThrow(id);
        requireAuthor(resource, user, "Solo el autor puede eliminar este documento.");

        interactionRepository.clearResourceReference(id);
        resource.getTags().clear();
        resourceRepository.saveAndFlush(resource);
        resourceRepository.delete(resource);
    }

    @Transactional
    public Resource getFileResource(Long id, boolean incrementDownloads) {
        Resource resource = findResourceOrThrow(id);
        if (incrementDownloads) {
            resource.setTotalDownloads(resource.getTotalDownloads() + 1);
            return resourceRepository.save(resource);
        }
        return resource;
    }

    private Resource findResourceOrThrow(Long id) {
        return resourceRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "DOCUMENT_NOT_FOUND",
                        "El documento no existe o fue eliminado."
                ));
    }

    private User requireAuthenticated(User user, String message) {
        if (user == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
        }
        return user;
    }

    private void requireAuthor(Resource resource, User user, String message) {
        if (resource.getUploadedBy() == null || !resource.getUploadedBy().getId().equals(user.getId())) {
            throw new AuthException(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
        }
    }

    private Map<String, String> validateFields(
            String title,
            String description,
            String type,
            Integer term,
            String topic,
            MultipartFile file,
            boolean requireFile
    ) {
        Map<String, String> fields = new LinkedHashMap<>();

        String cleanTitle = title == null ? "" : title.trim();
        if (cleanTitle.length() < 3 || cleanTitle.length() > 200) {
            fields.put("title", "El título debe tener entre 3 y 200 caracteres.");
        }

        String cleanDesc = description == null ? "" : description.trim();
        if (cleanDesc.length() < 10 || cleanDesc.length() > 2000) {
            fields.put("description", "Describe el documento en al menos 10 caracteres.");
        }

        if (parseResourceTypeOrNull(type) == null) {
            fields.put("type", "Selecciona un tipo de material válido.");
        }

        if (term == null || term < 1 || term > 3) {
            fields.put("term", "Selecciona un corte válido (1, 2 o 3).");
        }

        String topicError = validateTopic(topic);
        if (topicError != null) {
            fields.put("topic", topicError);
        }

        if (requireFile && (file == null || file.isEmpty())) {
            fields.put("file", "Selecciona el archivo que quieres subir.");
        } else if (file != null && !file.isEmpty()) {
            if (file.getSize() > MAX_FILE_SIZE_BYTES) {
                fields.put("file", "El archivo no puede superar 25 MB.");
            } else if (!isAllowedFile(file)) {
                fields.put("file", "Formato no permitido. Usa PDF, Word, PowerPoint, Excel, JPG o PNG.");
            }
        }

        return fields;
    }

    private String validateTopic(String rawTopic) {
        String clean = cleanTopicSpacing(rawTopic);
        if (clean.length() < MIN_TOPIC_LENGTH) {
            return "Escribe o selecciona el tema del documento (mínimo 3 caracteres).";
        }
        if ("otro".equalsIgnoreCase(clean)) {
            return "Especifica el tema del documento en lugar de \"Otro\".";
        }
        if (clean.length() > MAX_TOPIC_LENGTH) {
            return "El tema no puede superar los " + MAX_TOPIC_LENGTH + " caracteres.";
        }
        if (!TOPIC_ALLOWED_CHARS.matcher(clean).matches() || !TOPIC_HAS_LETTER.matcher(clean).matches()) {
            return "Usa un nombre de tema académico válido (letras, números y signos básicos).";
        }
        if (TOPIC_REPEATED_LETTER.matcher(clean).matches()) {
            return "Escribe un tema académico válido (evita caracteres repetidos sin sentido).";
        }
        return null;
    }

    private String normalizeTopic(String rawTopic) {
        String clean = cleanTopicSpacing(rawTopic);
        if (clean.isEmpty()) return "";
        if (clean.equals(clean.toLowerCase(Locale.ROOT))) {
            return Character.toUpperCase(clean.charAt(0)) + clean.substring(1);
        }
        return clean;
    }

    private String cleanTopicSpacing(String rawTopic) {
        return rawTopic == null ? "" : rawTopic.trim().replaceAll("\\s+", " ");
    }

    private boolean isAllowedFile(MultipartFile file) {
        String ext = extractExtension(file.getOriginalFilename());
        String mime = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            return false;
        }
        return ALLOWED_MIME_TYPES.contains(mime) || mime.isBlank() || mime.equals("application/octet-stream");
    }

    private ValidatedFile validateAndReadFile(MultipartFile file) throws IOException {
        String originalName = sanitizeFilename(file.getOriginalFilename());
        String ext = extractExtension(originalName);
        String contentType = file.getContentType();
        String mime = (contentType != null && ALLOWED_MIME_TYPES.contains(contentType.toLowerCase(Locale.ROOT)))
                ? contentType.toLowerCase(Locale.ROOT)
                : EXTENSION_TO_MIME.getOrDefault(ext, "application/octet-stream");

        return new ValidatedFile(originalName, mime, file.getSize(), file.getBytes());
    }

    private String sanitizeFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "documento.pdf";
        }
        String base = originalFilename.replace("\\", "/");
        int slash = base.lastIndexOf('/');
        String nameOnly = slash >= 0 ? base.substring(slash + 1) : base;
        nameOnly = nameOnly.trim();
        if (nameOnly.length() > 255) {
            nameOnly = nameOnly.substring(0, 255);
        }
        return nameOnly.isEmpty() ? "documento.pdf" : nameOnly;
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private ResourceType parseResourceType(String type) {
        ResourceType parsed = parseResourceTypeOrNull(type);
        if (parsed == null) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Tipo de material inválido.",
                    Map.of("type", "Selecciona un tipo de material válido.")
            );
        }
        return parsed;
    }

    private ResourceType parseResourceTypeOrNull(String rawType) {
        if (rawType == null || rawType.isBlank()) return null;
        return switch (rawType.trim().toLowerCase(Locale.ROOT)) {
            case "apunte", "note" -> ResourceType.NOTE;
            case "guia", "guía", "guide" -> ResourceType.GUIDE;
            case "resumen", "summary" -> ResourceType.SUMMARY;
            case "proyecto", "project" -> ResourceType.PROJECT;
            case "taller", "workshop" -> ResourceType.WORKSHOP;
            default -> null;
        };
    }

    private Set<Tag> resolveTags(String tagsJson) {
        Set<Tag> tags = new LinkedHashSet<>();
        if (tagsJson == null || tagsJson.isBlank()) {
            return tags;
        }
        try {
            List<String> rawTags = objectMapper.readValue(tagsJson, new TypeReference<>() {});
            for (String raw : rawTags) {
                if (raw == null) continue;
                String clean = raw.trim().toLowerCase(Locale.ROOT);
                if (clean.isEmpty()) continue;
                if (clean.length() > 60) {
                    clean = clean.substring(0, 60);
                }
                final String tagName = clean;
                Tag tag = tagRepository.findByNameIgnoreCase(tagName)
                        .orElseGet(() -> tagRepository.save(new Tag(tagName)));
                tags.add(tag);
            }
            return tags;
        } catch (Exception ex) {
            return tags;
        }
    }

    private Specification<Resource> buildSearchSpec(
            String query,
            Long subjectId,
            Integer semester,
            Integer term,
            String type,
            String topic
    ) {
        Specification<Resource> spec = Specification.where(null);

        if (subjectId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("subject").get("id"), subjectId));
        }
        if (semester != null && semester > 0) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("subject").get("semester").get("number"), semester));
        }
        if (term != null && term >= 1 && term <= 3) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("term"), term));
        }
        ResourceType parsedType = parseResourceTypeOrNull(type);
        if (parsedType != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("type"), parsedType));
        }
        if (topic != null && !topic.isBlank()) {
            String pattern = likePattern(topic);
            spec = spec.and((root, q, cb) -> cb.like(cb.lower(root.get("topic")), pattern, '\\'));
        }
        if (query != null && !query.isBlank()) {
            String pattern = likePattern(query);
            spec = spec.and((root, q, cb) -> {
                Join<Resource, StudyRepository> repoJoin = root.join("studyRepository", JoinType.LEFT);
                // Usamos EXISTS en lugar de q.distinct(true) + join sobre tags porque Oracle
                // rechaza SELECT DISTINCT cuando la tabla incluye columnas BLOB (archivo_bytes).
                Subquery<Long> tagSubquery = q.subquery(Long.class);
                Root<Resource> subRoot = tagSubquery.correlate(root);
                Join<Resource, Tag> tagJoin = subRoot.join("tags");
                tagSubquery.select(cb.literal(1L))
                        .where(cb.like(cb.lower(tagJoin.get("name")), pattern, '\\'));
                return cb.or(
                        cb.like(cb.lower(root.get("title")), pattern, '\\'),
                        cb.like(cb.lower(root.get("description")), pattern, '\\'),
                        cb.like(cb.lower(root.get("topic")), pattern, '\\'),
                        cb.like(cb.lower(repoJoin.get("name")), pattern, '\\'),
                        cb.exists(tagSubquery)
                );
            });
        }

        return spec;
    }

    private String likePattern(String raw) {
        String escaped = raw.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    private Sort resolveSort(String order) {
        if ("popular".equalsIgnoreCase(order) || "liked".equalsIgnoreCase(order)) {
            return Sort.by(Sort.Direction.DESC, "totalDownloads")
                    .and(Sort.by(Sort.Direction.DESC, "totalViews"))
                    .and(Sort.by(Sort.Direction.DESC, "uploadDate"));
        }
        return Sort.by(Sort.Direction.DESC, "uploadDate");
    }

    private DocumentDto toDto(Resource resource, String baseUrl) {
        String previewUrl = baseUrl + "/api/documents/" + resource.getId() + "/preview";
        return DocumentDto.fromEntity(resource, previewUrl);
    }

    private record ValidatedFile(String originalName, String mimeType, long sizeBytes, byte[] bytes) {}
}
