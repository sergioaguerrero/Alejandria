package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.ChangePasswordRequest;
import com.backend.dto.CollaborationsResponseDto;
import com.backend.dto.PublicUserProfileDto;
import com.backend.dto.SubjectDto;
import com.backend.dto.UpdateProfileRequest;
import com.backend.dto.UpdateSubjectsOfInterestRequest;
import com.backend.dto.UserDto;
import com.backend.service.CollaboratorService;
import com.backend.service.StatisticsService;
import com.backend.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Expone los endpoints REST del perfil propio, perfil público, red de amigos, colaboraciones, estadísticas y materias.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;
    private final CollaboratorService collaboratorService;
    private final StatisticsService statisticsService;

    public UserController(
            UserProfileService userProfileService,
            CollaboratorService collaboratorService,
            StatisticsService statisticsService
    ) {
        this.userProfileService = userProfileService;
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
}
