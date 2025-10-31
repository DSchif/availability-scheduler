/**
 * Generates a random share code for events
 * Format: 6 characters, alphanumeric (excluding similar-looking characters)
 */
export function generateShareCode(): string {
  // Exclude similar-looking characters: 0, O, I, l, 1
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }

  return code;
}

/**
 * Validates a share code format
 */
export function isValidShareCode(code: string): boolean {
  const pattern = /^[A-Z2-9]{6}$/;
  return pattern.test(code);
}
