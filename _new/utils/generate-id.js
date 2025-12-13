import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefl', 17);

/**
 * Generate a unique short identifier.
 *
 * @returns {string} A 17 character hexadecimal id.
 */
export default function generateId() {
  return nanoid();
}
