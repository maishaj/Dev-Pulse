# DevPulse

DevPulse is an internal tech issue and feature tracker for software teams. It allows team members to report bugs, suggest features, view issues, and manage issue updates based on their roles.

## Features

* User registration with `contributor` or `maintainer` role
* User login with JWT authentication
* Create bug reports and feature requests
* View all issues
* Filter issues by type and status
* Sort issues by newest or oldest
* View a single issue with reporter information
* Contributors can update their own open issues
* Maintainers can update any issue
* Maintainers can delete issues
* Role-based authorization

## Technology Stack

* Node.js
* TypeScript
* Express.js
* PostgreSQL
* `pg` (native PostgreSQL driver)
* Raw SQL
* bcrypt
* jsonwebtoken

## Project Structure

```text
src/
├── config/
├── middleware/
├── modules/
│   ├── auth/
│   └── issues/
├── utility/
└── db/
```

## Setup

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd devpulse
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file and add the required environment variables:

```env
PORT=5000
DATABASE_URL=<your-postgresql-connection-string>
JWT_SECRET=<your-jwt-secret>
```

### 4. Run the project

```bash
npm run dev
```

The server will run on:

```text
http://localhost:5000
```

## Database Schema

### Users

| Field        | Description                         |
| ------------ | ----------------------------------- |
| `id`         | Auto-incrementing unique identifier |
| `name`       | User's full name                    |
| `email`      | Unique login email                  |
| `password`   | Hashed password                     |
| `role`       | `contributor` or `maintainer`       |
| `created_at` | Account creation timestamp          |
| `updated_at` | Last update timestamp               |

### Issues

| Field         | Description                              |
| ------------- | ---------------------------------------- |
| `id`          | Auto-incrementing unique identifier      |
| `title`       | Issue title, maximum 150 characters      |
| `description` | Issue description, minimum 20 characters |
| `type`        | `bug` or `feature_request`               |
| `status`      | `open`, `in_progress`, or `resolved`     |
| `reporter_id` | ID of the user who created the issue     |
| `created_at`  | Issue creation timestamp                 |
| `updated_at`  | Last update timestamp                    |

## API Endpoints

### Authentication

#### Register

```http
POST /api/auth/signup
```

Request body:

```json
{
  "name": "John Doe",
  "email": "john.doe@devpulse.com",
  "password": "securePassword123",
  "role": "contributor"
}
```

#### Login

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "john.doe@devpulse.com",
  "password": "securePassword123"
}
```

Returns a JWT token and user information.

---

### Issues

#### Create Issue

```http
POST /api/issues
```

Authentication required.

Request body:

```json
{
  "title": "Database connection timeout under load",
  "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
  "type": "bug"
}
```

The `reporter_id` is taken from the authenticated user's JWT.

#### Get All Issues

```http
GET /api/issues
```

Query parameters:

```text
sort=newest
sort=oldest
type=bug
type=feature_request
status=open
status=in_progress
status=resolved
```

Example:

```http
GET /api/issues?sort=newest&type=bug&status=open
```

#### Get Single Issue

```http
GET /api/issues/:id
```

Example:

```http
GET /api/issues/45
```

#### Update Issue

```http
PATCH /api/issues/:id
```

Authentication required.

Request body:

```json
{
  "title": "Updated: Database pool exhaustion fix needed",
  "description": "Updated description with reproduction steps...",
  "type": "bug"
}
```

Access:

* `maintainer` — can update any issue
* `contributor` — can update their own issue only when its status is `open`

#### Delete Issue

```http
DELETE /api/issues/:id
```

Authentication required.

Access:

* `maintainer` only

## Authentication

Protected endpoints require a JWT in the `Authorization` header:

```http
Authorization: <JWT_TOKEN>
```

The JWT contains:

```text
id
name
role
```

Passwords are hashed using bcrypt and are never returned in API responses.

## User Permissions

| Action                | Contributor | Maintainer |
| --------------------- | ----------: | ---------: |
| Register              |         Yes |        Yes |
| Login                 |         Yes |        Yes |
| Create issue          |         Yes |        Yes |
| View issues           |         Yes |        Yes |
| Update own open issue |         Yes |        Yes |
| Update any issue      |          No |        Yes |
| Delete issue          |          No |        Yes |

## Deployment

The backend deployed using:

* Vercel

PostgreSQL hosted using:

* NeonDB

## Live URL

```text
https://dev-pulse-bqx4z4def-maishajs-projects.vercel.app/
```

## GitHub Repository

```text
https://github.com/maishaj/Dev-Pulse
```
