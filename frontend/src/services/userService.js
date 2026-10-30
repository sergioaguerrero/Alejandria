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
    const { data } = await http.get(`/users/${cleanUsername}`);
    return data;
  }

  await waitForMock();

  const user = store.users.find((candidate) => candidate.username === cleanUsername);

  if (!user) {
    throw new ApiError('El usuario no existe.', { status: 404 });
  }

  return { username: user.username };
}
