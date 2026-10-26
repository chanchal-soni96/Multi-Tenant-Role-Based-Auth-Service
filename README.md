# Auth-Security API

A backend authentication and authorization project built with Node.js, Express, PostgreSQL, Redis, and JWT. It demonstrates password hashing, protected routes, role-based access control, refresh-token rotation, and API security practices.

## Features

- User registration and login
- Secure password hashing with Argon2
- JWT access and refresh tokens
- HttpOnly authentication cookies
- Refresh-token rotation and reuse detection
- Logout and refresh-session revocation
- Role-based access control (RBAC)
- Protected user and admin routes
- Tenant-record access controls
- Redis-based login rate limiting
- Input validation and request-size limits
- Parameterized SQL queries
- Helmet security headers
- CORS configuration
- Centralized error handling

## Technology Stack

- Node.js
- Express.js
- PostgreSQL
- Redis
- JSON Web Tokens (JWT)
- Argon2
- Postman

## Project Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Auth-Security
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and update the values for your local environment.

Never commit `.env` or real credentials to GitHub.

### 4. Start PostgreSQL and Redis

Ensure PostgreSQL is running and the database configured in your environment variables exists.

Start Redis in WSL Ubuntu if that is where it is installed:

```bash
sudo service redis-server start
redis-cli ping
```

Redis should respond with `PONG`.

### 5. Start the API

```bash
node server.js
```

The default API address is:

`http://localhost:5000`

### 6. Verify the server

```http
GET /api/health
```

Expected response: HTTP `200 OK`.

## API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get authenticated user |
| GET | `/api/auth/admin` | Admin-only endpoint |
| GET | `/api/auth/records/:id` | Access a protected tenant record |

## Authentication

The API uses JWT access and refresh tokens stored in HttpOnly cookies. The access token is short-lived, while the refresh token supports session renewal.

Refresh tokens are rotated when used. Reuse of an invalidated refresh token can trigger revocation of the associated token family.

## Security Notes

- Passwords are hashed rather than stored in plaintext.
- SQL queries use parameterized statements.
- Login attempts are rate-limited using Redis.
- Request bodies are size-limited.
- Security headers are configured with Helmet.
- CORS is restricted to the configured frontend origin.
- Production deployments must use HTTPS and secure cookies.
- Environment secrets must be generated securely and stored outside source control.

## Testing

Use Postman to test registration, login, invalid credentials, protected routes, role authorization, refresh-token rotation, token reuse detection, logout, rate limiting, malformed JSON, and request-size limits.

Record actual test outcomes before claiming that all tests pass.

## Limitations and Future Improvements

- Automated integration tests
- Deployment with HTTPS
- Additional audit logging and monitoring
- Further security review of tenant isolation and token revocation behavior

## License

Choose and add a license before distributing the project publicly.
