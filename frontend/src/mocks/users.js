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
 * @property {string} name
 * @property {string} username
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
    name: 'Sergio Guerrero',
    username: 'sergioaguerrero',
    email: 'sergioaguerrero@unicesar.edu.co',
    semester: 4,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-002',
    name: 'Laura Martínez',
    username: 'lauramartinez',
    email: 'lauramartinez@unicesar.edu.co',
    semester: 4,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-003',
    name: 'Andrés Pineda',
    username: 'andrespineda',
    email: 'andrespineda@unicesar.edu.co',
    semester: 3,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-004',
    name: 'Valentina Rojas',
    username: 'valentinarojas',
    email: 'valentinarojas@unicesar.edu.co',
    semester: 5,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-005',
    name: 'Camilo Daza',
    username: 'camilodaza',
    email: 'camilodaza@unicesar.edu.co',
    semester: 2,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-006',
    name: 'Daniela Ospino',
    username: 'danielaospino',
    email: 'danielaospino@unicesar.edu.co',
    semester: 6,
    role: 'estudiante',
    password: 'Alejandria1',
    suspended: false,
  },
  {
    id: 'usr-900',
    name: 'Administrador Alejandría',
    username: 'admin',
    email: 'admin@unicesar.edu.co',
    semester: null,
    role: 'admin',
    password: 'Admin1234',
    suspended: false,
  },
];
