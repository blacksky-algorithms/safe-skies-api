# SAFEskies API

SAFEskies API is the backend for SAFEskies—a Node.js/Express API that handles authentication, profile management, feed permissions, and moderation/reporting for the SAFEskies project. This API uses PostgreSQL (or a Supabase instance) for persistence and provides endpoints for OAuth authentication with BlueSky (Atproto), as well as endpoints to report posts and manage moderation.

---

## Table of Contents

- [SAFEskies API](#safeskies-api)
  - [Table of Contents](#table-of-contents)
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
  - [License](#license)

---

## Features

- **OAuth Authentication:**  
  Supports BlueSky OAuth flows with persistent session storage using custom persistent stores.
- **Profile Management:**  
  Automatically creates or updates user profiles on login.
- **Feed Permissions:**  
  Manages feed roles with a clear role hierarchy (`admin`, `mod`, `user`).
- **Moderation Logging:**  
  Logs moderation actions (post deletion/restoration, user bans/unbans, mod promotions/demotions) in a dedicated `logs` table.
- **Reporting System:**  
  Provides endpoints for reporting posts, with configurable report options and moderation services.
- **Client Metadata Endpoint:**  
  Serves OAuth client metadata for discovery.
- **Automated Backups:**  
  Creates automatic backups during schema migrations with easy restoration options.

---

## Project Structure

Below is an example directory structure for the project:

```
safe-skies-api/
├── migrations/
│ ├── 20250222103045_initial_schema.sql    # Initial database schema and seed data
│ ├── 20250222103046_add_auth_tables.sql   # Auth tables migration
│ └── 20250222103047_add_utility_funcs.sql # Backup and restore utilities
├── src/
│ ├── config/
│ │ └── db.ts                # PostgreSQL client configuration
│ ├── controllers/
│ │ ├── authController.ts    # Authentication endpoints
│ │ └── moderationController.ts # Moderation/reporting endpoints
│ ├── repos/
│ │ ├── storage.ts          # Persistent SessionStore and StateStore (with encryption)
│ │ ├── oauth-client.ts     # OAuth client setup using @atproto/oauth-client-node
│ │ ├── atproto-agent.ts    # AtprotoAgent singleton configuration
│ │ ├── profile.ts          # Profile management functions
│ │ ├── permission.ts       # Permission & feed role helper functions
│ │ ├── logs.ts            # Moderation logging functions
│ │ ├── reporting.ts       # Reporting helper functions
│ │ └── constants.ts       # Constants (OAuth client metadata, etc.)
│ ├── routes/
│ │ ├── auth.ts           # Authentication routes
│ │ ├── moderation.ts     # Moderation/reporting routes
│ │ └── clientMetadata.ts # OAuth client metadata endpoint
│ └── server.ts           # Express server entry point
├── .env.sample           # Sample environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## Setup

### Prerequisites

- **Node.js** (v14 or higher recommended)
- **PostgreSQL** (or a Supabase instance for hosting your database)
- **npm**

### Installation

1. **Clone the Repository:**

```bash
git clone https://github.com/FreedomWriter/safe-skies-api.git
cd safe-skies-api
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

**Example `.env.sample`:**

```bash
PORT=5000
PGUSER=your_PGUSER
PGPASSWORD=your_PGPASSWORD
PGHOST=your_PGHOST
PGDATABASE=your_PGDATABASE
PGPORT=5432

ENCRYPTION_KEY=your_base64_encoded_32_byte_key

NEXT_PUBLIC_URL=https://your-backend-url.com
BS_BASE_URL=https://bsky.social

CLIENT_URL=https://your-frontend-url.com
```

### Database Migrations

This project uses [node-pg-migrate](https://github.com/salsita/node-pg-migrate) to manage your database schema.

1. **Create the Database Schema:**

```bash
npm run migrate:up
```

2. **Rollback Migrations:**

```bash
npm run migrate:down
```

When running migrations down, the system automatically creates backup tables with timestamps for all affected data.

### Database Backups and Restoration

#### How Backups Work

- Automatic backups are created before any `migrate:down` operation
- Each backup is tagged with a timestamp (format: YYYYMMDD_HHMMSS)
- Backups include:
  - Table data
  - Enum values
  - Constraints and indexes
  - Row Level Security policies

#### Managing Backups

The following PostgreSQL functions are available:

1. **List Available Backups:**

```sql
SELECT * FROM list_backups();
```

2. **Restore from a Backup:**

```sql
SELECT restore_from_backup('20250222_103045');  -- Replace with your backup timestamp
```

3. **Clean Up Old Backups:**

```sql
SELECT cleanup_old_backups(30);  -- Removes backups older than 30 days
```

#### Restoration Process

1. List available backups:

```sql
SELECT * FROM list_backups();
```

2. Choose a backup timestamp

3. Restore the backup:

```sql
SELECT restore_from_backup('YOUR_BACKUP_TIMESTAMP');
```

4. Verify your data after restoration

Common restoration scenarios:

- After problematic migrations
- Following accidental data loss
- Rolling back to a known good state

---

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

When running in development mode with `npm run dev`, ts-node-dev will automatically restart the server whenever you make changes to your files. The server will run on the port specified in your `.env` file (default is 5000).

### Available Scripts

- **`npm run dev`**: Starts the development server with auto-reloading
- **`npm run build`**: Compiles TypeScript to JavaScript
- **`npm start`**: Runs the compiled code in production
- **`npm test`**: Runs Jest tests
- **`npm run test:watch`**: Runs tests in watch mode
- **`npm run test:e2e`**: Runs Postman collection tests using Newman
- **`npm run lint`**: Runs ESLint for code quality
- **`npm run format`**: Formats code using Prettier
- **`npm run migrate:create`**: Creates a new migration file
- **`npm run migrate:up`**: Runs pending migrations
- **`npm run migrate:down`**: Rolls back the most recent migration

---

## API Endpoints

### Authentication

- **GET /auth/signin**  
  Initiates the OAuth flow.  
  **Query Parameters:**

  - `handle`: A login hint (e.g., the user handle)  
    **Response:**  
    Returns a JSON object with an authorization URL.

- **GET /auth/callback**  
  Handles the OAuth callback. Processes the OAuth response, upserts the user profile, sets an HTTP-only cookie, and redirects to the client URL.

- **POST /auth/logout**  
  Logs the user out by clearing the session cookie.

- **GET /oauth/client-metadata.json**  
  Serves the OAuth client metadata for discovery.

### Moderation / Reporting

- **POST /moderation/report**  
  Accepts a JSON payload to report a post. The payload includes:
  - `targetedPostUri`
  - `reason`
  - `toServices` (array of services)
  - `targetedUserDid`
  - `uri`
  - `feedName`
  - `additionalInfo`
  - `userDid`

---

## Development Tools

- **Express:** HTTP server framework
- **ts-node-dev:** TypeScript execution and development environment with auto-reloading
- **Helmet:** Security headers
- **CORS:** Cross-Origin Resource Sharing
- **Morgan:** HTTP request logging
- **node-pg-migrate:** Database migrations
- **TypeScript:** Static typing
- **Jest & Supertest:** Testing
- **Newman:** Command-line collection runner for Postman
- **ESLint & Prettier:** Code quality
- **Husky:** Git hooks for code quality

---

## Contributing

Contributions are welcome! To contribute:

- Open an issue or submit a pull request
- Ensure new code includes tests and documentation
- Follow the coding style guidelines

---

## License

This project is licensed under the MIT License.
