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
 * @property {string|null} [bio]
 * @property {Array<{ id: string, type: string, value: string, label?: string|null }>} [contacts]
 * @property {string} password        Only in the mock.
 * @property {boolean} verified
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
    bio: 'Estudiante de Ingeniería de Sistemas interesado en desarrollo backend con Java/Spring Boot, bases de datos Oracle y grupos de estudio para parciales.',
    contacts: [
      { id: 'cnt-1', type: 'GITHUB', value: '@sergioaguerrero', label: null },
      { id: 'cnt-2', type: 'WHATSAPP', value: '+57 300 412 8890', label: 'Grupos de estudio' },
      { id: 'cnt-3', type: 'DISCORD', value: 'sergio.dev', label: null },
    ],
    password: 'Alejandria1',
    verified: true,
    suspended: false,
  },
  {
    id: 'usr-002',
    username: 'lauramartinez',
    name: 'Laura Valentina Martínez',
    email: 'lauramartinez@unicesar.edu.co',
    semester: 4,
    role: 'estudiante',
    bio: 'Apasionada por algoritmos, estructuras de datos y diseño de interfaces. Siempre abierta a colaborar en repositorios de estudio.',
    contacts: [
      { id: 'cnt-4', type: 'LINKEDIN', value: 'https://linkedin.com/in/lauramartinez', label: null },
      { id: 'cnt-5', type: 'TELEGRAM', value: '@lauramartinez', label: null },
    ],
    password: 'Alejandria1',
    verified: true,
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
    verified: true,
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
    verified: true,
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
    verified: true,
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
    verified: true,
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
    verified: true,
    suspended: false,
  },
];
