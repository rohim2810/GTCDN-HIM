<div align="center">
  <h1>GTCDN Server</h1>
  <p>Self-hosted CDN dashboard for Growtopia private server cache files.</p>
</div>

## Overview

GTCDN Server is a Next.js admin panel for managing cache files on your own CDN stack.
It provides a simple web interface for authentication, file browsing, uploads, folder
management, file moves, and deletes.

## Features

- Admin-only authentication
- File and folder management UI
- Upload, move, and delete actions
- Cloudflare R2 storage support through the S3 API
- Better Auth session handling
- Drizzle ORM with PostgreSQL

## How to Use

### 1. Fork the repository

Fork this repo from [YoruAkio/GTCDNServer](https://github.com/YoruAkio/GTCDNServer).

### 2. Set up Vercel

Import your fork into Vercel and create a new project.

### 3. Configure the environment

Set up the services below before deploying:

#### Neon PostgreSQL

- Create a Neon PostgreSQL database
- Connect it to Vercel, or copy the database URL into your Vercel environment variables
- Create or push the required database tables from your Neon / migration flow

#### Better Auth secret

Generate a secure secret:

```bash
openssl rand -hex 32
```

Use that value for your Better Auth secret environment variable.

#### Cloudflare R2

- Create your R2 bucket
- Collect the required bucket configuration
- Add all R2 environment variables in Vercel
- If you want direct public downloads, also set up your public R2/custom domain URL

### 4. Deploy to Vercel

After your database, auth secret, and R2 settings are ready, deploy the project from Vercel.

### 5. First login

On localhost, the project can create a default admin account automatically.

- default password: `admin123`
- you will be asked to change the password after the first login

## Contribution

Contributions are welcome through issues and pull requests.

Before submitting changes:

- keep the existing code style
- use `bun run fmt` for formatting
- use `bun run lint` for lint checks
- keep changes focused and easy to review

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
