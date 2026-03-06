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

Secrets are stored in **Google Cloud Secret Manager** and fetched by Cloud Build at build time. This is more reliable and secure than trigger substitution variables, which do not consistently propagate into the Docker build context.

#### Step 1 — Create the secrets

Run these commands once in Cloud Shell or with the gcloud CLI (replace the values with your real credentials):

```bash
echo -n "https://your-project.supabase.co" | gcloud secrets create bofferelo-supabase-url --data-file=-
echo -n "sb_publishable_your_key_here"      | gcloud secrets create bofferelo-supabase-key --data-file=-
echo -n "https://your-api.run.app"          | gcloud secrets create bofferelo-api-url --data-file=-
```

#### Step 2 — Grant Cloud Build access to the secrets

Find your Cloud Build service account (it looks like `PROJECT_NUMBER@cloudbuild.gserviceaccount.com`) and grant it the Secret Manager Secret Accessor role:

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

for SECRET in bofferelo-supabase-url bofferelo-supabase-key bofferelo-api-url; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

#### Step 3 — Create the Cloud Build trigger

1. Go to **Cloud Build → Triggers → Create Trigger**
2. Point it at this repository and set branch to `main`
3. Set the **Cloud Build configuration file** to `cloudbuild.yaml`
4. The only substitution variables you need are the optional defaults already in the yaml:

| Variable | Default | Description |
|---|---|---|
| `_SERVICE_NAME` | `bofferelo-web` | Cloud Run service name |
| `_REGION` | `us-central1` | Cloud Run region |

5. Save. Cloud Build will now fetch the three secrets directly from Secret Manager on each build.

#### Why not substitution variables?

Trigger substitution variables are available to Cloud Build steps as shell variables, but they do **not** reliably propagate into `docker build --build-arg` when the Docker build runs in its own process. Secret Manager secrets are injected directly into the build step's environment by Cloud Build itself, making them consistently available inside the Docker build.

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
