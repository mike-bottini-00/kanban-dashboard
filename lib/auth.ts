import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.INTERNAL_JWT_SECRET;

export interface AgentTokenPayload {
  agentId: string;
  role: string;
}

function requireJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('INTERNAL_JWT_SECRET is not set');
  }
  return JWT_SECRET;
}

export const generateAgentToken = (payload: AgentTokenPayload) => {
  return jwt.sign(payload, requireJwtSecret(), { expiresIn: '1d' });
};

export const verifyAgentToken = (token: string) => {
  try {
    return jwt.verify(token, requireJwtSecret()) as AgentTokenPayload;
  } catch (error) {
    return null;
  }
};
