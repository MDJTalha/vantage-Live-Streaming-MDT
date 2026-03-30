# ============================================
# Quick Deploy Script for Vercel
# ============================================
# Run this from project root to deploy to Vercel
# ============================================

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel
echo "Logging in to Vercel..."
vercel login

# Navigate to web app directory
cd apps/web

# Link to Vercel project (first time only)
echo "Linking to Vercel project..."
vercel link --yes

# Deploy to production
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment complete! Check your Vercel dashboard for the URL."
