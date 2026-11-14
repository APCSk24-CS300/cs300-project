import type { NextFunction, Request, Response } from "express";
import { ServiceResponse } from "../types/ServiceResponse.ts";
import AuthService from "../services/AuthService.ts";
import type { UserRegistrationData } from "../types/UserRegistrationData.ts";
import { generate400Response } from "../helper/generate400Response.ts";
import InMemoryAuthRepository from '../repositories/AuthRepository.ts';
import { generate409Response } from "../helper/generate409Response.ts";

// implement a function to check if a user with given email exists
// implement a function to check if a user with given phone number exists

class AuthController {
	async register(req: Request, res: Response, next: NextFunction): Promise<void> {
		const name: string = req.body.name;
		const email: string = req.body.email;
		const phone: string = req.body.phone;
		const password: string = req.body.password;
		const enrollmentYear: number = req.body.enrollmentYear;
		const majorFacultyID: number = req.body.majorFacultyID;

		if (!name) {
			const response: ServiceResponse = generate400Response(`Missing name parameter`);
			return void res.status(response.statusCode).json(response.get());
		}

		if (!email) {
			const response: ServiceResponse = generate400Response(`Missing email parameter`);
			return void res.status(response.statusCode).json(response.get());
		}

		if (!phone) {
			const response: ServiceResponse = generate400Response(`Missing phone parameter`);
			return void res.status(response.statusCode).json(response.get());
		}

		if (!password) {
			const response: ServiceResponse = generate400Response(`Missing password parameter`);
			return void res.status(response.statusCode).json(response.get());
		}

		const userEmailExists = await InMemoryAuthRepository.checkUserExistsWithEmail(email);
		if (userEmailExists) {
			const response: ServiceResponse = generate409Response('A user registered with that email already exists');
			return void res.status(response.statusCode).json(response.get());
		}

		const userPhoneExists = await InMemoryAuthRepository.checkUserExistsWithPhoneNumber(phone);
		if (userPhoneExists) {
			const response: ServiceResponse = generate409Response('A user registered with that phone number already exists');
			return void res.status(response.statusCode).json(response.get());
		}

		const userRegistrationData: UserRegistrationData = {
			full_name: name,
			email,
			phone_number: phone,
			role_id: 1,
			role_data: {
				major_id: '1',
				faculty_id: '11',
				enrollment_year: 2026,
			},
			password_plain_text: password,
			granted_by_user_id: '00000000',
			granted_at: new Date()
		};
		const response: ServiceResponse = await AuthService.register(userRegistrationData);
		return void res.status(response.statusCode)
		.location('/api/users/' + response.payload.data.userID)
		.json(response.get());
	}

	async login(req: Request, res: Response, next: NextFunction): Promise<void> {
		const email: string = req.body.email;
		const password: string = req.body.password;

		if (!email) {
			const response = generate400Response('Missing email parameter');
			return void res.status(response.statusCode).json(response.get());
		}

		if (!password) {
			const response = generate400Response('Missing password parameter');
			return void res.status(response.statusCode).json(response.get());
		}

		const response = await AuthService.login(email, password);
		return void res.status(response.statusCode).json(response.get());
	}
}

export default new AuthController();