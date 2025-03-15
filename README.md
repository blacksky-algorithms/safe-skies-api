# SAFEskies API :shield:

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Stability: Alpha](https://img.shields.io/badge/Stability-Alpha-orange.svg)]()

SAFEskies API is the backend for SAFEskies (Software Against a Fearful Environment)—a Node.js/Express API that handles authentication, profile management, feed permissions, and moderation/reporting for the SAFEskies project. This API uses PostgreSQL (or a Supabase instance) for persistence and provides endpoints for OAuth authentication with BlueSky (Atproto), as well as endpoints to report posts, manage moderation, and more.

**Live Application**: API powers the frontend at [www.safeskies.app](https://www.safeskies.app)

## Table of Contents

- [SAFEskies API :shield:](#safeskies-api-shield)
  - [Table of Contents](#table-of-contents)
  - [⚠️ Stability Warning](#️-stability-warning)
  - [Features](#features)
  - [Project Structure](#project-structure)
  - [Setup](#setup)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
    - [Database Migrations](#database-migrations)
    - [Database Backups and Restoration](#database-backups-and-restoration)
      - [How Backups Work](#how-backups-work)
      - [Managing Backups](#managing-backups)
      - [Restoration Process](#restoration-process)
  - [Running the Server](#running-the-server)
    - [Available Scripts](#available-scripts)
  - [API Endpoints](#api-endpoints)
    - [Authentication](#authentication)
    - [Moderation / Reporting](#moderation--reporting)
  - [Development Tools](#development-tools)
  - [Contributing](#contributing)
    - [Current Contribution Priorities](#current-contribution-priorities)
    - [Contribution Process](#contribution-process)
  - [License](#license)
  - [Maintainer](#maintainer)

## ⚠️ Stability Warning

**IMPORTANT**: SAFEskies API is currently in an alpha state of development. The application is functional but subject to significant changes as we work toward a stable release.

You should be aware of the following:

- The API interfaces may change without backward compatibility
- Database schema and data structures could be modified between versions
- Authentication mechanisms might evolve as we stabilize the architecture
- Documentation is still evolving along with the application

We encourage testing and feedback but recommend caution when using SAFEskies API in production environments at this stage.

## Features

- **OAuth Authentication:**  
  Supports BlueSky OAuth flows with persistent session storage using custom persistent stores.
- **Profile Management:**  
  Automatically creates or updates user profiles on login.
- **Feed Permissions:**  
  Manages feed roles with a clear hierarchy (`admin`, `mod`, `user`).
- **Moderation Logging & Reporting:**  
  Logs moderation actions (post deletion/restoration, user bans/unbans, mod promotions/demotions) in a dedicated `logs` table and provides endpoints for reporting posts.
- **Client Metadata Endpoint:**  
  Serves OAuth client metadata for discovery.
- **Automated Backups:**  
  Creates automatic backups during schema migrations with easy restoration options.

## Project Structure

Below is the directory structure for the project:

```
├── Dockerfile                   # Docker configuration for containerizing the app
├── README.md                    # Project documentation (this file)
├── knexfile.ts                  # Knex configuration (TypeScript)
├── migrate-config.js            # Configuration for database migrations
├── migrations                   # Database migration scripts in TypeScript
│   ├── 20250222103043_initial_schema.ts
│   └── 20250223_add_unique_constraint_to_feed_permissions.ts
├── package-lock.json            # npm dependency lock file
├── package.json                 # Project dependencies, scripts, and metadata
├── src                          # Source code (TypeScript)
│   ├── config                   # App configuration files
│   │   ├── db.ts                # Database connection and configuration
│   │   └── index.ts             # Centralized export for configurations
│   ├── controllers              # Express controllers handling API logic
│   │   ├── auth.controller.ts   # Authentication endpoints
│   │   ├── dev.controller.ts    # Development-only endpoints
│   │   ├── feed.controller.ts   # Feed-related endpoints
│   │   ├── logs.controller.ts   # Moderation logs endpoints
│   │   ├── moderation.controller.ts   # Moderation and reporting endpoints
│   │   ├── permissions.controller.ts  # Permissions and role management endpoints
│   │   └── profile.controller.ts      # User profile management endpoints
│   ├── lib                      # Utility libraries and types
│   │   ├── constants            # Application constants (e.g., default feed, moderation options)
│   │   ├── types                # TypeScript type definitions
│   │   └── utils                # Helper functions and utilities
│   ├── middleware               # Express middleware functions
│   │   ├── auth.middleware.ts   # Authentication (JWT verification) middleware
│   │   └── dev-only.middleware.ts # Middleware for development-only routes
│   ├── repos                    # Repository layer for direct DB access and business logic
│   │   ├── atproto.ts           # Atproto agent configuration and API wrappers
│   │   ├── feed.ts              # Data access for feed permissions and feeds
│   │   ├── logs.ts              # Data access for moderation logs
│   │   ├── moderation.ts        # Reporting and moderation helper functions
│   │   ├── oauth-client.ts      # OAuth client setup
│   │   ├── permissions.ts       # Data access for permissions and roles
│   │   ├── profile.ts           # Data access for user profiles
│   │   └── storage.ts           # Session storage and encryption functionality
│   ├── routes                   # Express route definitions
│   │   ├── auth.ts              # Authentication routes
│   │   ├── clientMetadata.ts    # OAuth client metadata endpoint
│   │   ├── dev.ts               # Development routes
│   │   ├── feeds.ts             # Feed-related routes
│   │   ├── logs.ts              # Moderation logs routes
│   │   ├── moderation.ts        # Moderation/reporting routes
│   │   ├── permissions.ts       # Permissions and role management routes
│   │   └── profile.ts           # Profile management routes
│   └── server.ts                # Express server entry point
└── tsconfig.json                # TypeScript configuration
```

## Setup

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **PostgreSQL** (or a Supabase instance)
- **npm** (v9 or higher)

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/FreedomWriter/SAFEskies.git
   cd SAFEskies
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

### Environment Variables

Copy the sample file and update with your configuration:

```bash
cp .env.sample .env
```

Example `.env.sample`:

```bash
PORT=5000
PGUSER=your_PGUSER
PGPASSWORD=your_PGPASSWORD
PGHOST=your_PGHOST
PGDATABASE=your_PGDATABASE
PGPORT=5432

ENCRYPTION_KEY=your_base64_encoded_32_byte_key

NEXT_PUBLIC_URL=https://your-backend-url.com

CLIENT_URL=https://your-frontend-url.com

JWT_SECRET=your_jwt_secret_key
```

### Database Migrations

This project uses Knex.js to manage your database schema.

- **Create a Migration:**

  ```bash
  npm run migrate:create migration_name
  ```

- **Run Migrations:**

  ```bash
  npm run migrate:up
  ```

- **Rollback Migrations:**

  ```bash
  npm run migrate:down
  ```

When running migrations down, the system automatically creates backup tables with timestamps for all affected data.

### Database Backups and Restoration

#### How Backups Work

- Automatic backups are created before any `migrate:down` operation.
- Each backup is tagged with a timestamp (format: YYYYMMDD_HHMMSS).
- Backups include:
  - Table data
  - Enum values
  - Constraints and indexes
  - Row Level Security policies

#### Managing Backups

Available PostgreSQL functions:

- **List Backups:**

  ```sql
  SELECT * FROM list_backups();
  ```

- **Restore a Backup:**

  ```sql
  SELECT restore_from_backup('20250222_103045');  -- Replace with your backup timestamp.
  ```

- **Clean Up Old Backups:**

  ```sql
  SELECT cleanup_old_backups(30);  -- Removes backups older than 30 days.
  ```

#### Restoration Process

1. List available backups:

   ```sql
   SELECT * FROM list_backups();
   ```

2. Choose a backup timestamp.

3. Restore the backup:

   ```sql
   SELECT restore_from_backup('YOUR_BACKUP_TIMESTAMP');
   ```

4. Verify your data after restoration.

## Running the Server

The server can be run in different modes:

```bash
# Development mode with ts-node-dev (auto-reloading)
npm run dev

# Production mode
npm start

# Build the TypeScript code
npm run build
```

When running in development mode with `npm run dev`, ts-node-dev will automatically restart the server when changes are made. The server will run on the port specified in your `.env` file (default is 5000).

### Available Scripts

- `npm run dev`: Starts the development server with auto-reloading.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the compiled code in production.
- `npm test`: Runs Jest tests.
- `npm run test:watch`: Runs tests in watch mode.
- `npm run test:coverage`: Runs tests with coverage report.
- `npm run test:e2e`: Runs Postman collection tests using Newman.
- `npm run lint`: Runs ESLint for code quality.
- `npm run format`: Formats code using Prettier.
- `npm run migrate:create`: Creates a new migration file.
- `npm run migrate:up`: Runs pending migrations.
- `npm run migrate:down`: Rolls back the most recent migration.

## API Endpoints

### Authentication

- **GET /auth/signin**  
  Initiates the OAuth flow.  
  Query Parameters:

  - `handle`: A login hint (e.g., the user handle).

  Response:  
  Returns a JSON object with an authorization URL.

- **GET /auth/callback**  
  Handles the OAuth callback. Processes the OAuth response, upserts the user profile, sets an HTTP-only cookie, and redirects to the client URL.

- **POST /auth/logout**  
  Logs the user out by clearing the session cookie.

- **GET /oauth/client-metadata.json**  
  Serves the OAuth client metadata for discovery.

### Moderation / Reporting

- **POST /moderation/report**  
  Accepts a JSON payload (or an array of payloads) to report a post. The payload includes:

  - `targetedPostUri`
  - `reason`
  - `toServices` (array of moderation services)
  - `targetedUserDid`
  - `uri`
  - `feedName`
  - `additionalInfo`
  - `action`
  - Optional metadata fields.

  Response:  
  Returns a summary of the processing of each report.

**TODO:** Add detailed API documentation for each endpoint.

## Development Tools

- **Express**: HTTP server framework.
- **Knex**: SQL query builder for PostgreSQL.
- **ts-node-dev**: TypeScript execution and development environment with auto-reloading.
- **Helmet**: Security headers.
- **CORS**: Cross-Origin Resource Sharing.
- **Morgan**: HTTP request logging.
- **TypeScript**: Static typing.
- **Jest & Supertest**: Testing.
- **Newman**: Command-line collection runner for Postman.
- **ESLint & Prettier**: Code quality.
- **Husky**: Git hooks for code quality.
- **Zod**: TypeScript-first schema validation.

## Contributing

SAFEskies welcomes community contributions, but please note our current development phase focuses on establishing stability before implementing major new features.

### Current Contribution Priorities

- Bug fixes and stability improvements
- Documentation improvements
- Test coverage expansion
- Security enhancements

### Contribution Process

1. **Check Existing Issues**: Review open issues to see if your concern is already being addressed.

2. **Open an Issue First**: Before submitting code changes, please open an issue to discuss your proposed changes.

   - For bugs, include reproduction steps and expected behavior
   - For features, explain the use case and implementation approach

3. **Development Workflow**:

   ```bash
   # Fork and clone the repository
   git clone https://github.com/your-username/SAFEskies.git
   cd SAFEskies

   # Create a descriptive feature branch
   git checkout -b fix/issue-description

   # Install dependencies
   npm install

   # Make your changes with tests
   # Run tests to ensure no regressions
   npm test
   ```

4. **Code Standards**:

   - Follow existing code style patterns
   - Include comments for complex logic
   - Add tests for new functionality
   - Update documentation to reflect changes

5. **Pull Request Process**:
   - Ensure all tests pass
   - Reference the related issue in your PR
   - Provide a clear description of changes
   - Be responsive to review feedback

The maintainer will review PRs on a regular basis, prioritizing stability-focused contributions during this alpha development phase.

## License

This project is licensed under the MIT License.

## Maintainer

Maintainer: Natalie Davis ([@codefreedomritr.bsky.social](https://bsky.app/profile/codefreedomritr.bsky.social))
