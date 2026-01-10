# Travel Quote Calculator

## Overview

A travel quote calculator application for generating custom trip estimates. The system allows users to configure various travel options (villa stays, vehicle rentals, eco-guides, and tour guides) and calculates pricing based on complex rules including day-of-week pricing, vehicle types, and group sizes. Users can save quotes to a database for future reference.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Hook Form for form state, TanStack Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for smooth UI transitions
- **Build Tool**: Vite with custom Replit plugins for development

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: REST API with typed routes defined in `shared/routes.ts`
- **Validation**: Zod schemas for request/response validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Route components
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle schemas and Zod validation
  routes.ts       # API contract definitions
```

### Data Flow
1. Frontend forms collect user input with react-hook-form
2. Zod schemas validate input on both client and server
3. TanStack Query mutations call REST endpoints
4. Server calculates quotes using business logic in routes.ts
5. Results stored via Drizzle ORM to PostgreSQL

### Key Design Patterns
- **Shared Schema Pattern**: Database schemas and validation schemas defined once in `shared/` and used by both client and server
- **Type-safe API Contract**: Route definitions with method, path, and response schemas centralized in `shared/routes.ts`
- **Component Composition**: Modular UI built from shadcn/ui primitives

## External Dependencies

### Database
- **PostgreSQL**: Primary data store accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and queries
- **drizzle-kit**: Database migrations via `db:push` command

### UI Component Library
- **shadcn/ui**: Pre-built accessible components using Radix UI primitives
- **Radix UI**: Headless UI primitives for dialogs, dropdowns, switches, etc.
- **Tailwind CSS**: Utility-first styling with custom theme configuration

### Date Handling
- **date-fns**: Date manipulation for check-in/out calculations and pricing logic
- **react-day-picker**: Calendar component for date selection

### Development Tools
- **Vite**: Development server with HMR
- **esbuild**: Production bundling for server code
- **tsx**: TypeScript execution for development