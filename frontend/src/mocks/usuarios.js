/**
 * @file usuarios.js
 * @description Usuarios de ejemplo (FE-02).
 *
 * Credenciales para la demo:
 *   Estudiante → sergioaguerrero@unicesar.edu.co / Alejandria1
 *   Admin      → admin@unicesar.edu.co          / Admin1234
 *
 * El campo password solo existe en el mock; authService lo elimina
 * antes de devolver el usuario a la aplicación.
 */

/**
 * @typedef {object} Usuario
 * @property {string} id
 * @property {string} nombre
 * @property {string} username
 * @property {string} correo
 * @property {number|null} semestre
 * @property {'estudiante'|'admin'} rol
 * @property {string} password        Solo en el mock.
 * @property {boolean} suspendido
 */

/** @type {Usuario[]} */
export const USUARIOS = [
  {
    id: 'usr-001',
    nombre: 'Sergio Guerrero',
    username: 'sergioaguerrero',
    correo: 'sergioaguerrero@unicesar.edu.co',
    semestre: 4,
    rol: 'estudiante',
    password: 'Alejandria1',
    suspendido: false,
  },
  {
    id: 'usr-002',
    nombre: 'Laura Martínez',
    username: 'lauramartinez',
    correo: 'lauramartinez@unicesar.edu.co',
    semestre: 4,
    rol: 'estudiante',
    password: 'Alejandria1',
    suspendido: false,
  },
  {
    id: 'usr-003',
    nombre: 'Andrés Pineda',
    username: 'andrespineda',
    correo: 'andrespineda@unicesar.edu.co',
    semestre: 3,
    rol: 'estudiante',
    password: 'Alejandria1',
    suspendido: false,
  },
  {
    id: 'usr-004',
    nombre: 'Valentina Rojas',
    username: 'valentinarojas',
    correo: 'valentinarojas@unicesar.edu.co',
    semestre: 5,
    rol: 'estudiante',
    password: 'Alejandria1',
    suspendido: false,
  },
  {
    id: 'usr-005',
    nombre: 'Camilo Daza',
    username: 'camilodaza',
    correo: 'camilodaza@unicesar.edu.co',
    semestre: 2,
    rol: 'estudiante',
    password: 'Alejandria1',
    suspendido: false,
  },
  {
    id: 'usr-006',
    nombre: 'Daniela Ospino',
    username: 'danielaospino',
    correo: 'danielaospino@unicesar.edu.co',
    semestre: 6,
    rol: 'estudiante',
    password: 'Alejandria1',
    suspendido: false,
  },
  {
    id: 'usr-900',
    nombre: 'Administrador Alejandría',
    username: 'admin',
    correo: 'admin@unicesar.edu.co',
    semestre: null,
    rol: 'admin',
    password: 'Admin1234',
    suspendido: false,
  },
];
