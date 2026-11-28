// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { POST } from './route';
import { readBackendUser } from '@/libs/backend-session';
const jar=vi.hoisted(()=>({set:vi.fn()}));
vi.mock('next/headers',()=>({cookies:async()=>jar}));
vi.mock('@/libs/backend-session',()=>({backendUrl:()=> 'http://backend.test',sameOrigin:()=>true,readBackendUser:vi.fn()}));
beforeEach(()=>{jar.set.mockReset();vi.stubEnv('SESSION_SECRET','login-session-test-secret-with-enough-length');});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
function request(){return new Request('http://app.test/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'owner@test.edu',password:'private-password',role:'student'})});}
it('stores only backend-authenticated identity in HTTP-only session cookies',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({payload:{data:{token:'real-backend-token'}}})));
 vi.mocked(readBackendUser).mockResolvedValue({userId:'schema-text-id',role:'student',email:'owner@test.edu',fullName:'Owner',avatarUrl:null,studentNumber:null,facultyId:'faculty',permissions:[]});
 const result=await POST(request());expect(result.status).toBe(200);
 expect(jar.set).toHaveBeenCalledWith('backend_access','real-backend-token',expect.objectContaining({httpOnly:true,sameSite:'lax',maxAge:3600}));
 expect(jar.set).toHaveBeenCalledWith('session',expect.any(String),expect.objectContaining({httpOnly:true}));
 const text=await result.text();expect(text).not.toContain('real-backend-token');expect(text).not.toContain('private-password');
});
it('does not create a session for an unassigned requested role',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({payload:{data:{token:'backend-token'}}})));
 vi.mocked(readBackendUser).mockResolvedValue(null);
 expect((await POST(request())).status).toBe(403);expect(jar.set).not.toHaveBeenCalled();
});
it('does not create a session for rejected credentials',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({message:'private details'},{status:401})));
 const result=await POST(request());expect(result.status).toBe(401);expect(await result.text()).not.toContain('private details');expect(jar.set).not.toHaveBeenCalled();
});
