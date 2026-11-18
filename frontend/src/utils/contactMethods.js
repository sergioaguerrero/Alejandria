/**
 * @file contactMethods.js
 * @description Metadata, validation and safe link resolution for user profile
 * description (bio) and contact methods.
 */

export const MAX_BIO_LENGTH = 500;
export const MAX_CONTACTS = 8;
export const MAX_CONTACT_VALUE_LENGTH = 255;
export const MAX_CONTACT_LABEL_LENGTH = 60;

export const CONTACT_METHODS = [
  {
    value: 'WHATSAPP',
    label: 'WhatsApp',
    placeholder: '+57 300 123 4567',
    helper: 'Número con indicativo (ej. +57 300 123 4567)',
  },
  {
    value: 'EMAIL',
    label: 'Correo de contacto',
    placeholder: 'nombre@correo.com',
    helper: 'Correo personal o alternativo de contacto',
  },
  {
    value: 'INSTAGRAM',
    label: 'Instagram',
    placeholder: '@usuario o https://instagram.com/usuario',
    helper: 'Usuario (@ejemplo) o enlace a tu perfil',
  },
  {
    value: 'LINKEDIN',
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/tu-perfil',
    helper: 'Enlace a tu perfil o identificador',
  },
  {
    value: 'GITHUB',
    label: 'GitHub',
    placeholder: '@usuario o https://github.com/usuario',
    helper: 'Usuario o enlace de tu perfil de GitHub',
  },
  {
    value: 'TELEGRAM',
    label: 'Telegram',
    placeholder: '@usuario o https://t.me/usuario',
    helper: 'Usuario o enlace de Telegram',
  },
  {
    value: 'DISCORD',
    label: 'Discord',
    placeholder: 'tu_usuario',
    helper: 'Tu nombre de usuario en Discord (se copia al hacer clic)',
  },
  {
    value: 'WEBSITE',
    label: 'Sitio web / Portafolio',
    placeholder: 'https://miportafolio.dev',
    helper: 'URL completa comenzando con https:// o http://',
  },
  {
    value: 'OTHER',
    label: 'Otro medio',
    placeholder: 'Dato o enlace de contacto',
    helper: 'Agrega una etiqueta para identificar este medio',
  },
];

const CONTACT_META_BY_TYPE = Object.fromEntries(
  CONTACT_METHODS.map((item) => [item.value, item]),
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WHATSAPP_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

/**
 * Returns display metadata for a contact method type.
 * @param {string} type
 */
export function getContactMeta(type) {
  return CONTACT_META_BY_TYPE[String(type ?? '').toUpperCase()] ?? CONTACT_META_BY_TYPE.OTHER;
}

/**
 * Checks that a URL uses http/https with a valid host containing a dot.
 * Blocks javascript:, data:, vbscript:, etc.
 * @param {string} value
 * @returns {boolean}
 */
export function isSafeHttpUrl(value) {
  try {
    const parsed = new URL(String(value ?? '').trim());
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      Boolean(parsed.hostname) &&
      parsed.hostname.includes('.')
    );
  } catch {
    return false;
  }
}

/**
 * Resolves safe href, display label and copyable text for a contact item.
 * @param {{ type?: string, value?: string, label?: string|null }} contact
 */
export function resolveContactAction(contact) {
  const type = String(contact?.type ?? 'OTHER').toUpperCase();
  const value = String(contact?.value ?? '').trim();
  const meta = getContactMeta(type);
  const displayLabel = String(contact?.label ?? '').trim() || meta.label;
  const cleanHandle = value.replace(/^@+/, '');

  let href = null;
  let external = false;

  if (type === 'WHATSAPP') {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 7) {
      href = `https://wa.me/${digits}`;
      external = true;
    }
  } else if (type === 'EMAIL') {
    if (EMAIL_REGEX.test(value)) {
      href = `mailto:${value}`;
    }
  } else if (type === 'INSTAGRAM') {
    if (/^https?:\/\//i.test(value)) {
      href = isSafeHttpUrl(value) ? value : null;
    } else if (cleanHandle) {
      href = `https://instagram.com/${encodeURIComponent(cleanHandle)}`;
    }
    external = Boolean(href);
  } else if (type === 'GITHUB') {
    if (/^https?:\/\//i.test(value)) {
      href = isSafeHttpUrl(value) ? value : null;
    } else if (cleanHandle) {
      href = `https://github.com/${encodeURIComponent(cleanHandle)}`;
    }
    external = Boolean(href);
  } else if (type === 'TELEGRAM') {
    if (/^https?:\/\//i.test(value)) {
      href = isSafeHttpUrl(value) ? value : null;
    } else if (cleanHandle) {
      href = `https://t.me/${encodeURIComponent(cleanHandle)}`;
    }
    external = Boolean(href);
  } else if (type === 'LINKEDIN') {
    if (/^https?:\/\//i.test(value)) {
      href = isSafeHttpUrl(value) ? value : null;
    } else if (cleanHandle) {
      href = `https://www.linkedin.com/in/${encodeURIComponent(cleanHandle)}`;
    }
    external = Boolean(href);
  } else if (type === 'WEBSITE' || type === 'OTHER') {
    if (isSafeHttpUrl(value)) {
      href = value;
      external = true;
    }
  }

  return {
    type,
    displayLabel,
    displayValue: value,
    copyText: value,
    href,
    external,
  };
}

/**
 * Validates bio and contact entries using the same rules as the backend.
 * @param {{ bio?: string, contacts?: Array<{ type?: string, value?: string, label?: string }> }} input
 * @returns {Record<string, string>} Map of field errors (empty when valid).
 */
export function validateBioAndContacts({ bio = '', contacts = [] }) {
  /** @type {Record<string, string>} */
  const fields = {};
  const cleanBio = String(bio ?? '').replace(/\r\n/g, '\n').trim();

  if (cleanBio.length > MAX_BIO_LENGTH) {
    fields.bio = `La descripción no puede superar los ${MAX_BIO_LENGTH} caracteres.`;
  }

  if (contacts.length > MAX_CONTACTS) {
    fields.contacts = `Puedes registrar como máximo ${MAX_CONTACTS} medios de contacto.`;
    return fields;
  }

  contacts.forEach((item, index) => {
    const type = String(item?.type ?? '').trim().toUpperCase();
    const value = String(item?.value ?? '').trim();
    const label = String(item?.label ?? '').trim();

    if (!CONTACT_META_BY_TYPE[type]) {
      fields[`contacts.${index}.type`] = 'Selecciona un tipo de contacto válido.';
    }
    if (label.length > MAX_CONTACT_LABEL_LENGTH) {
      fields[`contacts.${index}.label`] = `La etiqueta no puede superar ${MAX_CONTACT_LABEL_LENGTH} caracteres.`;
    }

    const lower = value.toLowerCase();
    if (!value) {
      fields[`contacts.${index}.value`] = 'Escribe el dato o enlace de contacto.';
    } else if (value.length > MAX_CONTACT_VALUE_LENGTH) {
      fields[`contacts.${index}.value`] = `No puede superar ${MAX_CONTACT_VALUE_LENGTH} caracteres.`;
    } else if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:')
    ) {
      fields[`contacts.${index}.value`] = 'Ese formato de enlace no está permitido.';
    } else if (type === 'EMAIL' && !EMAIL_REGEX.test(value)) {
      fields[`contacts.${index}.value`] = 'Escribe un correo electrónico válido.';
    } else if (type === 'WHATSAPP') {
      const digits = value.replace(/\D/g, '');
      if (!WHATSAPP_REGEX.test(value) || digits.length < 7 || digits.length > 15) {
        fields[`contacts.${index}.value`] = 'Escribe un número de WhatsApp válido (ej. +57 300 123 4567).';
      }
    } else if (type === 'WEBSITE' && !isSafeHttpUrl(value)) {
      fields[`contacts.${index}.value`] = 'Ingresa una URL válida que comience con https:// o http://.';
    } else if (['INSTAGRAM', 'GITHUB', 'TELEGRAM', 'LINKEDIN'].includes(type)) {
      if (/^https?:\/\//i.test(value)) {
        if (!isSafeHttpUrl(value)) {
          fields[`contacts.${index}.value`] = 'Ingresa una URL válida.';
        }
      } else if (value.includes(' ') || value.length < 2) {
        fields[`contacts.${index}.value`] = 'Escribe un usuario válido (sin espacios) o una URL completa.';
      }
    } else if (type === 'DISCORD' && (value.length < 2 || value.length > 60)) {
      fields[`contacts.${index}.value`] = 'Escribe tu usuario de Discord (entre 2 y 60 caracteres).';
    } else if (type === 'OTHER' && value.length < 2) {
      fields[`contacts.${index}.value`] = 'Escribe al menos 2 caracteres.';
    }
  });

  return fields;
}
