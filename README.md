# Remix and NestJS Integration with Microsoft Identity Authentication

> [!IMPORTANT]
>
> This project uses simplified Express-based applications to imitate the behavior of Remix and NestJS frameworks. These
> are not actual implementations of Remix and NestJS but are designed to demonstrate the integration with Microsoft
> Identity.

## Authentication Flow Diagram

```mermaid
sequenceDiagram
    participant User as User
    participant Remix as Remix App
    participant MS as Microsoft Identity
    participant NestJS as NestJS App

    User->>Remix: Click "Login"
    Remix->>MS: Redirect to Microsoft login page
    MS->>User: Enter credentials
    User->>MS: Submit credentials
    MS->>Remix: Redirect with authorization code
    Remix->>MS: Request access token using authorization code
    MS->>Remix: Return access token (JWT)
    Remix->>User: Show authenticated user content
    User->>Remix: Navigate to /profile page
    Remix->>NestJS: API request for user profile with JWT
    NestJS->>NestJS: Decode JWT
    NestJS->>NestJS: Validate JWT
    NestJS->>NestJS: Extract user data from JWT
    NestJS->>Remix: Send user profile data
    Remix->>User: Display user profile data
```

## Prerequisites

- Bun package manager
- A Microsoft Identity application setup with the required permissions and redirect URIs configured

## Getting Started

Install dependencies:

```bash
bun install
```

Copy the `.env.example` file to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Run the applications:

```bash
bun run dev:remix
bun run dev:nestjs
```

## Usage

1. Start both applications using the instructions above.
2. Navigate to the Remix app in your web browser.
3. Click on "Login" to authenticate via Microsoft Identity.
4. After authentication, access the /profile page to fetch and display user profile data from NestJS.
