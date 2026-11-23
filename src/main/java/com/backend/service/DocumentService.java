package com.backend.service;

import com.backend.cross.ResourceStatus;
import com.backend.cross.ResourceType;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.domain.repos.Tag;
import com.backend.dto.DocumentDto;
import com.backend.dto.DocumentPageResponse;
import com.backend.exception.AuthException;
import com.backend.repository.RepositoryCollaboratorRepository;
import com.backend.repository.ResourceRepository;
import com.backend.repository.StudyRepositoryRepository;
import com.backend.repository.TagRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.OutputStream;
import java.sql.Blob;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Gestiona la subida, consulta, edición, eliminación y descarga de documentos académicos
 * delegando búsquedas, conteos, incrementos y eliminación en cascada a PKG_REPOSITORIOS.
 */
@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);
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
    private final NotificationService notificationService;
    private final OraclePackageService oraclePackageService;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final com.backend.repository.RepositoriosRepository repositoriosRepository;

    public DocumentService(
            ResourceRepository resourceRepository,
            StudyRepositoryRepository studyRepositoryRepository,
            TagRepository tagRepository,
            NotificationService notificationService,
            OraclePackageService oraclePackageService,
            ObjectMapper objectMapper,
            JdbcTemplate jdbcTemplate,
            com.backend.repository.RepositoriosRepository repositoriosRepository
    ) {
        this.resourceRepository = resourceRepository;
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.tagRepository = tagRepository;
        this.notificationService = notificationService;
        this.oraclePackageService = oraclePackageService;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.repositoriosRepository = repositoriosRepository;
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
        User author = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para subir documentos.");
        StudyRepository repo = studyRepositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "REPOSITORY_NOT_FOUND",
                        "El repositorio no existe o fue eliminado."
                ));

        boolean isOwner = repo.getAuthor() != null && repo.getAuthor().getId().equals(author.getId());
        boolean isCollaborator = !isOwner
                && repositoriosRepository.esColaboradorAceptado(repo.getId(), author.getId()) == 1;
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

        Integer filterTerm = (term != null && term >= 1 && term <= 3) ? term : null;
        List<Long> ids = oraclePackageService.fnRecursosPorRepositorioIds(repositoryId, filterTerm);
        List<Resource> resources = loadOrderedMetadataByIds(ids);

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

        ResourceType parsedType = parseResourceTypeOrNull(type);
        List<Long> allIds = oraclePackageService.fnBuscarRecursosIds(
                query,
                subjectId,
                semester,
                term,
                parsedType != null ? parsedType.name() : null,
                topic,
                order
        );

        long totalElements = allIds.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) totalElements / safeSize));
        int fromIndex = Math.min((safePage - 1) * safeSize, allIds.size());
        int toIndex = Math.min(fromIndex + safeSize, allIds.size());
        List<Long> pageIds = allIds.subList(fromIndex, toIndex);

        List<Resource> pageResources = loadOrderedMetadataByIds(pageIds);

        List<DocumentDto> items = pageResources.stream()
                .map(r -> toDto(r, baseUrl))
                .toList();

        return new DocumentPageResponse(
                items,
                totalElements,
                safePage,
                safeSize,
                totalPages
        );
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> listByUser(String username, String baseUrl) {
        List<Long> ids = oraclePackageService.fnRecursosPorAutorIds(username);
        List<Resource> resources = loadOrderedMetadataByIds(ids);
        return resources.stream()
                .map(r -> toDto(r, baseUrl))
                .toList();
    }

    @Transactional
    public DocumentDto getDetailAndIncrementView(Long id, String baseUrl) {
        Resource resource = findResourceMetadataOrThrow(id);
        oraclePackageService.prIncrementarVista(id);
        resource.setTotalViews(resource.getTotalViews() + 1);
        return toDto(resource, baseUrl);
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
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para editar este documento.");
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
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para eliminar este documento.");
        Resource resource = findResourceMetadataOrThrow(id);
        requireAuthor(resource, user, "Solo el autor puede eliminar este documento.");

        oraclePackageService.prEliminarRecursoCascada(id);
    }

    @Transactional
    public Resource getFileMetadata(Long id, boolean incrementDownloads) {
        Resource resource = findResourceMetadataOrThrow(id);
        if (incrementDownloads) {
            oraclePackageService.prIncrementarDescarga(id);
            resource.setTotalDownloads(resource.getTotalDownloads() + 1);
        }
        if (resource.getSubject() != null) {
            resource.getSubject().getId();
        }
        return resource;
    }

    /**
     * Transmite el BLOB directamente desde Oracle al OutputStream HTTP en bloques de 1 MB
     * sin cargar el archivo completo en el Heap de la JVM. Soporta rangos parciales (HTTP 206).
     */
    public void streamFileBytes(Long id, long startInclusive, long endInclusive, OutputStream out) {
        final int chunkSize = 1024 * 1024; // 1 MB por lectura RPC de LOB
        Boolean found = jdbcTemplate.query(
                "SELECT archivo_bytes FROM RECURSO_ACADEMICO WHERE id = ?",
                ps -> ps.setLong(1, id),
                rs -> {
                    if (!rs.next()) {
                        return false;
                    }
                    Blob blob = rs.getBlob(1);
                    if (blob == null) {
                        return true;
                    }
                    try {
                        long blobLen = blob.length();
                        if (blobLen <= 0 || startInclusive >= blobLen) {
                            return true;
                        }
                        long effectiveEnd = Math.min(endInclusive, blobLen - 1L);
                        long pos = startInclusive + 1L; // JDBC Blob.getBytes usa índice base 1
                        long limitPos = effectiveEnd + 1L;
                        while (pos <= limitPos) {
                            int bytesToRead = (int) Math.min(chunkSize, limitPos - pos + 1L);
                            byte[] chunk = blob.getBytes(pos, bytesToRead);
                            if (chunk == null || chunk.length == 0) {
                                break;
                            }
                            out.write(chunk);
                            pos += chunk.length;
                        }
                        out.flush();
                    } catch (IOException ex) {
                        log.debug("Stream cerrado por el cliente durante transferencia del documento {}: {}", id, ex.getMessage());
                    } finally {
                        try {
                            blob.free();
                        } catch (Exception ignored) {
                        }
                    }
                    return true;
                }
        );
        if (!Boolean.TRUE.equals(found)) {
            throw new AuthException(
                    HttpStatus.NOT_FOUND,
                    "DOCUMENT_NOT_FOUND",
                    "El documento no existe o fue eliminado."
            );
        }
    }

    @Transactional
    public Resource getFileResource(Long id, boolean incrementDownloads) {
        Resource resource = findResourceMetadataOrThrow(id);
        if (incrementDownloads) {
            oraclePackageService.prIncrementarDescarga(id);
            resource.setTotalDownloads(resource.getTotalDownloads() + 1);
        }
        if (resource.getSubject() != null) {
            resource.getSubject().getId();
        }
        byte[] bytes = resourceRepository.findFileBytesById(id)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "DOCUMENT_NOT_FOUND",
                        "El documento no existe o fue eliminado."
                ));
        resource.setFileBytes(bytes);
        return resource;
    }

    private List<Resource> loadOrderedMetadataByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Resource> fetched = resourceRepository.findAllMetadataByIdIn(ids);
        if (fetched.isEmpty()) {
            return List.of();
        }
        Map<Long, Set<Tag>> tagsByResourceId = new LinkedHashMap<>();
        for (Object[] row : resourceRepository.findTagPairsByResourceIdIn(ids)) {
            Long resourceId = (Long) row[0];
            Tag tag = (Tag) row[1];
            tagsByResourceId.computeIfAbsent(resourceId, k -> new LinkedHashSet<>()).add(tag);
        }
        for (Resource resource : fetched) {
            resource.setTags(tagsByResourceId.getOrDefault(resource.getId(), Set.of()));
        }
        return oraclePackageService.orderByIds(ids, fetched, Resource::getId);
    }

    private Resource findResourceMetadataOrThrow(Long id) {
        if (id == null) {
            throw new AuthException(
                    HttpStatus.NOT_FOUND,
                    "DOCUMENT_NOT_FOUND",
                    "El documento no existe o fue eliminado."
            );
        }
        return loadOrderedMetadataByIds(List.of(id)).stream()
                .filter(resource -> resource.getStatus() == ResourceStatus.PUBLISHED)
                .findFirst()
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "DOCUMENT_NOT_FOUND",
                        "El documento no existe o fue eliminado."
                ));
    }

    private Resource findResourceOrThrow(Long id) {
        return resourceRepository.findById(id)
                .filter(resource -> resource.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "DOCUMENT_NOT_FOUND",
                        "El documento no existe o fue eliminado."
                ));
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
        if (cleanTitle.length() < 3 || cleanTitle.length() > 120) {
            fields.put("title", "El título debe tener entre 3 y 120 caracteres.");
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
                if (clean.length() > 30) {
                    clean = clean.substring(0, 30);
                }
                final String tagName = clean;
                Long tagId = repositoriosRepository.obtenerEtiquetaNombre(tagName);
                Tag tag = (tagId == null ? java.util.Optional.<Tag>empty() : tagRepository.findById(tagId))
                        .orElseGet(() -> tagRepository.save(new Tag(tagName)));
                tags.add(tag);
            }
            return tags;
        } catch (Exception ex) {
            log.warn("Formato JSON inválido en etiquetas de documento '{}': {}", tagsJson, ex.getMessage());
            return tags;
        }
    }

    private DocumentDto toDto(Resource resource, String baseUrl) {
        String previewUrl = baseUrl + "/api/documents/" + resource.getId() + "/preview";
        return DocumentDto.fromEntity(resource, previewUrl);
    }

    private record ValidatedFile(String originalName, String mimeType, long sizeBytes, byte[] bytes) {}
}
