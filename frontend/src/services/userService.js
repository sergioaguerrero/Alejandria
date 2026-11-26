/**
 * @file userService.js
 * @description Public data of the users (FE-13, view 16, endpoint BE-14).
 *
 * The public profile only exposes the username: the email and the full name
 * stay private.
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { store } from '../mocks/store.js';
import { currentUser } from './authService.js';
import { emitMockNotification } from './notificationService.js';
import { getCachedOrFetch, invalidateCache } from '../utils/queryCache.js';

const followKey = (followerUsername, targetUsername) => `${followerUsername}::${targetUsername}`;

function isFollowingUser(followerUsername, targetUsername) {
  if (!followerUsername || !targetUsername || !store.userFollows) return false;
  return store.userFollows.has(followKey(followerUsername, targetUsername));
}

/**
 * Builds a public user representation without exposing private fields (email/full name),
 * enriched with follow counts and mutual friendship flags (FE-32).
 * @param {object} targetUser
 * @param {string|null|undefined} viewerUsername
 */
function buildPublicUserProfile(targetUser, viewerUsername) {
  const follows = store.userFollows ?? new Set();
  const followerSuffix = `::${targetUser.username}`;
  const followingPrefix = `${targetUser.username}::`;

  let followersCount = 0;
  let followingCount = 0;
  for (const key of follows) {
    if (key.endsWith(followerSuffix)) followersCount += 1;
    if (key.startsWith(followingPrefix)) followingCount += 1;
  }

  const isSelf = Boolean(viewerUsername && viewerUsername === targetUser.username);
  const isFollowing = Boolean(
    viewerUsername && !isSelf && isFollowingUser(viewerUsername, targetUser.username),
  );
  const followsMe = Boolean(
    viewerUsername && !isSelf && isFollowingUser(targetUser.username, viewerUsername),
  );

  return {
    id: targetUser.id,
    username: targetUser.username,
    semester: targetUser.semester ?? null,
    role: targetUser.role,
    bio: targetUser.bio ?? null,
    avatarUrl: targetUser.avatarUrl ?? null,
    bannerUrl: targetUser.bannerUrl ?? null,
    contacts: Array.isArray(targetUser.contacts) ? targetUser.contacts : [],
    isSelf,
    followersCount,
    followingCount,
    isFollowing,
    followsMe,
    isFriend: isFollowing && followsMe,
  };
}

/**
 * @typedef {object} PublicProfile
 * @property {string} username
 */

/**
 * Gets the public data of a user.
 * @param {string} username
 * @returns {Promise<PublicProfile>}
 * @throws {ApiError} 404 if the user does not exist.
 */
export async function getPublicProfile(username) {
  const cleanUsername = String(username ?? '').trim().toLowerCase();

  if (!cleanUsername) {
    throw new ApiError('El usuario no existe.', { status: 404 });
  }

  if (!USE_MOCK) {
    return getCachedOrFetch(
      `users:profile:${cleanUsername}`,
      async () => {
        const { data } = await http.get(`/users/${cleanUsername}`);
        return data;
      },
      { ttlMs: 25000 },
    );
  }

  await waitForMock();

  const user = store.users.find((candidate) => candidate.username === cleanUsername);

  if (!user) {
    throw new ApiError('El usuario no existe.', { status: 404 });
  }

  return buildPublicUserProfile(user, currentUser()?.username);
}

/**
 * Gets administrative user detail including sanctions history. Admin only (FE-24, BE-28).
 * @param {string} userId User id (e.g. 'usr-001') or username.
 * @returns {Promise<object>}
 */
export async function getAdminUser(userId) {
  const admin = currentUser();
  if (!admin || admin.role !== 'admin') {
    throw new ApiError('Solo los administradores pueden consultar la información de gestión de usuarios.', {
      status: 403,
    });
  }

  if (USE_MOCK) {
    await waitForMock();
    const user = store.users.find((u) => u.id === userId || u.username === userId);
    if (!user) {
      throw new ApiError('Usuario no encontrado.', { status: 404 });
    }

    const sanctions = store.sanctions
      .filter((s) => s.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const repositoriesCount = store.repositories.filter((r) => r.authorUsername === user.username).length;
    const documentsCount = store.documents.filter((d) => d.authorUsername === user.username).length;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      semester: user.semester,
      role: user.role,
      suspended: Boolean(user.suspended),
      sanctions,
      repositoriesCount,
      documentsCount,
    };
  }

  const response = await http.get(`/admin/users/${encodeURIComponent(userId)}`);
  return response.data;
}

/**
 * Toggles a user's account suspension. Admin only (FE-24, BE-28).
 * @param {string} userId
 * @param {{ reason?: string }} options
 * @returns {Promise<object>}
 */
export async function toggleUserSuspension(userId, { reason = '' } = {}) {
  const admin = currentUser();
  if (!admin || admin.role !== 'admin') {
    throw new ApiError('Solo los administradores pueden suspender o reactivar cuentas.', {
      status: 403,
    });
  }

  if (USE_MOCK) {
    await waitForMock();
    const user = store.users.find((u) => u.id === userId || u.username === userId);
    if (!user) {
      throw new ApiError('Usuario no encontrado.', { status: 404 });
    }

    const nextSuspended = !user.suspended;
    user.suspended = nextSuspended;

    store.counters.sanction += 1;
    const record = {
      id: `sanc-${String(store.counters.sanction).padStart(3, '0')}`,
      userId: user.id,
      type: nextSuspended ? 'suspension' : 'reactivacion',
      reason: reason || (nextSuspended ? 'Suspensión manual por administrador' : 'Reactivación de cuenta'),
      note: reason || null,
      adminUsername: admin.username,
      createdAt: new Date().toISOString(),
    };
    store.sanctions.unshift(record);

    store.counters.notification += 1;
    store.notifications.unshift({
      id: `notif-${String(store.counters.notification).padStart(3, '0')}`,
      userId: user.id,
      type: nextSuspended ? 'sanction' : 'system',
      title: nextSuspended ? 'Cuenta suspendida' : 'Cuenta reactivada',
      message: nextSuspended
        ? `Tu cuenta ha sido suspendida. Motivo: ${reason || 'Infracción de normas'}.`
        : 'Tu cuenta ha sido reactivada por el equipo de administración.',
      targetUrl: '/terms',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return {
      id: user.id,
      username: user.username,
      suspended: user.suspended,
    };
  }

  const response = await http.post(`/admin/users/${encodeURIComponent(userId)}/toggle-suspension`, {
    reason,
  });
  return response.data;
}


/**
 * Follows or unfollows another user (FE-32, BE-33).
 * Emits a follower or mutual-friend notification in mock mode.
 * @param {string} username
 * @returns {Promise<object>}
 */
export async function toggleFollowUser(username) {
  const viewer = currentUser();
  if (!viewer) {
    throw new ApiError('Debes iniciar sesión para seguir a otros usuarios.', { status: 401 });
  }

  const cleanUsername = String(username ?? '').trim().toLowerCase();
  if (!cleanUsername) {
    throw new ApiError('Usuario no válido.', { status: 400 });
  }

  if (cleanUsername === viewer.username) {
    throw new ApiError('No puedes seguirte a ti mismo.', { status: 400 });
  }

  if (!USE_MOCK) {
    const { data } = await http.post(`/users/${encodeURIComponent(cleanUsername)}/follow`);
    invalidateCache('users:');
    return data;
  }

  await waitForMock(200);

  const targetUser = store.users.find(
    (candidate) => candidate.username === cleanUsername && !candidate.suspended,
  );
  if (!targetUser) {
    throw new ApiError('El usuario no existe o no está disponible.', { status: 404 });
  }

  if (!store.userFollows) {
    store.userFollows = new Set();
  }

  const key = followKey(viewer.username, cleanUsername);
  const wasFollowing = store.userFollows.has(key);

  if (wasFollowing) {
    store.userFollows.delete(key);
  } else {
    store.userFollows.add(key);
    const mutual = isFollowingUser(cleanUsername, viewer.username);

    emitMockNotification({
      recipientUsername: cleanUsername,
      type: mutual ? 'friend_match' : 'new_follower',
      title: mutual ? '¡Nuevo amigo en Alejandría!' : 'Nuevo seguidor',
      message: mutual
        ? `@${viewer.username} también comenzó a seguirte. Ahora tienen seguimiento mutuo.`
        : `@${viewer.username} comenzó a seguirte.`,
      targetUrl: `/users/${viewer.username}`,
    });
  }

  return buildPublicUserProfile(targetUser, viewer.username);
}

/**
 * Shared query helper for listing friends, following, or followers (FE-32, BE-33).
 * @param {'friends'|'following'|'followers'} relation
 * @param {string} endpoint
 * @returns {Promise<object[]>}
 */
async function listUserConnections(relation, endpoint) {
  const viewer = currentUser();
  if (!viewer) {
    throw new ApiError('Debes iniciar sesión para consultar tu red de amigos.', { status: 401 });
  }

  if (!USE_MOCK) {
    return getCachedOrFetch(
      `users:connections:${relation}`,
      async () => {
        const { data } = await http.get(endpoint);
        return Array.isArray(data) ? data : (data?.items ?? data?.content ?? []);
      },
      { ttlMs: 20000 },
    );
  }

  await waitForMock(180);

  return store.users
    .filter((candidate) => {
      if (candidate.suspended || candidate.username === viewer.username) return false;
      const iFollow = isFollowingUser(viewer.username, candidate.username);
      const followsMe = isFollowingUser(candidate.username, viewer.username);
      if (relation === 'friends') return iFollow && followsMe;
      if (relation === 'following') return iFollow;
      return followsMe;
    })
    .sort((a, b) => a.username.localeCompare(b.username, 'es'))
    .map((candidate) => buildPublicUserProfile(candidate, viewer.username));
}

/**
 * Lists mutual friends of the current user (FE-32, BE-33).
 * @returns {Promise<object[]>}
 */
export function getFriends() {
  return listUserConnections('friends', '/users/me/friends');
}

/**
 * Lists users the current user follows (FE-32, BE-33).
 * @returns {Promise<object[]>}
 */
export function getFollowingUsers() {
  return listUserConnections('following', '/users/me/following');
}

/**
 * Lists users following the current user (FE-32, BE-33).
 * @returns {Promise<object[]>}
 */
export function getFollowerUsers() {
  return listUserConnections('followers', '/users/me/followers');
}

/**
 * Searches active student profiles by username or semester (FE-32).
 * @param {string} [query]
 * @returns {Promise<object[]>}
 */
export async function searchUsers(query = '', { signal } = {}) {
  const cleanQuery = String(query ?? '').trim().toLowerCase();

  if (!USE_MOCK) {
    return getCachedOrFetch(
      `users:search:${cleanQuery}`,
      async () => {
        const { data } = await http.get('/users', { params: { q: cleanQuery }, signal });
        return Array.isArray(data) ? data : (data?.items ?? data?.content ?? []);
      },
      { ttlMs: 20000, signal },
    );
  }

  await waitForMock(180);

  const viewer = currentUser();
  return store.users
    .filter((candidate) => {
      if (candidate.suspended || candidate.role === 'admin') return false;
      if (!cleanQuery) return true;
      const semesterText = candidate.semester ? `semestre ${candidate.semester}` : '';
      return (
        candidate.username.toLowerCase().includes(cleanQuery) ||
        semesterText.includes(cleanQuery)
      );
    })
    .sort((a, b) => a.username.localeCompare(b.username, 'es'))
    .map((candidate) => buildPublicUserProfile(candidate, viewer?.username));
}
