import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.INTERNAL_JWT_SECRET || 'fallback-secret';

export interface AgentTokenPayload {
  agentId: string;
  role: string;
}

export const generateAgentToken = (payload: AgentTokenPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyAgentToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as AgentTokenPayload;
  } catch (error) {
    return null;
  }
};
