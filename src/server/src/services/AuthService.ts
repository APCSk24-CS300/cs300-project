import { generate201Response } from "../helper/generate201Response.ts";
import { generate500Response } from "../helper/generate500Response.ts";
import { ServiceResponse } from "../types/ServiceResponse.ts";
import InMemoryAuthRepository from "../repositories/AuthRepository.ts";
import type { UserRegistrationData, User } from "../types/UserRegistrationData.ts";
import bcrypt from 'bcrypt';
import { generate404Response } from "../helper/generate404Response.ts";
import { generate401Response } from "../helper/generate401Response.ts";
import jwt from "jsonwebtoken";
import config from "../config/config.ts";
import { generate200Response } from "../helper/generate200Response.ts";
import type { PasswordCredentialStore } from "../repositories/AuthRepository.ts";

const SALT_ROUNDS: number = 10;

export interface PasswordHasher {
	compare(plainText: string, hash: string): Promise<boolean>;
	hash(plainText: string, saltRounds: number): Promise<string>;
}

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

function constructUserID(createdAt: Date, majorFacultyID: number, discriminator: number) {
	const year = createdAt.getFullYear() % 100;
	return year * 1000000 + majorFacultyID * 1000 + discriminator;
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

export class AuthService {
	private readonly credentials: PasswordCredentialStore;
	private readonly hasher: PasswordHasher;

	constructor(
		credentials: PasswordCredentialStore = InMemoryAuthRepository,
		hasher: PasswordHasher = bcrypt
	) {
		this.credentials = credentials;
		this.hasher = hasher;
	}

	public async register(data: UserRegistrationData): Promise<ServiceResponse> {
		const discriminator: number = 1;
		const userID: number = constructUserID(data.granted_at, Number(`${data.role_data.faculty_id}${data.role_data.major_id}`), discriminator);
		const passwordHash: string = await bcrypt.hash(data.password_plain_text, SALT_ROUNDS);

		try {
			const user: User = {
				user_id: userID.toString(),
				is_active: true,
				data: data,
				password_hash: passwordHash,
				created_at: data.granted_at
			};

			await InMemoryAuthRepository.insertUser(user);

			const responseData = {
				userID: userID
			}
			const response = generate201Response(responseData);
			return response;
		} catch (err) {
			console.error(err);
			return generate500Response();
		}
	}

	// need function get user id from email and function to get name from user id
	public async login(email: string, password: string): Promise<ServiceResponse> {
		const emailExists = await InMemoryAuthRepository.checkUserExistsWithEmail(email);
		if (!emailExists) {
			const response = generate404Response('Email not found');
			return response;
		}

		const userID = await InMemoryAuthRepository.getUserFromEmail(email);
		const passwordHash = await InMemoryAuthRepository.getUserPasswordHash(userID);
		if (!passwordHash) {
			return generate404Response('Email not found');
		}
		const passwordMatch = await bcrypt.compare(password, passwordHash);
		if (!passwordMatch) {
			const response = generate401Response('Wrong password');
			return response;
		}

		try {
			const sessionToken = jwt.sign({
				sub: userID,	
				name: await InMemoryAuthRepository.getName(userID)
			}, config.jwt.secret, { expiresIn: "1h" });

			const response = generate200Response({
				userID,
				token: sessionToken
			});
			return response;
		} catch (err) {
			console.error(err);
			const response = generate500Response();
			return response;
		}
	}

	public async changePassword(userId: string, request: unknown): Promise<PasswordChangeResult> {
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
		if (Array.from(newPassword).length < 8) {
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

const authService = new AuthService();
export default authService