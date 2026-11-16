/**
 * @file topics.js
 * @description Canonical normalization, validation and catalog lookup helpers
 * for academic document topics (`topic`).
 */

import { SUGGESTED_TOPICS_BY_SUBJECT } from '../mocks/catalogs.js';

export const OTHER_TOPIC_OPTION = 'Otro';

const MAX_TOPIC_LENGTH = 60;
const TOPIC_ALLOWED_CHARS_REGEX = /^[\p{L}\p{N}\s\-/+*#.:()]+$/u;
const TOPIC_HAS_LETTER_REGEX = /\p{L}/u;
const TOPIC_VOWEL_REGEX = /[aeiouáéíóúüý]/iu;
const TOPIC_REPEATED_LETTER_REGEX = /(\p{L})\1{2,}/iu;
const TOPIC_REPEATED_GROUP_REGEX = /(\p{L}{2,})\1{2,}/iu;
const TOPIC_CONSONANT_CLUSTER_REGEX = /[bcdfghjklmnñpqrstvwxz]{6,}/iu;
const EXPLICIT_MASH_SUBSTRING_REGEX =
  /(asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|vbnm|qwer|uiop|wasd)/i;
const KEYBOARD_WALK_ROWS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const SINGLE_LETTER_LANG_REGEX = /^(c\+\+|c#|f#|r)$/i;

const KNOWN_CONSONANT_ACRONYMS = new Set([
  'html',
  'http',
  'https',
  'smtp',
  'jdbc',
  'grpc',
  'xslt',
  'scss',
  'plsql',
  'ctrl',
  'sync',
]);

/** Flat list of all curated catalog topics in canonical display casing. */
const ALL_CATALOG_TOPICS = Array.from(new Set(Object.values(SUGGESTED_TOPICS_BY_SUBJECT).flat()));

/** Collapses repeated whitespace and trims edges without changing casing. */
export function cleanTopicSpacing(topic) {
  return String(topic ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Canonical accent/case-insensitive key used for deduplication and grouping. */
export function normalizeTopicKey(topic) {
  return cleanTopicSpacing(topic)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const CATALOG_TOPIC_BY_KEY = new Map(
  ALL_CATALOG_TOPICS.map((topic) => [normalizeTopicKey(topic), topic]),
);

function containsKeyboardWalk(word) {
  if (EXPLICIT_MASH_SUBSTRING_REGEX.test(word)) return true;
  if (word.length < 5) return false;

  for (const row of KEYBOARD_WALK_ROWS) {
    const reversed = row.split('').reverse().join('');
    for (const sequence of [row, reversed]) {
      for (let i = 0; i <= sequence.length - 5; i += 1) {
        if (word.includes(sequence.slice(i, i + 5))) return true;
      }
    }
  }

  return false;
}

function isLikelyGibberishToken(token) {
  const normalized = normalizeTopicKey(token);
  if (KNOWN_CONSONANT_ACRONYMS.has(normalized)) return false;
  if (containsKeyboardWalk(normalized)) return true;
  if (TOPIC_CONSONANT_CLUSTER_REGEX.test(normalized)) return true;
  if (normalized.length >= 4 && !TOPIC_VOWEL_REGEX.test(normalized)) return true;
  return false;
}

/**
 * Validates that a document topic represents a meaningful academic unit.
 * @param {string} rawTopic
 * @returns {string|null} Validation message, or `null` when valid.
 */
export function getTopicValidationError(rawTopic) {
  const clean = cleanTopicSpacing(rawTopic);

  if (clean.length < 3) {
    return 'Escribe o selecciona el tema del documento (mínimo 3 caracteres).';
  }
  if (normalizeTopicKey(clean) === normalizeTopicKey(OTHER_TOPIC_OPTION)) {
    return 'Especifica el tema del documento en lugar de "Otro".';
  }
  if (clean.length > MAX_TOPIC_LENGTH) {
    return `El tema no puede superar los ${MAX_TOPIC_LENGTH} caracteres.`;
  }
  if (!TOPIC_ALLOWED_CHARS_REGEX.test(clean) || !TOPIC_HAS_LETTER_REGEX.test(clean)) {
    return 'Usa un nombre de tema académico válido (letras, números y signos básicos).';
  }
  if (TOPIC_REPEATED_LETTER_REGEX.test(clean) || TOPIC_REPEATED_GROUP_REGEX.test(clean)) {
    return 'Escribe un tema académico válido (evita caracteres repetidos sin sentido).';
  }

  const letterTokens = clean.match(/\p{L}+/gu) ?? [];
  const hasRealWord = letterTokens.some((token) => token.length >= 2) || SINGLE_LETTER_LANG_REGEX.test(clean);
  if (!hasRealWord || letterTokens.some(isLikelyGibberishToken)) {
    return 'Escribe un tema académico válido (evita caracteres aleatorios o de prueba).';
  }

  return null;
}

/**
 * Curated topic suggestions configured for a subject id.
 * @param {number|string|null|undefined} subjectId
 * @returns {string[]}
 */
export function getCatalogTopicsForSubject(subjectId) {
  if (!subjectId) return [];
  return SUGGESTED_TOPICS_BY_SUBJECT[Number(subjectId)] ?? [];
}

/**
 * Merges curated subject topics with valid existing topics, deduplicated
 * by normalized key (`Recursividad` and `recursividad` collapse into one).
 * @param {number|string|null|undefined} subjectId
 * @param {string[]} [extraTopics]
 * @returns {string[]}
 */
export function buildTopicSuggestions(subjectId, extraTopics = []) {
  const byKey = new Map();

  for (const candidate of [...getCatalogTopicsForSubject(subjectId), ...extraTopics]) {
    const clean = cleanTopicSpacing(candidate);
    if (!clean || getTopicValidationError(clean)) continue;
    const key = normalizeTopicKey(clean);
    if (!byKey.has(key)) {
      byKey.set(key, CATALOG_TOPIC_BY_KEY.get(key) ?? clean);
    }
  }

  return Array.from(byKey.values());
}

/**
 * Resolves user input to the matching canonical catalog/existing label when
 * available, otherwise cleans spacing and capitalizes an all-lowercase phrase.
 * @param {string} rawTopic
 * @param {string[]} [preferredTopics]
 * @returns {string}
 */
export function resolveCanonicalTopic(rawTopic, preferredTopics = []) {
  const clean = cleanTopicSpacing(rawTopic);
  if (!clean) return '';

  const key = normalizeTopicKey(clean);

  for (const candidate of preferredTopics) {
    const cleanCandidate = cleanTopicSpacing(candidate);
    if (normalizeTopicKey(cleanCandidate) === key) return cleanCandidate;
  }

  if (CATALOG_TOPIC_BY_KEY.has(key)) {
    return CATALOG_TOPIC_BY_KEY.get(key);
  }

  if (clean === clean.toLowerCase()) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return clean;
}

/**
 * Aggregates valid document topics by canonical normalized key so casing or
 * accent differences (e.g. `recursividad` vs `Recursividad`) combine cleanly.
 * @param {Array<{ topic?: string }>} [documents]
 * @param {number} [limit]
 * @returns {Array<{ tema: string, documentos: number }>}
 */
export function aggregateTopTopics(documents = [], limit = 5) {
  const groups = new Map();

  for (const doc of documents) {
    const clean = cleanTopicSpacing(doc?.topic);
    if (!clean || getTopicValidationError(clean)) continue;

    const key = normalizeTopicKey(clean);
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        tema: CATALOG_TOPIC_BY_KEY.get(key) ?? resolveCanonicalTopic(clean),
        documentos: 1,
      });
    } else {
      existing.documentos += 1;
      // Prefer a curated or non-all-lowercase variant when one wasn't already chosen.
      if (!CATALOG_TOPIC_BY_KEY.has(key) && clean !== clean.toLowerCase()) {
        existing.tema = clean;
      }
    }
  }

  return Array.from(groups.values())
    .sort((a, b) => b.documentos - a.documentos || a.tema.localeCompare(b.tema, 'es'))
    .slice(0, limit);
}
