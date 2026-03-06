# BofferElo

A React Native / Expo app for tracking ELO ratings in boffer combat. Targets iOS, Android, and web.

## Local Development

```bash
npm install          # Install dependencies
npx expo start       # Start dev server (scan QR with Expo Go, or press w/a/i)
npm run web          # Start web version only
npm run lint         # Run ESLint
```

Copy `.env.example` to `.env` and fill in your values before starting:

```bash
cp .env.example .env
```

## Deploying the Web App to Google Cloud Run

The web version is containerized with Docker and served via nginx. Deployment is handled by Cloud Build using `cloudbuild.yaml`.

### Why substitution variables, not Variables & Secrets

Cloud Run's **Variables & Secrets** tab (and the environment variables UI) sets values at **runtime** — inside the already-running container. By that point, nginx is serving a pre-built static JavaScript bundle.

The `EXPO_PUBLIC_*` environment variables are handled differently: Expo's bundler **statically replaces** them in the JS source at **build time**. Once the bundle is built, no amount of runtime environment variables can change what's in it. Setting them in the Cloud Run UI has no effect on the app.

The correct approach is **Cloud Build substitution variables**, which are injected during the `docker build` step before the bundle is created.

### Setting up Cloud Build

1. Go to **Cloud Build → Triggers** in the Google Cloud Console.
2. Create a new trigger (or edit an existing one) pointing at this repository.
3. Set the **Cloud Build configuration file** to `cloudbuild.yaml`.
4. Scroll to **Substitution variables** and add the following:

| Variable | Description |
|---|---|
| `_SUPABASE_URL` | Your Supabase project URL, e.g. `https://xyz.supabase.co` |
| `_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable (anon) key |
| `_API_URL` | The FastAPI backend URL, e.g. `https://your-api.run.app` |
| `_SERVICE_NAME` | Cloud Run service name (default: `bofferelo-web`) |
| `_REGION` | Cloud Run region (default: `us-central1`) |

5. Save the trigger. On the next run, Cloud Build passes the substitution variables as `--build-arg` to Docker, baking them into the JS bundle at build time.

### Manual build and deploy

If you prefer to build and push manually:

```bash
docker build \
  --build-arg EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
  --build-arg EXPO_PUBLIC_API_URL=https://your-api.run.app \
  -t gcr.io/YOUR_PROJECT_ID/bofferelo-web .

docker push gcr.io/YOUR_PROJECT_ID/bofferelo-web

gcloud run deploy bofferelo-web \
  --image gcr.io/YOUR_PROJECT_ID/bofferelo-web \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

### Troubleshooting: blank page on load

If the deployed app shows a blank page, open the browser developer console. The most common cause is missing build-time env vars — you will see an error like:

```
Uncaught Error: Missing EXPO_PUBLIC_SUPABASE_URL environment variable
```

This means the substitution variables were not set in the Cloud Build trigger before the image was built. Set them and re-run the build.
