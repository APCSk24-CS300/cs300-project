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

const SALT_ROUNDS: number = 10;

function constructUserID(createdAt: Date, majorFacultyID: number, discriminator: number) {
	const year = createdAt.getFullYear() % 100;
	return year * 1000000 + majorFacultyID * 1000 + discriminator;
}

class AuthService {
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
}

const authService = new AuthService();
export default authService