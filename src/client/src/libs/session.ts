// lib/session.ts
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { RoleCode } from './roles';
import { Session } from '@/types/auth';

const key = new TextEncoder().encode(process.env.SESSION_SECRET);


export async function decrypt(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return { 
        userId: payload.userId as string, 
        role: payload.role as RoleCode 
    };
  } catch {
    return null;
  }
}

export async function getSession() {
  return decrypt((await cookies()).get('session')?.value);
}