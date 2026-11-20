# Run "Online Code Runner" locally

This guide walks through getting the project from GitHub to a working local
development setup on Windows. The backend uses MongoDB, Redis, Google OAuth,
and Docker to run submitted JavaScript code.

## 1. Install the prerequisites

Install these tools before continuing:

- [Git for Windows](https://git-scm.com/download/win)
- [Node.js 22 LTS](https://nodejs.org/) and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) configured
  to use Linux containers
- A MongoDB database, such as a free [MongoDB Atlas](https://www.mongodb.com/atlas)
  cluster
- A Google account and access to the
  [Google Cloud Console](https://console.cloud.google.com/) for OAuth credentials

Start Docker Desktop and wait for its engine to finish starting. You can check
that Git, Node.js, npm, and Docker are available in PowerShell:

```powershell
git --version
node --version
npm --version
docker info
```

Use Node.js 22 LTS. If `docker info` cannot connect to the Docker engine, start
or repair Docker Desktop before continuing.

## 2. Download or fork the repository

To clone the original repository:

```powershell
git clone https://github.com/aniboe/online-code-runner.git
Set-Location .\online-code-runner
```

To work from your own copy, first fork the repository on GitHub, then clone
your fork instead:

```powershell
git clone https://github.com/<your-github-username>/online-code-runner.git
Set-Location .\online-code-runner
```

If you downloaded a ZIP instead, extract it and open PowerShell in the
extracted `online-code-runner` folder.

## 3. Create the local environment files

From the repository root, copy the example files:

```powershell
Copy-Item .\backend\sample.env .\backend\.env
Copy-Item .\frontend\sample.env .\frontend\.env
```

Open `backend\.env` and replace the example values:

| Variable | Value |
| --- | --- |
| `PORT` | Keep `4000`; the frontend and OAuth callback below use this port. |
| `MONGODB_URI` | Your MongoDB connection URI, including a database name such as `compiler`. |
| `JWT_SECRET` | A new, long, random secret. Do not reuse the example value. |
| `FRONTEND_URL` | Keep `http://localhost:5173` for the local Vite frontend. |
| `REDIS_HOST` | Keep `localhost` when using the Redis service in step 5. |
| `REDIS_PORT` | Keep `6379` when using the Redis service in step 5. |
| `REDIS_PASSWORD` | Leave empty for the included local Docker Compose Redis service. |
| `CLIENT_ID` | The Google OAuth 2.0 client ID you create in step 4. |
| `CLIENT_SECRET` | The matching Google OAuth 2.0 client secret. |
| `REDIRECT_URI` | Keep `http://localhost:4000/api/v1/auth/callback`. |

For a MongoDB Atlas database:

1. Create a database user and allow your current IP in the cluster's Network
   Access settings.
2. Copy the cluster connection URI and replace its username, password, and
   host. Include a database name, for example:

   ```text
   mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/compiler?retryWrites=true&w=majority
   ```

3. URL-encode any special characters in the database password before putting
   it in the URI.

Generate a fresh JWT secret from PowerShell with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value after `JWT_SECRET=` in `backend\.env`.

The frontend sample file already points to the local backend. Keep these
values in `frontend\.env` for this setup:

```dotenv
VITE_BACKEND_URI=http://localhost:4000
VITE_WS_BACKEND_URI=ws://localhost:4000
```

Environment files contain secrets and are ignored by Git. Never commit or share
`backend\.env` or `frontend\.env`; only put placeholder values in sample files.

## 4. Configure Google sign-in

The app uses Google OAuth to register and log in. In Google Cloud Console:

1. Create or select a project and configure the OAuth consent screen. If the
   app is in testing mode, add the Google account you will use as a test user.
2. Create an OAuth client ID with application type **Web application**.
3. Add this authorized JavaScript origin:

   ```text
   http://localhost:5173
   ```

4. Add this authorized redirect URI:

   ```text
   http://localhost:4000/api/v1/auth/callback
   ```

5. Copy the client ID and client secret into `CLIENT_ID` and `CLIENT_SECRET`
   in `backend\.env`.

The redirect URI in Google Cloud, `REDIRECT_URI` in `backend\.env`, and the
backend port must match exactly.

## 5. Install dependencies and start Redis

Install the backend dependencies:

```powershell
Set-Location .\backend
npm ci
```

Start the local Redis service using the included Compose file:

```powershell
docker compose up -d redis
docker compose ps
```

Redis is not password-protected in this local Compose configuration, so keep
`REDIS_PASSWORD` empty. If you use a separate Redis service, set the host,
port, and password in `backend\.env` to match that service.

## 6. Build the code-execution image

The backend runs submitted JavaScript inside a Docker container. Build the image
it expects from the repository root:

```powershell
Set-Location ..
docker build -t dir-exe -f .\backend\Dockerfile.executer .\backend
```

The image name must be `dir-exe`, as that is the name used by the execution
worker. Docker must remain running while you use the app.

## 7. Start the backend and frontend

Open two PowerShell terminals at the repository root.

In the first terminal, start the backend:

```powershell
Set-Location .\backend
npm run dev
```

Wait for the MongoDB connection and server startup messages. The backend
defaults to port `3000` if `PORT` is missing, but this guide configures port
`4000` to match the frontend and Google OAuth settings.

In the second terminal, start the frontend:

```powershell
Set-Location .\frontend
npm ci
npm run dev
```

Open the local URL printed by Vite, normally
[http://localhost:5173](http://localhost:5173), and sign in with the Google
account configured as an OAuth test user if the app is in testing mode.

Keep both terminal processes and Docker Desktop running while using the app.
The backend starts its Redis queue worker, and the worker uses Docker to run
code in containers with resource limits and networking disabled.

## Troubleshooting

- **MongoDB connection fails:** Check `MONGODB_URI`, the database user's
  password (including URL encoding), and the cluster's Network Access rules.
- **Google sign-in reports a redirect error:** Make sure the Google Cloud
  redirect URI is exactly `http://localhost:4000/api/v1/auth/callback` and
  that `PORT=4000` and `REDIRECT_URI` match.
- **Redis connection errors:** Confirm Docker Desktop is running and
  `docker compose ps` shows Redis as running. Check `REDIS_HOST=localhost`,
  `REDIS_PORT=6379`, and that `REDIS_PASSWORD` is empty for the included
  Compose service.
- **Code execution fails:** Confirm Docker is running and the `dir-exe` image
  exists by running `docker image ls dir-exe`.
- **Frontend cannot connect:** Confirm both servers are running and that
  `frontend\.env` points to `http://localhost:4000` and `ws://localhost:4000`.
- **A port is already in use:** Stop the other process using the port, or
  change the port and update all corresponding frontend and OAuth settings.

Do not expose this development setup directly to the public internet. The
backend controls Docker to execute code; deploying it safely requires
additional isolation and production configuration.
