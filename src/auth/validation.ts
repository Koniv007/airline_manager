// Each function returns an error message, or null when the value is fine.
export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? null : "Enter a valid email address";
}
export function validatePassword(password: string): string | null {
  return password.length >= 8 ? null : "Password must have at least 8 characters";
}
export function validateDisplayName(name: string): string | null {
  const n = name.trim().length;
  return n >= 2 && n <= 24 ? null : "Name must have 2–24 characters";
}
