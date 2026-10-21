import type { Request, Response, NextFunction } from 'express'
import { ServiceResponse } from '../types/ServiceResponse.ts'
import { checkServer } from '../helper/serverCheckHelper.ts'
import { checkDatabase } from '../helper/databaseCheckHelper.ts'
import { generate200Response } from '../helper/generate200Response.ts'

export const healthCallback = async (req: Request, res: Response, next: NextFunction) => {

    // check server and database
    const checks = {
        server: checkServer(),
        database: await checkDatabase()
    };

    let response : ServiceResponse = new ServiceResponse;

    // Are BOTH server AND database healthy (not down)?
    const bothHealthy = Object.values(checks).every(check => check.up !== false);
    if (bothHealthy) {
        const data = {
            status : 'healthy',
            checks: checks
        };
        response = generate200Response(data);
    }

    else {
        // TODO: Refactor this to get503Response() function later
        const data = {
            status : 'degraded',
            checks: checks
        };
        response.success = false;
        response.statusCode = 503;
        response.payload = {
            message: "Service is over, gng!",
            data: data
        };
    }

    return void res.status(response.statusCode).json(response.get());
}
