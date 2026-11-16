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
import com.backend.service.JwtTokenService;
import com.backend.service.UserProfileService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Expone los endpoints REST del perfil propio, perfil público, red de amigos, colaboraciones y materias.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;
    private final CollaboratorService collaboratorService;
    private final JwtTokenService jwtTokenService;

    public UserController(
            UserProfileService userProfileService,
            CollaboratorService collaboratorService,
            JwtTokenService jwtTokenService
    ) {
        this.userProfileService = userProfileService;
        this.collaboratorService = collaboratorService;
        this.jwtTokenService = jwtTokenService;
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateMyProfile(
            @RequestBody UpdateProfileRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(userProfileService.updateProfile(request, resolveUser(authorization)));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changeMyPassword(
            @RequestBody ChangePasswordRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        userProfileService.changePassword(request, resolveUser(authorization));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/friends")
    public ResponseEntity<List<PublicUserProfileDto>> getMyFriends(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(userProfileService.getFriends(resolveUser(authorization)));
    }

    @GetMapping("/me/following")
    public ResponseEntity<List<PublicUserProfileDto>> getMyFollowing(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(userProfileService.getFollowing(resolveUser(authorization)));
    }

    @GetMapping("/me/followers")
    public ResponseEntity<List<PublicUserProfileDto>> getMyFollowers(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(userProfileService.getFollowers(resolveUser(authorization)));
    }

    @GetMapping("/me/subjects")
    public ResponseEntity<List<SubjectDto>> getMySubjects(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(userProfileService.getSubjectsOfInterest(resolveUser(authorization)));
    }

    @PutMapping("/me/subjects")
    public ResponseEntity<List<SubjectDto>> updateMySubjects(
            @RequestBody UpdateSubjectsOfInterestRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(
                userProfileService.updateSubjectsOfInterest(request.getSubjectIds(), resolveUser(authorization))
        );
    }

    @GetMapping("/me/collaborations")
    public ResponseEntity<CollaborationsResponseDto> getMyCollaborations(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(collaboratorService.getMyCollaborations(resolveUser(authorization)));
    }

    @GetMapping
    public ResponseEntity<List<PublicUserProfileDto>> searchUsers(
            @RequestParam(required = false) String q,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(userProfileService.searchUsers(q, resolveUser(authorization)));
    }

    @GetMapping("/{username}")
    public ResponseEntity<PublicUserProfileDto> getPublicProfile(
            @PathVariable String username,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(userProfileService.getPublicProfile(username, resolveUser(authorization)));
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<PublicUserProfileDto> toggleFollow(
            @PathVariable String username,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(userProfileService.toggleFollow(username, resolveUser(authorization)));
    }

    private User resolveUser(String authorization) {
        return jwtTokenService.resolveUserFromAuthorizationHeader(authorization).orElse(null);
    }
}
