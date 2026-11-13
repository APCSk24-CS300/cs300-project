import { generate201Response } from "../helper/generate201Response.ts";
import { generate500Response } from "../helper/generate500Response.ts";
import { ServiceResponse } from "../types/ServiceResponse.ts";
import InMemoryAuthRepository from "../repositories/AuthRepository.ts";
import type { UserRegistrationData, User } from "../types/UserRegistrationData.ts";
import bcrypt from 'bcrypt';

const SALT_ROUNDS: number = 10;

function constructUserID(createdAt: Date, majorFacultyID: number, discriminator: number) {
	const year = createdAt.getFullYear() % 100;
	return year * 1000000 + majorFacultyID * 1000 + discriminator;
}

class AuthService {
	public async register(data: UserRegistrationData): Promise<ServiceResponse> {
		const discriminator: number = InMemoryAuthRepository.getStudentDiscriminator(data.createdAt.getFullYear(), data.majorFacultyID);
		const userID: number = constructUserID(data.createdAt, data.majorFacultyID, discriminator);
		const passwordHash: string = await bcrypt.hash(data.passwordPlainText, SALT_ROUNDS);

		try {
			const user: User = {
				userID: userID.toString(),
				data: data,
				passwordHash: passwordHash,
				userStatus: await InMemoryAuthRepository.getActiveUserID(),
				userRole: await InMemoryAuthRepository.getStudentUserID()
			};

			InMemoryAuthRepository.insertUser(user)

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

const authService = new AuthService();
export default authService