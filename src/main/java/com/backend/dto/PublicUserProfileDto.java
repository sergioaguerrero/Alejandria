package com.backend.dto;

import com.backend.domain.identity.User;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Perfil público de un usuario sin exponer correo institucional ni nombre completo privado.
 */
public class PublicUserProfileDto {

    private Long id;
    private String username;
    private Integer semester;
    private String role;

    @JsonProperty("isSelf")
    private boolean self;

    private long followersCount;
    private long followingCount;

    @JsonProperty("isFollowing")
    private boolean following;

    @JsonProperty("followsMe")
    private boolean followsMe;

    @JsonProperty("isFriend")
    private boolean friend;

    public PublicUserProfileDto() {}

    public static PublicUserProfileDto fromEntity(
            User user,
            boolean isSelf,
            long followersCount,
            long followingCount,
            boolean isFollowing,
            boolean followsMe
    ) {
        PublicUserProfileDto dto = new PublicUserProfileDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setSemester(user.getSemester());
        String roleName = user.getRole() != null ? user.getRole().getName().toLowerCase() : "estudiante";
        dto.setRole(roleName.contains("admin") ? "admin" : "estudiante");
        dto.setSelf(isSelf);
        dto.setFollowersCount(followersCount);
        dto.setFollowingCount(followingCount);
        dto.setFollowing(isFollowing);
        dto.setFollowsMe(followsMe);
        dto.setFriend(!isSelf && isFollowing && followsMe);
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    @JsonProperty("isSelf")
    public boolean isSelf() { return self; }
    @JsonProperty("isSelf")
    public void setSelf(boolean self) { this.self = self; }

    public long getFollowersCount() { return followersCount; }
    public void setFollowersCount(long followersCount) { this.followersCount = followersCount; }

    public long getFollowingCount() { return followingCount; }
    public void setFollowingCount(long followingCount) { this.followingCount = followingCount; }

    @JsonProperty("isFollowing")
    public boolean isFollowing() { return following; }
    @JsonProperty("isFollowing")
    public void setFollowing(boolean following) { this.following = following; }

    @JsonProperty("followsMe")
    public boolean isFollowsMe() { return followsMe; }
    @JsonProperty("followsMe")
    public void setFollowsMe(boolean followsMe) { this.followsMe = followsMe; }

    @JsonProperty("isFriend")
    public boolean isFriend() { return friend; }
    @JsonProperty("isFriend")
    public void setFriend(boolean friend) { this.friend = friend; }
}
