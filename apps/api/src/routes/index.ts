import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';

// In api/src/index.ts, add after auth routes:

// OAuth routes (add after /api/v1/auth)
app.use('/api/v1/auth/oauth', oauthRoutes);
