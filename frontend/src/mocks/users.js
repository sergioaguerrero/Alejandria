/**
 * @file users.js
 * @description Example users (FE-02).
 *
 * Credentials for the demo:
 *   Student → sergioaguerrero@unicesar.edu.co / Alejandria1
 *   Admin      → admin@unicesar.edu.co          / Admin1234
 *
 * The password field only exists in the mock; authService removes it
 * before returning the user to the application.
 */

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} username
 * @property {string} name            Full name; it is never shown in the public profile.
 * @property {string} email
 * @property {number|null} semester
 * @property {'estudiante'|'admin'} role
 * @property {string} password        Only in the mock.
 * @property {boolean} suspended
 */

/** @type {User[]} */
export const USERS = [
  {
    id: 'usr-001',
    username: 'sergioaguerrero',
    name: 'Sergio Andrés Guerrero',
    email: 'sergioaguerrero@unicesar.edu.co',
    semester: 4,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-002',
    username: 'lauramartinez',
    name: 'Laura Valentina Martínez',
    email: 'lauramartinez@unicesar.edu.co',
    semester: 4,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-003',
    username: 'andrespineda',
    name: 'Andrés Felipe Pineda',
    email: 'andrespineda@unicesar.edu.co',
    semester: 3,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-004',
    username: 'valentinarojas',
    name: 'Valentina Rojas',
    email: 'valentinarojas@unicesar.edu.co',
    semester: 5,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-005',
    username: 'camilodaza',
    name: 'Camilo Andrés Daza',
    email: 'camilodaza@unicesar.edu.co',
    semester: 2,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-006',
    username: 'danielaospino',
    name: 'Daniela Ospino',
    email: 'danielaospino@unicesar.edu.co',
    semester: 6,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-900',
    username: 'admin',
    name: 'Administración Alejandría',
    email: 'admin@unicesar.edu.co',
    semester: null,
    role: 'admin',
    password: 'Admin1234',
    suspended: false,
  },
];
