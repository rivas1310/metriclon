import jwt from 'jsonwebtoken';

export interface DecodedToken {
  userId: string;
  email: string;
  organizations: Array<{
    id: string;
    role: string;
  }>;
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as DecodedToken;
    
    return decoded;
  } catch (error) {
    console.error('Error verificando token:', error);
    return null;
  }
}

export function generateToken(payload: Omit<DecodedToken, 'organizations'> & { organizations: Array<{ id: string; role: string }> }): string {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
}
