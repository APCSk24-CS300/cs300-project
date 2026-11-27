// DEV ONLY, temporary (specs/004-university-service-hub research R-01).
// The backend login does not yet issue tokens for users stored in the database, but the hub's
// permission checks read roles from the database by the token's `sub`. This prints a token for an
// existing "User".user_id so the frontend (api mode) and curl can call the API end to end.
// Remove once the Authentication functional group issues real tokens.
//
// Usage (from src/server, with JWT_SECRET in .env):
//   node scripts/mint-dev-token.ts <userId> [hours=8]
import 'dotenv/config';
import jwt from 'jsonwebtoken';

const [userId, hours = '8'] = process.argv.slice(2);

if (process.env.NODE_ENV === 'production') {
	console.error('Refusing to mint a dev token with NODE_ENV=production');
	process.exit(1);
}
if (!userId || !process.env.JWT_SECRET) {
	console.error('Usage: node scripts/mint-dev-token.ts <userId> [hours]   (needs JWT_SECRET)');
	process.exit(1);
}

console.log(jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: `${Number(hours) || 8}h` }));
