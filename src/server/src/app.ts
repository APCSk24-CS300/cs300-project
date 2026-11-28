import { createSessionRoute } from './routes/SessionRoute.ts';
import { createAvatarRoute } from './routes/AvatarRoute.ts';
import { AvatarService } from './services/AvatarService.ts';
import { AvatarFileStorage } from './services/AvatarFileStorage.ts';
import { AvatarRepository } from './repositories/AvatarRepository.ts';
// libs
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';

// modules
import config from './config/config.ts';
import { GeminiClient } from './clients/GeminiClient.ts';
import type { LLMClient } from './clients/LLMClient.ts';
import { AIService } from './services/AIService.ts';
import { AIController } from './controllers/AIController.ts';
import { createRateLimiter } from './middleware/RateLimitMiddleware.ts';
import { createLoadIdentity } from './middleware/LoadIdentity.ts';
import { createRequirePermission } from './middleware/RequirePermission.ts';
import { AIGateway } from './ai/AIGateway.ts';
import { AISettings } from './ai/settings/AISettings.ts';
import type { SettingsSource } from './repositories/AiSettingsRepository.ts';
import { UsageLogger } from './ai/logging/UsageLogger.ts';
import type { IdentityStore } from './repositories/IdentityRepository.ts';
import { IdentityRepository } from './repositories/IdentityRepository.ts';
import { AiSettingsRepository } from './repositories/AiSettingsRepository.ts';
import { AiRequestLogRepository } from './repositories/AiRequestLogRepository.ts';
import type { RequestLogStore } from './repositories/AiRequestLogRepository.ts';
import { ProfileRepository } from './repositories/ProfileRepository.ts';
import InMemoryAuthRepository from './repositories/AuthRepository.ts';
import AuthService from './services/AuthService.ts';
import { ProfileService } from './services/ProfileService.ts';
import { ProfileController } from './controllers/ProfileController.ts';
import { PasswordController } from './controllers/PasswordController.ts';
import DbConnection from './connections/db.ts';
import { getAiPool } from './connections/aiDb.ts';

// routes
import AuthRoute from './routes/AuthRoute.ts';
import { createAIRoute } from './routes/AIRoute.ts';
import { createProfileRoute } from './routes/ProfileRoute.ts';

// callbacks
import errorHandler from './middleware/errorHandler.ts';
import { rootCallback } from './middleware/rootCallback.ts';
import { healthCallback } from './middleware/healthCallback.ts';
import { nonexistentRouteCallback } from './middleware/nonexistentRouteCallback.ts';

export interface AppOptions {
	llmClient?: LLMClient,        // tests pass a fake; production uses Gemini
	identityStore?: IdentityStore,       // tests pass fakes for these three;
	settingsSource?: SettingsSource,     // production reads PostgreSQL
	requestLogStore?: RequestLogStore,
	quiet?: boolean               // tests turn off request logging
}

// 10 prompts per user per minute (spec FR-011)
const PROMPT_LIMIT = 10;
const PROMPT_WINDOW_MS = 60_000;

/** Builds the Express app without starting it, so tests can start it on any port. */
export function createApp(options: AppOptions = {}) {
	const app = express();
	app.use(bodyParser.json());
	if (!options.quiet) app.use(morgan('dev'));

	const llm = options.llmClient ?? new GeminiClient(config.gemini);
	const identityStore = options.identityStore ?? new IdentityRepository(DbConnection.pool);
	const gateway = new AIGateway({
		llm,
		settings: new AISettings(options.settingsSource ?? new AiSettingsRepository(getAiPool())),
		logger: new UsageLogger(options.requestLogStore ?? new AiRequestLogRepository(getAiPool()))
	});
	const aiController = new AIController(new AIService(gateway));
	const profileController = new ProfileController(new ProfileService(
		new ProfileRepository(DbConnection.pool),
		InMemoryAuthRepository
	));
	const passwordController = new PasswordController(
		AuthService
	);

	app.use('/api/auth', createSessionRoute(DbConnection.pool));
	app.use('/api/auth', AuthRoute);
	app.use('/api/ai', createAIRoute(aiController, {
		rateLimit: createRateLimiter(PROMPT_LIMIT, PROMPT_WINDOW_MS),
		loadIdentity: createLoadIdentity(identityStore),
		requirePermission: createRequirePermission(identityStore)
	}));
	app.use('/api/v1/profile/avatar', createAvatarRoute(new AvatarService(
		new AvatarRepository(DbConnection.pool),
		new AvatarFileStorage()
	)));
	app.use('/api/v1/profile', createProfileRoute(profileController, passwordController));
	app.get('/', rootCallback);
	app.get('/health', healthCallback);
	app.use(nonexistentRouteCallback);
	app.use(errorHandler);

	return app;
}
