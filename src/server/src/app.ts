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

// routes
import AuthRoute from './routes/AuthRoute.ts';
import { createAIRoute } from './routes/AIRoute.ts';

// callbacks
import errorHandler from './middleware/errorHandler.ts';
import { rootCallback } from './middleware/rootCallback.ts';
import { healthCallback } from './middleware/healthCallback.ts';
import { nonexistentRouteCallback } from './middleware/nonexistentRouteCallback.ts';

export interface AppOptions {
	llmClient?: LLMClient,        // tests pass a fake; production uses Gemini
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
	const aiController = new AIController(new AIService(llm));

	app.use('/api/auth', AuthRoute);
	app.use('/api/ai', createAIRoute(aiController, createRateLimiter(PROMPT_LIMIT, PROMPT_WINDOW_MS)));
	app.get('/', rootCallback);
	app.get('/health', healthCallback);
	app.use(nonexistentRouteCallback);
	app.use(errorHandler);

	return app;
}
