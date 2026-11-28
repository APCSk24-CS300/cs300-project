// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { proxyProfile, readBackendUser } from './backend-session';
const jar = vi.hoisted(() => ({ get: vi.fn(), delete: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => jar }));
beforeEach(() => { jar.get.mockReturnValue({ value: 'verified-backend-token' }); jar.delete.mockReset(); });
afterEach(() => vi.unstubAllGlobals());
it('requires a backend session before calling the API', async () => {
 jar.get.mockReturnValue(undefined); const fetcher=vi.fn(); vi.stubGlobal('fetch',fetcher);
 expect((await proxyProfile(new Request('http://app.test/api/v1/profile'), '')).status).toBe(401);
 expect(fetcher).not.toHaveBeenCalled();
});
it('forwards the verified token, PATCH method, body and content type', async () => {
 const fetcher=vi.fn().mockResolvedValue(Response.json({ success:true }));vi.stubGlobal('fetch',fetcher);
 const body=JSON.stringify({phoneNumber:'0912345678'});
 const response=await proxyProfile(new Request('http://app.test/api/v1/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Origin:'http://app.test',Authorization:'Bearer attacker'},body}), '');
 expect(response.status).toBe(200);
 const [url,options]=fetcher.mock.calls[0];expect(url).toContain('/api/v1/profile');expect(options.method).toBe('PATCH');
 expect(options.headers.get('Authorization')).toBe('Bearer verified-backend-token');
 expect(new TextDecoder().decode(options.body)).toBe(body);
});
it('clears both cookies when backend authentication expires',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({message:'expired'},{status:401})));
 expect((await proxyProfile(new Request('http://app.test/api/v1/profile'),'')).status).toBe(401);
 expect(jar.delete).toHaveBeenCalledWith('session');expect(jar.delete).toHaveBeenCalledWith('backend_access');
});
it('rejects cross-origin writes before forwarding cookies',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 expect((await proxyProfile(new Request('http://app.test/api/v1/profile',{method:'PATCH',headers:{Origin:'http://attacker.test'}}),'')).status).toBe(403);
 expect(fetcher).not.toHaveBeenCalled();
});
it('does not expose storage or network error details',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('private network details')));
 const response=await proxyProfile(new Request('http://app.test/api/v1/profile'),'');
 expect(response.status).toBe(503);expect(await response.text()).not.toContain('private');
});
it('maps administrator for the UI and rejects unassigned selected roles',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>Response.json({userId:'text-id',roles:['administrator'],facultyId:null,permissions:[]})));
 expect(await readBackendUser('token','admin')).toMatchObject({userId:'text-id',role:'admin',studentNumber:null});
 expect(await readBackendUser('token','student')).toBeNull();
});
