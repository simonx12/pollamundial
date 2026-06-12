/**
 * Decodes a base64 JWT payload safely.
 */
export function decodeJwtClaims(token) {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Error decoding JWT claims:', err);
    return null;
  }
}

/**
 * Validates the JWT claims ensuring structural integrity and expiration.
 * @returns {boolean} True if claims are valid and not expired.
 */
export function validateTokenClaims(token) {
  const claims = decodeJwtClaims(token);
  if (!claims) return false;

  // Validate structural claims
  if (!claims.sub || !claims.exp || !claims.aud) {
    console.warn('⚠️ Invalid token structure: missing core claims');
    return false;
  }

  // Validate expiration time (exp is in seconds)
  // We add a 5-second buffer to prevent edge cases during network requests
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp <= now + 5) {
    console.warn('⏱️ Token claims validate as EXPIRED.');
    return false;
  }

  return true;
}
