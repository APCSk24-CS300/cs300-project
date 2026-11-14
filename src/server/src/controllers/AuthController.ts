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
	/**
	 * Handler for <code>/api/auth/register</code>. Creates a new student account and returns the new user's ID, with a <code>Location</code> header pointing to <code>/api/users/{userID}</code>. The password is never stored; only its bcrypt hash is. Does not require an access token. Supports <code>POST</code> requests.
	 * @param {Request} req - Express request. The JSON body is <code>{ "name": string, "email": string, "phone": string, "password": string, "enrollmentYear"?: number, "majorID"?: number, "facultyID"?: number }</code>. <code>name</code>, <code>email</code>, <code>phone</code> and <code>password</code> are required and must not be empty; they are checked in that order. <code>email</code> and <code>phone</code> must not belong to an existing user.
	 * @param {Response} res - Express response.
	 * @param {NextFunction} next - Express next function.
	 * @returns {Promise<void>}
	 *
	 * @example <caption>cURL</caption>
	 * curl -X POST \
	 * --header 'Content-Type:application/json' \
	 * --data '{"name": "Nguyen Van A", "email": "nva@student.hcmus.edu.vn", "phone": "0901234567", "password": "correct-horse-battery", "enrollmentYear": 2024, "majorID": 1, "facultyID": 2}' \
	 * http://localhost:8080/api/auth/register
	 *
	 * @example <caption>Response (201 Created)</caption>
	 * Location: /api/users/24001005
	 *
	 * {
	 *   "success": true,
	 *   "statusCode": 201,
	 *   "payload": {
	 *     "message": "OK (CREATED)",
	 *     "data": {
	 *       "userID": 24001005
	 *     }
	 *   }
	 * }
	 *
	 * @example <caption>Response (400 Bad Request, missing field)</caption>
	 * {
	 *   "success": false,
	 *   "statusCode": 400,
	 *   "payload": {
	 *     "message": "Missing email parameter (BAD_REQUEST)"
	 *   }
	 * }
	 *
	 * @example <caption>Response (409 Conflict, email already used)</caption>
	 * {
	 *   "success": false,
	 *   "statusCode": 409,
	 *   "payload": {
	 *     "message": "A user registered with that email already exists (CONFLICT)"
	 *   }
	 * }
	 *
	 * @response
	 * - `201 CREATED` - The user was created; `payload.data.userID` is the new ID and the `Location` header is `/api/users/{userID}`
	 * - `400 BAD_REQUEST` - `name`, `email`, `phone` or `password` is missing or empty; the message names the first missing field, e.g. `Missing name parameter`
	 * - `405 METHOD_NOT_ALLOWED` - The endpoint does not support the HTTP method specified; see the `Allow` header
	 * - `409 CONFLICT` - The email (`A user registered with that email already exists`) or phone number (`A user registered with that phone number already exists`) is already registered; email is checked first
	 * - `415 UNSUPPORTED_MEDIA_TYPE` - Content-Type is not exactly `application/json`
	 * - `500 INTERNAL_SERVER_ERROR` - The user could not be saved, or the body is not valid JSON
	 */
	async register(req: Request, res: Response, next: NextFunction): Promise<void> {
		const name: string = req.body.name;
		const email: string = req.body.email;
		const phone: string = req.body.phone;
		const password: string = req.body.password;
		const enrollmentYear: number = req.body.enrollmentYear;
		const majorID: number = req.body.majorID;
		const facultyID: number = req.body.facultyID;

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
			name,
			email,
			phone,
			passwordPlainText: password,
			enrollmentYear,
			majorID,
			facultyID,
			createdAt: new Date()
		};
		const response: ServiceResponse = await AuthService.register(userRegistrationData);
		return void res.status(response.statusCode)
		.location('/api/users/' + response.payload.data.userID)
		.json(response.get());
	}
}

export default new AuthController();