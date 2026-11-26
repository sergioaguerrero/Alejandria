package com.backend.controller;

import com.backend.cross.ProfileImageType;
import com.backend.domain.identity.User;
import com.backend.dto.ChangePasswordRequest;
import com.backend.dto.CollaborationsResponseDto;
import com.backend.dto.PublicUserProfileDto;
import com.backend.dto.SubjectDto;
import com.backend.dto.UpdateProfileRequest;
import com.backend.dto.UpdateSubjectsOfInterestRequest;
import com.backend.dto.UserDto;
import com.backend.service.CollaboratorService;
import com.backend.service.ProfileImageService;
import com.backend.service.StatisticsService;
import com.backend.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Expone los endpoints REST del perfil propio, perfil público, red de amigos, colaboraciones, estadísticas y materias.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;
    private final ProfileImageService profileImageService;
    private final CollaboratorService collaboratorService;
    private final StatisticsService statisticsService;

    public UserController(
            UserProfileService userProfileService,
            ProfileImageService profileImageService,
            CollaboratorService collaboratorService,
            StatisticsService statisticsService
    ) {
        this.userProfileService = userProfileService;
        this.profileImageService = profileImageService;
        this.collaboratorService = collaboratorService;
        this.statisticsService = statisticsService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMyProfile(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userProfileService.getMyProfile(currentUser));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateMyProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userProfileService.updateProfile(request, currentUser));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changeMyPassword(
            @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        userProfileService.changePassword(request, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDto> uploadMyAvatar(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        return ResponseEntity.ok(profileImageService.uploadImage(currentUser, ProfileImageType.AVATAR, file));
    }

    @DeleteMapping("/me/avatar")
    public ResponseEntity<UserDto> deleteMyAvatar(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(profileImageService.deleteImage(currentUser, ProfileImageType.AVATAR));
    }

    @PutMapping(value = "/me/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDto> uploadMyBanner(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User currentUser
    ) throws IOException {
        return ResponseEntity.ok(profileImageService.uploadImage(currentUser, ProfileImageType.BANNER, file));
    }

    @DeleteMapping("/me/banner")
    public ResponseEntity<UserDto> deleteMyBanner(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(profileImageService.deleteImage(currentUser, ProfileImageType.BANNER));
    }

    @RequestMapping(value = "/{id}/avatar", method = {RequestMethod.GET, RequestMethod.HEAD})
    public void getUserAvatar(
            @PathVariable Long id,
            @RequestParam(value = "v", required = false) String version,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        streamProfileImage(id, ProfileImageType.AVATAR, version, "HEAD".equalsIgnoreCase(request.getMethod()), response);
    }

    @RequestMapping(value = "/{id}/banner", method = {RequestMethod.GET, RequestMethod.HEAD})
    public void getUserBanner(
            @PathVariable Long id,
            @RequestParam(value = "v", required = false) String version,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        streamProfileImage(id, ProfileImageType.BANNER, version, "HEAD".equalsIgnoreCase(request.getMethod()), response);
    }

    @GetMapping("/me/friends")
    public ResponseEntity<List<PublicUserProfileDto>> getMyFriends(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userProfileService.getFriends(currentUser));
    }

    @GetMapping("/me/following")
    public ResponseEntity<List<PublicUserProfileDto>> getMyFollowing(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userProfileService.getFollowing(currentUser));
    }

    @GetMapping("/me/followers")
    public ResponseEntity<List<PublicUserProfileDto>> getMyFollowers(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userProfileService.getFollowers(currentUser));
    }

    @GetMapping("/me/subjects")
    public ResponseEntity<List<SubjectDto>> getMySubjects(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userProfileService.getSubjectsOfInterest(currentUser));
    }

    @PutMapping("/me/subjects")
    public ResponseEntity<List<SubjectDto>> updateMySubjects(
            @RequestBody UpdateSubjectsOfInterestRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(
                userProfileService.updateSubjectsOfInterest(request.getSubjectIds(), currentUser)
        );
    }

    @GetMapping("/me/collaborations")
    public ResponseEntity<CollaborationsResponseDto> getMyCollaborations(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(collaboratorService.getMyCollaborations(currentUser));
    }

    @GetMapping("/me/statistics")
    public ResponseEntity<Map<String, Object>> getMyStatistics(
            @RequestParam(defaultValue = "week") String period,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(statisticsService.getMyStatistics(period, currentUser));
    }

    @GetMapping
    public ResponseEntity<List<PublicUserProfileDto>> searchUsers(
            @RequestParam(required = false) String q,
            @AuthenticationPrincipal User viewer
    ) {
        return ResponseEntity.ok(userProfileService.searchUsers(q, viewer));
    }

    @GetMapping("/{username}")
    public ResponseEntity<PublicUserProfileDto> getPublicProfile(
            @PathVariable String username,
            @AuthenticationPrincipal User viewer
    ) {
        return ResponseEntity.ok(userProfileService.getPublicProfile(username, viewer));
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<PublicUserProfileDto> toggleFollow(
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(userProfileService.toggleFollow(username, currentUser));
    }

    private void streamProfileImage(
            Long userId,
            ProfileImageType type,
            String version,
            boolean isHead,
            HttpServletResponse response
    ) throws IOException {
        ProfileImageService.ImageMetadata meta = profileImageService.getImageMetadata(userId, type);
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(meta.mimeType());
        if (meta.sizeBytes() > 0) {
            response.setContentLengthLong(meta.sizeBytes());
        }
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        response.setHeader(
                HttpHeaders.CACHE_CONTROL,
                (version != null && !version.isBlank())
                        ? "public, max-age=31536000, immutable"
                        : "public, max-age=300"
        );
        if (!isHead && meta.sizeBytes() > 0) {
            profileImageService.streamImageBytes(userId, type, response.getOutputStream());
        }
    }
}
