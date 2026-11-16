package com.backend.dto;

import com.backend.cross.SanctionType;
import com.backend.domain.governance.UserSanction;
import com.backend.domain.identity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

/**
 * DTO administrativo del detalle de un usuario y su historial de sanciones.
 */
public class AdminUserResponseDto {

    private Long id;
    private String username;
    private String name;
    private String email;
    private Integer semester;
    private String role;
    private boolean suspended;
    private long repositoriesCount;
    private long documentsCount;
    private List<SanctionDto> sanctions;

    public static AdminUserResponseDto fromEntity(
            User user,
            long repositoriesCount,
            long documentsCount,
            List<UserSanction> sanctionEntities
    ) {
        AdminUserResponseDto dto = new AdminUserResponseDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setName(user.getName());
        dto.setEmail(user.getInstitutionalEmail());
        dto.setSemester(user.getSemester());
        String roleName = user.getRole() != null ? user.getRole().getName().toLowerCase(Locale.ROOT) : "estudiante";
        dto.setRole(roleName.contains("admin") ? "admin" : "estudiante");
        dto.setSuspended(user.isSuspended());
        dto.setRepositoriesCount(repositoriesCount);
        dto.setDocumentsCount(documentsCount);
        dto.setSanctions(sanctionEntities.stream().map(SanctionDto::fromEntity).toList());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isSuspended() { return suspended; }
    public void setSuspended(boolean suspended) { this.suspended = suspended; }

    public long getRepositoriesCount() { return repositoriesCount; }
    public void setRepositoriesCount(long repositoriesCount) { this.repositoriesCount = repositoriesCount; }

    public long getDocumentsCount() { return documentsCount; }
    public void setDocumentsCount(long documentsCount) { this.documentsCount = documentsCount; }

    public List<SanctionDto> getSanctions() { return sanctions; }
    public void setSanctions(List<SanctionDto> sanctions) { this.sanctions = sanctions; }

    public record SanctionDto(
            String id,
            Long userId,
            String type,
            String reason,
            String note,
            String adminUsername,
            LocalDateTime createdAt
    ) {
        public static SanctionDto fromEntity(UserSanction sanction) {
            return new SanctionDto(
                    String.valueOf(sanction.getId()),
                    sanction.getUser() != null ? sanction.getUser().getId() : null,
                    toFrontendType(sanction.getType()),
                    sanction.getReason(),
                    sanction.getNote(),
                    sanction.getModerator() != null ? sanction.getModerator().getUsername() : null,
                    sanction.getCreatedAt()
            );
        }

        private static String toFrontendType(SanctionType type) {
            if (type == null) return "advertencia";
            return switch (type) {
                case ADVERTENCIA -> "advertencia";
                case SUSPENSION -> "suspension";
                case REACTIVACION -> "reactivacion";
            };
        }
    }
}
