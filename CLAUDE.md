# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FETS.LIVE is a comprehensive staff management and operations platform built with React, TypeScript, Vite, and Supabase. The application provides features for roster management, candidate tracking, incident reporting, task management, and internal communication for educational institutions with multi-branch support.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite 6
- **Backend**: Supabase (PostgreSQL, Authentication, Realtime, Storage)
- **State Management**: TanStack Query (React Query) with optimized caching
- **Styling**: Tailwind CSS with custom theme system
- **Testing**: Vitest with React Testing Library, MSW for API mocking
- **Package Manager**: pnpm (workspace-enabled monorepo structure)

## Project Structure

```
FETS.LIVE-2025-main/
├── fets-point/                  # Main React application
│   ├── src/
│   │   ├── components/          # React components (50+ components)
│   │   │   ├── Chat/           # FETS Connect chat system
│   │   │   ├── iCloud/         # Dashboard widgets
│   │   │   └── shared/         # Reusable UI components
│   │   ├── contexts/           # React Context providers
│   │   │   ├── AuthContext.tsx     # User authentication & profile
│   │   │   ├── BranchContext.tsx   # Multi-branch management
│   │   │   └── ThemeContext.tsx    # Theme system
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service layer (api.service.ts)
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   └── lib/                # Core libraries (supabase client)
│   ├── package.json
│   └── vite.config.ts
├── scripts/                     # Database & deployment scripts
├── supabase/                    # Supabase configuration (migrations live server-side)
└── package.json                 # Root workspace config
```

## Essential Commands

### Development
```bash
# Install dependencies (run from root)
pnpm install

# Start development server (runs from fets-point/)
pnpm dev
# or: cd fets-point && pnpm dev

# Type checking
cd fets-point && pnpm type-check
```

### Testing
```bash
cd fets-point

# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Building
```bash
cd fets-point

# Development build
pnpm build

# Production build (sets BUILD_MODE=prod)
pnpm build:prod

# Preview production build
pnpm preview
```

### Code Quality
```bash
cd fets-point

# Lint code
pnpm lint

# Auto-fix lint issues
pnpm lint:fix
```

### Database Operations
```bash
# Run SQL scripts (uses dotenv for credentials)
pnpm sql

# Verify database setup
node verify-database.js

# Sync profile data
node sync-profile-data.js
```

## Architecture & Key Patterns

### 1. Context-Based State Management
The app uses three primary contexts wrapping the entire application:
- **AuthContext** (`src/contexts/AuthContext.tsx`): Manages user authentication via Supabase Auth and loads user profiles from `staff_profiles` table
- **BranchContext** (`src/contexts/BranchContext.tsx`): Handles multi-branch filtering with role-based access (branches: calicut, irinjalakuda, kodungallur, global)
- **ThemeContext** (`src/contexts/ThemeContext.tsx`): Controls light/dark theme switching

### 2. Lazy Loading & Code Splitting
All major page components are lazy-loaded in `App.tsx` for performance:
```typescript
const Dashboard = lazy(() => import('./components/iCloud/iCloudDashboard'))
const CommandCentre = lazy(() => import('./components/CommandCentrePremium'))
```
Use `LazyErrorBoundary` wrapper with `Suspense` for all lazy-loaded routes.

### 3. Service Layer Pattern
Use `src/services/api.service.ts` for all Supabase operations. DO NOT call Supabase directly from components:
```typescript
// Good ✅
import { candidatesService } from '../services/api.service'
const candidates = await candidatesService.getAll({ branch_location: 'calicut' })

// Bad ❌
import { supabase } from '../lib/supabase'
const { data } = await supabase.from('candidates').select('*')
```

Services available:
- `candidatesService`: Candidate management
- `incidentsService`: Incident reporting
- `rosterService`: Staff scheduling
- `checklistService`: Checklist operations
- `profilesService`: User profile management

### 4. TanStack Query Usage
All data fetching uses React Query with custom hooks in `src/hooks/`:
- Query hooks: `useQueries.ts`, `useSessions.ts`, `useChecklist.ts`
- Mutation hooks: `useMutateChecklist.ts`, `useStaffManagement.ts`
- Realtime hooks: `useRealtime.ts`, `useFetsConnect.ts`

QueryClient configuration in `App.tsx`:
```typescript
{
  staleTime: 30000, // 30 seconds
  retry: 3,
  refetchOnWindowFocus: false,
}
```

### 5. Multi-Branch Architecture
The app supports branch-specific data filtering:
- Branches: `calicut`, `irinjalakuda`, `kodungallur`, `global`
- Role-based access: `super_admin` (all branches), `admin` (all branches), `staff` (assigned branch only)
- Use `useBranch()` hook to get `activeBranch` and filter data accordingly
- Database tables include `branch_location` column for filtering

### 6. Database Schema Key Points
- **Authentication**: Users stored in Supabase Auth, profiles in `staff_profiles` table linked via `user_id`
- **Critical**: Profile IDs from `staff_profiles.id` are used as foreign keys in `posts`, `comments`, `reactions`, etc.
- **Tables**: candidates, incidents, roster_schedules, staff_profiles, checklists, checklist_templates, tasks, posts, comments, branch_status, news_items
- **Realtime**: Real-time subscriptions configured for posts, comments, reactions, and chat messages

### 7. Routing System
No React Router - uses internal tab state in `App.tsx`:
```typescript
const [activeTab, setActiveTab] = useState('command-center')
```
Navigation via `Sidebar.tsx` component which calls `setActiveTab()`.

## Component Development Guidelines

### Creating New Components
1. Place in appropriate directory (`components/`, `components/Chat/`, `components/iCloud/`)
2. Use TypeScript with proper prop typing
3. Wrap lazy-loaded components in `LazyErrorBoundary`
4. Use React Query for data fetching (never useEffect for API calls)
5. Access branch context for multi-branch filtering

### Styling
- Use Tailwind CSS utility classes
- Custom styles in: `styles/fets-enhancements.css`, `styles/seven-day-calendar.css`, `styles/bold-sidebar.css`
- Theme classes: `.golden-theme`, `.branch-global`, `.content-with-single-banner`
- Responsive design: Use `useIsMobile()` and `useScreenSize()` hooks

### Error Handling
- Use `ErrorBoundary` component at app root
- Use `LazyErrorBoundary` for individual page routes
- Use `withErrorBoundary` HOC for critical components
- Service layer throws `ApiError` instances with structured error info

## Testing Guidelines

### Test File Locations
All tests in `fets-point/src/test/`:
- Component tests: `*.test.tsx`
- Hook tests: `hooks.enhanced.test.tsx`, `useQueries.test.tsx`
- Service tests: `api.service.test.ts`
- Setup: `setup.ts`

### Running Specific Tests
```bash
cd fets-point

# Run specific test file
pnpm test useQueries.test

# Run tests in watch mode
pnpm test --watch

# Run tests with specific pattern
pnpm test --grep "FetsConnect"
```

### Test Patterns
- Use MSW for API mocking (configured in `test/setup.ts`)
- Mock Supabase client calls
- Test React Query hooks with `QueryClientProvider` wrapper
- Use `@testing-library/react` for component testing

## Supabase Configuration

### Connection Setup
Supabase client configured in `src/lib/supabase.ts`:
- URL: `https://qqewusetilxxfvfkmsed.supabase.co`
- Uses environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Fallback credentials included for development
- Auto-refresh token enabled, session persisted

### MCP Server (AI Integration)
Supabase MCP server configured in `.mcp.json`:
- Project: `qqewusetilxxfvfkmsed`
- Read-only mode enabled by default
- Can query database, analyze schema via Claude Code

### Authentication Flow
1. User logs in via `Login.tsx` component
2. Supabase Auth creates session
3. `AuthContext` loads profile from `staff_profiles` table
4. Profile includes: `role`, `branch_assigned`, `full_name`, `avatar_url`, `user_id`

## Important Conventions

### File Naming
- Components: PascalCase (e.g., `FetsConnect.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useAuth.ts`)
- Services: camelCase with ".service" suffix (e.g., `api.service.ts`)
- Types: camelCase with ".types" suffix (e.g., `database.types.ts`)

### Import Order (Recommended)
1. React imports
2. Third-party libraries
3. Contexts
4. Hooks
5. Components
6. Services
7. Types
8. Utilities
9. Styles

### Code Comments
The codebase uses descriptive console logging for debugging:
```typescript
console.log('🔄 Loading user profile...')  // In-progress
console.log('✅ Profile loaded')           // Success
console.log('❌ Error loading profile')    // Error
```
Use emojis for visual clarity in console logs.

## Branch & Role Access Matrix

| Role         | Access Level                          | Can Access Global |
|--------------|---------------------------------------|-------------------|
| super_admin  | All branches + write permissions      | Yes               |
| admin        | All branches + limited write          | Yes               |
| staff        | Assigned branch only (read/write)     | No                |

Access checking via `useBranch().canAccessBranch(branch)` method.

## Common Pitfalls to Avoid

1. **DO NOT** bypass the service layer - always use `api.service.ts`
2. **DO NOT** use `useEffect` for data fetching - use React Query hooks
3. **DO NOT** hardcode branch logic - use `BranchContext`
4. **DO NOT** import directly from `supabase-js` in components - use service layer
5. **DO NOT** create new pages without lazy loading
6. **DO NOT** forget to filter by `branch_location` when fetching data
7. **DO NOT** use `profiles` table for foreign keys - use `staff_profiles.id`

## Performance Optimization

- QueryClient has 30s stale time - adjust per query if needed
- Lazy load all page-level components
- Use `react-window` for virtualized lists (large datasets)
- Realtime subscriptions are cleaned up on component unmount
- Images optimized and lazy-loaded where possible

## Deployment

Production builds use `pnpm build:prod` which:
1. Installs dependencies
2. Cleans temp build artifacts
3. Runs TypeScript compiler
4. Sets `BUILD_MODE=prod` environment variable
5. Runs Vite production build

PowerShell deployment script available: `scripts/deploy.ps1` (FTP-based deployment)

## Environment Variables

Required in `.env` or as environment variables:
```bash
VITE_SUPABASE_URL=https://qqewusetilxxfvfkmsed.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

For database scripts:
```bash
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## Additional Resources

- Supabase Dashboard: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed
- Main entry point: `fets-point/src/main.tsx`
- App shell: `fets-point/src/App.tsx`
- Type definitions: `fets-point/src/types/database.types.ts`
