import { generate200Response } from '../helper/generate200Response.ts';
import { generate400Response } from '../helper/generate400Response.ts';
import { generate404Response } from '../helper/generate404Response.ts';
import { generate409Response } from '../helper/generate409Response.ts';
import { generate503Response } from '../helper/generate503Response.ts';
import type { ProfileRepository } from '../repositories/ProfileRepository.ts';
import type { Profile } from '../types/Profile.ts';
import type { ServiceResponse } from '../types/ServiceResponse.ts';

type ProfileStore = Pick<ProfileRepository, 'getProfileByUserId' | 'updatePhoneNumber'>;

export interface PhoneNumberAvailability {
	checkUserExistsWithPhoneNumber(phoneNumber: string, excludingUserId: string): Promise<boolean>;
}

const PHONE_NUMBER_PATTERN = /^(?:0\d{9}|\+84\d{9})$/;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function equivalentPhoneNumber(phoneNumber: string): string {
	return phoneNumber.startsWith('+84')
		? `0${phoneNumber.slice(3)}`
		: `+84${phoneNumber.slice(1)}`;
}

function serviceUnavailable(error: unknown): ServiceResponse {
	console.error(
		'Profile service operation failed:',
		error instanceof Error ? error.name : 'UnknownError'
	);
	return generate503Response('Profile service is temporarily unavailable');
}

export class ProfileService {
	private readonly profiles: ProfileStore;
	private readonly phoneNumbers: PhoneNumberAvailability;

	constructor(profiles: ProfileStore, phoneNumbers: PhoneNumberAvailability) {
		this.profiles = profiles;
		this.phoneNumbers = phoneNumbers;
	}

	async getProfile(userId: string): Promise<ServiceResponse> {
		try {
			const profile = await this.profiles.getProfileByUserId(userId);
			return profile
				? generate200Response(profile)
				: generate404Response('Profile not found');
		} catch (error) {
			return serviceUnavailable(error);
		}
	}

	async updateProfile(userId: string, request: unknown): Promise<ServiceResponse> {
		if (!isObjectRecord(request)) {
			return generate400Response('A profile update object is required');
		}

		const unsupportedFields = Object.keys(request).filter(field => field !== 'phoneNumber');
		if (unsupportedFields.length > 0) {
			return generate400Response('Only phoneNumber may be updated', { fields: unsupportedFields });
		}

		if (!Object.prototype.hasOwnProperty.call(request, 'phoneNumber')) {
			return generate400Response('phoneNumber is required');
		}

		const phoneNumber = request.phoneNumber;
		if (phoneNumber !== null && (typeof phoneNumber !== 'string' || !PHONE_NUMBER_PATTERN.test(phoneNumber))) {
			return generate400Response(
				'Phone number must be 10 digits starting with 0 or +84 followed by 9 digits',
				{ field: 'phoneNumber' }
			);
		}

		try {
			const currentProfile = await this.profiles.getProfileByUserId(userId);
			if (!currentProfile) {
				return generate404Response('Profile not found');
			}

			if (phoneNumber !== null) {
				for (const candidate of [phoneNumber, equivalentPhoneNumber(phoneNumber)]) {
					if (await this.phoneNumbers.checkUserExistsWithPhoneNumber(candidate, userId)) {
						return generate409Response('Phone number is already in use', { field: 'phoneNumber' });
					}
				}
			}

			const updatedProfile = await this.profiles.updatePhoneNumber(userId, phoneNumber);
			return updatedProfile
				? generate200Response(updatedProfile)
				: generate404Response('Profile not found');
		} catch (error) {
			return serviceUnavailable(error);
		}
	}
}
