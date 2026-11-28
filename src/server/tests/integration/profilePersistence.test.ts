import AuthRoute from '../../src/routes/AuthRoute.ts';
import DbConnection from '../../src/connections/db.ts';
import { api } from '../../../client/src/libs/api-client.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Pool } from 'pg';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../../src/config/config.ts';
import { ProfileRepository } from '../../src/repositories/ProfileRepository.ts';
import { AvatarRepository } from '../../src/repositories/AvatarRepository.ts';
import { ProfileService } from '../../src/services/ProfileService.ts';
import { AvatarService } from '../../src/services/AvatarService.ts';
import { AvatarFileStorage } from '../../src/services/AvatarFileStorage.ts';
import { AuthService } from '../../src/services/AuthService.ts';
import { ProfileController } from '../../src/controllers/ProfileController.ts';
import { PasswordController } from '../../src/controllers/PasswordController.ts';
import { createProfileRoute } from '../../src/routes/ProfileRoute.ts';
import { createAvatarRoute } from '../../src/routes/AvatarRoute.ts';
import { createSessionRoute } from '../../src/routes/SessionRoute.ts';
import { MAX_AVATAR_BYTES } from '../../src/helper/validateAvatar.ts';

const connectionString = process.env.PROFILE_TEST_DATABASE_URL;
function crc32(bytes: Buffer): number {
 let crc=0xffffffff;
 for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function pngAtExactLimit(png: Buffer): Buffer {
 const endChunkOffset=png.length-12;
 const payload=Buffer.alloc(MAX_AVATAR_BYTES-png.length-12,32);payload[0]=120;payload[1]=0;
 const chunk=Buffer.alloc(payload.length+12);chunk.writeUInt32BE(payload.length,0);Buffer.from('tEXt').copy(chunk,4);payload.copy(chunk,8);
 chunk.writeUInt32BE(crc32(chunk.subarray(4,chunk.length-4)),chunk.length-4);
 return Buffer.concat([png.subarray(0,endChunkOffset),chunk,png.subarray(endChunkOffset)]);
}
test('real schema: profile/password/avatar persistence, ownership, failures and concurrent updates', { skip: !connectionString }, async () => {
 const pool = new Pool({ connectionString });
 const previousPool = DbConnection.pool; DbConnection.pool = pool;
 const secret = 'profile-persistence-test-secret'; config.jwt.secret = secret;
 const app = express(); app.use(express.json());
 const repo = new ProfileRepository(pool);
 const phones = { async checkUserExistsWithPhoneNumber(phone: string, excluding: string) { return (await pool.query('SELECT 1 FROM "User" WHERE phone_number=$1 AND user_id<>$2', [phone, excluding])).rows.length > 0; } };
 const credentials = {
  async getUserPasswordHash(id: string) { return (await pool.query('SELECT password_hash FROM "User" WHERE user_id=$1 AND is_active IS NOT FALSE', [id])).rows[0]?.password_hash ?? null; },
  async updateUserPasswordHash(id: string, oldHash: string, newHash: string) { return (await pool.query('UPDATE "User" SET password_hash=$3 WHERE user_id=$1 AND password_hash=$2 RETURNING user_id', [id, oldHash, newHash])).rows.length > 0; }
 };
 const avatars = new AvatarRepository(pool);
 const avatarDirectory = await mkdtemp(path.join(os.tmpdir(), 'profile-avatar-integration-'));
 const avatarFiles = new AvatarFileStorage(avatarDirectory);
 app.use('/api/auth', createSessionRoute(pool));
 app.use('/api/auth', AuthRoute);
 app.use('/api/v1/profile/avatar', createAvatarRoute(new AvatarService(avatars, avatarFiles)));
 app.use('/api/v1/profile', createProfileRoute(new ProfileController(new ProfileService(repo, phones)), new PasswordController(new AuthService())));
 const server = app.listen(0, '127.0.0.1');
 await new Promise<void>(resolve => server.once('listening', resolve));
 const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
 const users = ['profile-test-student','profile-test-manager','profile-test-administrator'];
 const hash = await bcrypt.hash('old-password', 4);
 try {
  await pool.query(`INSERT INTO "Faculty" (faculty_id,code,name) VALUES ('profile-test-faculty','PROFILE_TEST','Test Faculty') ON CONFLICT DO NOTHING`);
  for (let i=0;i<users.length;i++) {
   await pool.query('INSERT INTO "Role" (role_id,code,name) VALUES ($1,$2,$2) ON CONFLICT DO NOTHING', [910+i, ['student','manager','administrator'][i]]);
   await pool.query('INSERT INTO "User" (user_id,email,password_hash,full_name,is_active) VALUES ($1,$2,$3,$1,true)', [users[i], `${users[i]}@test.edu`, hash]);
   await pool.query('INSERT INTO "UserRole" (user_id,role_id,granted_by_user_id,granted_at) SELECT $1,role_id,$1,now() FROM "Role" WHERE code=$2', [users[i], ['student','manager','administrator'][i]]);
  }
  await pool.query('INSERT INTO "Student" (user_id,faculty_id,enrollment_year) VALUES ($1,$2,2026)', [users[0], 'profile-test-faculty']);
  function headers(id: string) { return { Authorization: `Bearer ${jwt.sign({ sub: id }, secret)}` }; }
  async function patch(id: string, body: unknown, suffix='') { return fetch(`${base}/api/v1/profile${suffix}`, { method: 'PATCH', headers: { ...headers(id), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
  for (let i=0;i<users.length;i++) {
   const id=users[i];
   const session=await fetch(`${base}/api/auth/me`, { headers: headers(id) });
   assert.deepEqual((await session.json()).roles, [['student'],['manager'],['administrator']][i]);
   assert.equal((await patch(id,{phoneNumber:`090000000${i}`})).status,200);
   const read=await fetch(`${base}/api/v1/profile?userId=other`,{headers:headers(id)});
   const profile=(await read.json()).payload.data;
   assert.equal(profile.id,id); assert.equal(profile.phoneNumber,`090000000${i}`);
   assert.equal(profile.academicInfo?.studentNumber ?? null,i===0 ? id : null);
   assert.equal((await patch(id,{phoneNumber:'invalid'})).status,400);
   assert.equal((await patch(id,{phoneNumber:'0912345678',userId:users[(i+1)%3]})).status,400);
   assert.equal((await patch(id,{phoneNumber:'0912345678',fullName:'tamper'})).status,400);
  }
  const id=users[0];
  const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`${id}@test.edu`,password:'old-password'})});
  assert.equal(login.status,200); const loginToken=(await login.json()).payload.data.token;
  assert.equal(jwt.verify(loginToken,secret).sub,id);
  const nativeFetch=globalThis.fetch;
  // Browser-origin adapter only: the actual API client constructs method/body,
  // then native HTTP, JWT middleware, service and PostgreSQL execute unchanged.
  globalThis.fetch = (input, options) => nativeFetch(`${base}${String(input)}`, { ...options, headers: { ...Object.fromEntries(new Headers(options?.headers)), Authorization: `Bearer ${loginToken}` } });
  try {
   const saved=await api.patch<{payload:{data:{phoneNumber:string}}}>('/api/v1/profile',{phoneNumber:'0945678901'});
   assert.equal(saved.payload.data.phoneNumber,'0945678901');
   const reread=await api.get<{payload:{data:{phoneNumber:string}}}>('/api/v1/profile');
   assert.equal(reread.payload.data.phoneNumber,'0945678901');
  } finally { globalThis.fetch=nativeFetch; }

  assert.equal((await patch(id,{currentPassword:'wrong',newPassword:'secret'},'/password')).status,400);
  assert.equal((await patch(id,{currentPassword:'old-password',newPassword:'12345'},'/password')).status,400);
  assert.equal(await credentials.getUserPasswordHash(id),hash);
  assert.equal((await patch(id,{currentPassword:'old-password',newPassword:'secret'},'/password')).status,200);
  const changed=await credentials.getUserPasswordHash(id);
  assert.equal(await bcrypt.compare('old-password',changed),false); assert.equal(await bcrypt.compare('secret',changed),true);
  const overlap=await Promise.all([patch(id,{phoneNumber:'0923456789'}),patch(id,{phoneNumber:'0934567890'})]);
  assert.deepEqual(overlap.map(r=>r.status),[200,200]);
  for (const result of overlap) assert.ok(['0923456789','0934567890'].includes((await result.json()).payload.data.phoneNumber));
  assert.ok(['0923456789','0934567890'].includes((await repo.getProfileByUserId(id))!.phoneNumber!));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64');
  async function upload(bytes: Buffer, extra=false, authenticated=true) {
   const form=new FormData();form.append('avatar',new Blob([bytes],{type:'image/png'}),'picture.png'); if(extra)form.append('userId',users[1]);
   return fetch(`${base}/api/v1/profile/avatar`,{method:'POST',headers:authenticated?headers(id):{},body:form});
  }
  assert.equal((await upload(Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==','base64'))).status,200);
  const jpegUrl = (await repo.getProfileByUserId(id))!.avatarUrl!;
  assert.match(jpegUrl,/^\/api\/v1\/profile\/avatar\/files\/[0-9a-f-]+\.jpg$/);
  const jpegResponse = await fetch(`${base}${jpegUrl}`, { headers: headers(id) });
  assert.equal(jpegResponse.status,200);
  assert.equal(jpegResponse.headers.get('content-type'),'image/jpeg');
  assert.ok((await jpegResponse.arrayBuffer()).byteLength > 0);
  assert.equal((await upload(png)).status,200);
  const old=(await repo.getProfileByUserId(id))!.avatarUrl; assert.match(old!,/^\/api\/v1\/profile\/avatar\/files\/[0-9a-f-]+\.png$/);
  assert.equal((await repo.getProfileByUserId(users[1]))!.avatarUrl,null);
  assert.equal((await upload(Buffer.from('not a png'))).status,400);assert.equal((await repo.getProfileByUserId(id))!.avatarUrl,old);
  assert.equal((await upload(png,true)).status,400);assert.equal((await upload(png,false,false)).status,401);
  const exact=pngAtExactLimit(png);
  assert.equal((await upload(exact)).status,200);
  assert.equal((await upload(Buffer.alloc(MAX_AVATAR_BYTES+1))).status,400);
  const beforeFailure=(await repo.getProfileByUserId(id))!.avatarUrl;
  const phoneBeforeFailure=(await repo.getProfileByUserId(id))!.phoneNumber;
  await pool.query(`CREATE FUNCTION profile_test_reject_avatar() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'simulated storage failure'; END $$`);
  await pool.query(`CREATE TRIGGER profile_test_avatar_failure BEFORE UPDATE OF avatar_url ON "User" FOR EACH ROW EXECUTE FUNCTION profile_test_reject_avatar()`);
  assert.equal((await upload(png)).status,500);
  assert.equal((await fetch(`${base}/api/v1/profile/avatar`,{method:'DELETE',headers:headers(id)})).status,500);
  assert.equal((await repo.getProfileByUserId(id))!.avatarUrl,beforeFailure);
  assert.equal((await repo.getProfileByUserId(id))!.phoneNumber,phoneBeforeFailure);
  await pool.query('DROP TRIGGER profile_test_avatar_failure ON "User"'); await pool.query('DROP FUNCTION profile_test_reject_avatar()');
  assert.equal((await fetch(`${base}/api/v1/profile/avatar`,{method:'DELETE',headers:headers(id)})).status,200);
  assert.equal((await repo.getProfileByUserId(id))!.avatarUrl,null);
  assert.equal((await fetch(`${base}/api/v1/profile`)).status,401);
  await pool.query('UPDATE "User" SET is_active=false WHERE user_id=$1',[id]);
  assert.equal((await fetch(`${base}/api/auth/me`,{headers:headers(id)})).status,401);
  assert.equal(await repo.getProfileByUserId(id),null);
 } finally {
  await pool.query('DROP TRIGGER IF EXISTS profile_test_avatar_failure ON "User"');
  await pool.query('DROP FUNCTION IF EXISTS profile_test_reject_avatar()');
  await pool.query('DELETE FROM "Student" WHERE user_id=ANY($1)',[users]);
  await pool.query('DELETE FROM "UserRole" WHERE user_id=ANY($1)',[users]);
  await pool.query('DELETE FROM "User" WHERE user_id=ANY($1)',[users]);
  await pool.query('DELETE FROM "Faculty" WHERE faculty_id=$1',['profile-test-faculty']);
  await rm(avatarDirectory,{recursive:true,force:true});
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve())); await pool.end(); DbConnection.pool = previousPool;
 }
});
