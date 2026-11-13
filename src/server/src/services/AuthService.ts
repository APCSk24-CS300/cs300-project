import { generate201Response } from "../helper/generate201Response.ts";
import { generate500Response } from "../helper/generate500Response.ts";
import { ServiceResponse } from "../types/ServiceResponse.ts";
import { InMemoryUserRepository } from "../repositories/AuthRepository.ts";
import type { UserRegistrationData } from "../types/UserRegistrationData.ts";
import bcrypt from 'bcrypt';

const SALT_ROUNDS: number = 10;

// implement a function constructUserID() to construct the user id from faculty and majors

// repository functions:
// implement a function to get the active user ID
// implement a function to get student user ID
// implement a function to get activity manager user ID
// implement a function to get admin user ID
// implement a function to insert user
// implement a function to check if a user exists given their user ID
// implement a function to get their password hash
// implement a function to get a list of refresh token hashes given user ID
// implement a function to insert a refresh token hash - user ID pair

export class AuthService {
	public async register(data: UserRegistrationData): Promise<ServiceResponse> {
		// uncomment when constructUserID() is implemented
		const userID: string = await constructUserID();
		const passwordHash: string = await bcrypt.hash(data.passwordPlainText, SALT_ROUNDS);

		try {
			const user: User = {
				userID: userID,
				data: data,
				passwordHash: passwordHash,
				userStatus: InMemoryUserRepository.getActiveUserID(),
				userRole: InMemoryUserRepository.getStudentUserID()
			};

			InMemoryUserRepository.insertUser(user)

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
}