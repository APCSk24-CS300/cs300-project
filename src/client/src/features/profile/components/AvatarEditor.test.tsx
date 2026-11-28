import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AvatarEditor } from './AvatarEditor';
import { profileService } from '../services/profile.service';
vi.mock('../services/profile.service', () => ({ profileService: { uploadAvatar: vi.fn(), removeAvatar: vi.fn() } }));
beforeEach(() => {
 vi.mocked(profileService.uploadAvatar).mockReset(); vi.mocked(profileService.removeAvatar).mockReset();
 URL.createObjectURL = vi.fn(() => 'blob:preview'); URL.revokeObjectURL = vi.fn();
});
it('previews and saves a picture only after upload succeeds', async () => {
 const saved = vi.fn(); vi.mocked(profileService.uploadAvatar).mockResolvedValue('/api/v1/profile/avatar/files/new.png');
 render(<AvatarEditor avatarUrl="old" onSaved={saved} />);
 fireEvent.change(screen.getByLabelText('Choose profile picture'), { target: { files: [new File(['image'], 'test.png', { type: 'image/png' })] } });
 expect(await screen.findByAltText('New profile picture preview')).toBeInTheDocument();
 fireEvent.click(screen.getByText('Save picture'));
 await waitFor(() => expect(saved).toHaveBeenCalledWith('/api/v1/profile/avatar/files/new.png'));
 expect(screen.getByRole('status')).toHaveTextContent('updated');
});
it('rejects unsupported input and preserves the saved image on upload failure', async () => {
 const saved = vi.fn(); vi.mocked(profileService.uploadAvatar).mockRejectedValue(new Error('storage failed'));
 render(<AvatarEditor avatarUrl="old" onSaved={saved} />);
 const input = screen.getByLabelText('Choose profile picture');
 fireEvent.change(input, { target: { files: [new File(['gif'], 'x.gif', { type: 'image/gif' })] } });
 expect(screen.getByRole('alert')).toHaveTextContent('JPG or PNG');
 expect(profileService.uploadAvatar).not.toHaveBeenCalled();
 fireEvent.change(input, { target: { files: [new File(['image'], 'x.png', { type: 'image/png' })] } });
 fireEvent.click(await screen.findByText('Save picture'));
 expect(await screen.findByRole('alert')).toHaveTextContent('unchanged'); expect(saved).not.toHaveBeenCalled();
});
it('confirms removal and restores the default only after success', async () => {
 const saved = vi.fn(); vi.mocked(profileService.removeAvatar).mockResolvedValue();
 render(<AvatarEditor avatarUrl="old" onSaved={saved} />);
 fireEvent.click(screen.getByText('Remove picture')); expect(profileService.removeAvatar).not.toHaveBeenCalled();
 fireEvent.click(screen.getByText('Confirm removal'));
 await waitFor(() => expect(saved).toHaveBeenCalledWith(null));
});
it('preserves the saved picture on removal failure', async () => {
 const saved = vi.fn(); vi.mocked(profileService.removeAvatar).mockRejectedValue(new Error('failed'));
 render(<AvatarEditor avatarUrl="old" onSaved={saved} />);
 fireEvent.click(screen.getByText('Remove picture')); fireEvent.click(screen.getByText('Confirm removal'));
 expect(await screen.findByRole('alert')).toHaveTextContent('retry'); expect(saved).not.toHaveBeenCalled();
});
it('keeps the selected file for retry after storage failure, then updates only on success', async () => {
 const saved = vi.fn();
 vi.mocked(profileService.uploadAvatar).mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValueOnce('/api/v1/profile/avatar/files/retried.png');
 render(<AvatarEditor avatarUrl="old" onSaved={saved} />);
 fireEvent.change(screen.getByLabelText('Choose profile picture'), { target: { files: [new File(['image'], 'retry.png', { type: 'image/png' })] } });
 fireEvent.click(await screen.findByText('Save picture'));
 expect(await screen.findByRole('alert')).toHaveTextContent('unchanged');
 expect(saved).not.toHaveBeenCalled();
 fireEvent.click(screen.getByText('Save picture'));
 await waitFor(() => expect(saved).toHaveBeenCalledWith('/api/v1/profile/avatar/files/retried.png'));
 expect(profileService.uploadAvatar).toHaveBeenCalledTimes(2);
});
