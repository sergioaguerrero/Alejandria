package com.backend.cross;

import java.util.Locale;

public enum NotificationType {
    NEW_CONTENT,
    WARNING,
    CONTENT_HIDDEN,
    CONTENT_DELETED,
    SANCTION,
    LIKE,
    SYSTEM,
    REPORT_PENDING,
    NEW_FOLLOWER,
    FRIEND_MATCH,
    AI_SHARED,
    COLLAB_INVITE;

    public String toFrontendValue() {
        return name().toLowerCase(Locale.ROOT);
    }
}
