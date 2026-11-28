"use client";
import { useEffect, useRef, useState } from 'react';
import { profileService } from '../services/profile.service';
import { getAvatarError } from '../validation/avatar.validation';

export function AvatarEditor({ avatarUrl, onSaved }: { avatarUrl: string | null; onSaved: (url: string | null) => void }) {
 const inputRef = useRef<HTMLInputElement>(null);
 const [file, setFile] = useState<File | null>(null);
 const [preview, setPreview] = useState<string | null>(null);
 const [busy, setBusy] = useState(false);
 const [confirmRemove, setConfirmRemove] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [message, setMessage] = useState<string | null>(null);
 useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
 async function upload() {
  if (!file || busy) return;
  setBusy(true); setError(null); setMessage(null);
  try { onSaved(await profileService.uploadAvatar(file)); setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = ''; setMessage('Profile picture updated.'); }
  catch { setError('Picture could not be saved. Your saved picture is unchanged. Please retry.'); }
  finally { setBusy(false); }
 }
 async function remove() {
  if (busy) return;
  setBusy(true); setError(null); setMessage(null);
  try { await profileService.removeAvatar(); onSaved(null); setFile(null); setPreview(null); setConfirmRemove(false); if (inputRef.current) inputRef.current.value = ''; setMessage('Profile picture removed.'); }
  catch { setError('Picture could not be removed. Please retry.'); }
  finally { setBusy(false); }
 }
 return <section aria-label="Manage profile picture" className="mt-6 grid gap-3">
  <label className="text-sm font-semibold" htmlFor="avatar-file">Choose profile picture</label>
  <input ref={inputRef} id="avatar-file" type="file" accept="image/jpeg,image/png" disabled={busy} onChange={(event) => {
   const selected = event.target.files?.[0]; setMessage(null); setError(null);
   if (!selected) { setFile(null); setPreview(null); return; }
   const validationError = getAvatarError(selected);
   if (validationError) { setError(validationError); setFile(null); setPreview(null); event.target.value = ''; return; }
   setFile(selected); setPreview(URL.createObjectURL(selected));
  }} />
  <p className="text-sm text-text-muted">JPG or PNG, up to 10 MB.</p>
  {preview && <>{/* Local selected-file preview. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src={preview} alt="New profile picture preview" className="size-20 rounded-full object-cover" />
   <button type="button" disabled={busy} onClick={upload} className="w-fit rounded-pill bg-primary px-5 py-2 text-white">{busy ? 'Saving…' : 'Save picture'}</button>
  </>}
  {avatarUrl && <button type="button" disabled={busy} onClick={() => setConfirmRemove(true)} className="w-fit rounded-pill border px-5 py-2">Remove picture</button>}
  {confirmRemove && <div><p>Remove your saved profile picture?</p><button type="button" disabled={busy} onClick={remove}>Confirm removal</button><button type="button" disabled={busy} onClick={() => setConfirmRemove(false)} className="ml-4">Cancel</button></div>}
  {error && <p role="alert" className="text-red-700">{error}</p>}
  {message && <p role="status" className="text-green-700">{message}</p>}
 </section>;
}
