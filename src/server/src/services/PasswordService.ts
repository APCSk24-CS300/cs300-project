import bcrypt from 'bcrypt';
import type { PasswordCredentialStore } from '../repositories/AuthRepository.ts';

const SALT_ROUNDS = 10;

export interface PasswordChangeError {
	success: false;
	code: string;
	message: string;
	errors?: { field: string; code: string; message: string }[];
}

export interface PasswordChangeSuccess {
	success: true;
	message: string;
}

export type PasswordChangeBody = PasswordChangeError | PasswordChangeSuccess;

export interface PasswordChangeResult {
	statusCode: number;
	body: PasswordChangeBody;
}

export interface PasswordHasher {
	compare(plainText: string, hash: string): Promise<boolean>;
	hash(plainText: string, saltRounds: number): Promise<string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validationFailure(
	message: string,
	errors: { field: string; code: string; message: string }[]
): PasswordChangeResult {
	return {
		statusCode: 400,
		body: { success: false, code: 'VALIDATION_FAILED', message, errors }
	};
}

function currentPasswordIncorrect(): PasswordChangeResult {
	return {
		statusCode: 400,
		body: {
			success: false,
			code: 'CURRENT_PASSWORD_INCORRECT',
			message: 'Current password is incorrect',
			errors: [{
				field: 'currentPassword',
				code: 'INCORRECT',
				message: 'Current password is incorrect'
			}]
		}
	};
}

function isAtLeastEightCharacters(value: string): boolean {
	return Array.from(value).length >= 8;
}

export class PasswordService {
	private readonly credentials: PasswordCredentialStore;
	private readonly hasher: PasswordHasher;

	constructor(
		credentials: PasswordCredentialStore,
		hasher: PasswordHasher = bcrypt
	) {
		this.credentials = credentials;
		this.hasher = hasher;
	}

	async changePassword(userId: string, request: unknown): Promise<PasswordChangeResult> {
		if (!isRecord(request)) {
			return validationFailure('A password change object is required', [{
				field: 'body',
				code: 'INVALID',
				message: 'A JSON object is required'
			}]);
		}

		const unsupportedFields = Object.keys(request).filter(
			field => field !== 'currentPassword' && field !== 'newPassword'
		);
		if (unsupportedFields.length > 0) {
			return validationFailure(
				'Password change request is invalid',
				unsupportedFields.map(field => ({
					field,
					code: 'UNSUPPORTED_FIELD',
					message: 'This field is not allowed'
				}))
			);
		}

		const currentPassword = request.currentPassword;
		if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
			return validationFailure('Password change request is invalid', [{
				field: 'currentPassword',
				code: 'REQUIRED',
				message: 'Current password is required'
			}]);
		}

		const newPassword = request.newPassword;
		if (typeof newPassword !== 'string') {
			return validationFailure('Password change request is invalid', [{
				field: 'newPassword',
				code: 'REQUIRED',
				message: 'New password is required'
			}]);
		}
		if (!isAtLeastEightCharacters(newPassword)) {
			return validationFailure('Password change request is invalid', [{
				field: 'newPassword',
				code: 'MIN_LENGTH',
				message: 'New password must be at least 8 characters'
			}]);
		}

		try {
			const currentHash = await this.credentials.getUserPasswordHash(userId);
			if (!currentHash) {
				return {
					statusCode: 401,
					body: {
						success: false,
						code: 'UNAUTHENTICATED',
						message: 'Authentication is required or the account is unavailable'
					}
				};
			}

			if (!(await this.hasher.compare(currentPassword, currentHash))) {
				return currentPasswordIncorrect();
			}

			const newHash = await this.hasher.hash(newPassword, SALT_ROUNDS);
			const updated = await this.credentials.updateUserPasswordHash(
				userId,
				currentHash,
				newHash
			);
			if (!updated) {
				return currentPasswordIncorrect();
			}

			return {
				statusCode: 200,
				body: { success: true, message: 'Password changed successfully' }
			};
		} catch (error) {
			console.error(
				'Password change failed:',
				error instanceof Error ? error.name : 'UnknownError'
			);
			return {
				statusCode: 500,
				body: {
					success: false,
					code: 'INTERNAL_ERROR',
					message: 'Password could not be changed. Please try again.'
				}
			};
		}
	}
}
