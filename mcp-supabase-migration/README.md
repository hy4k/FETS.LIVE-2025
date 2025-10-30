# Supabase Migration MCP Server

Custom MCP server for executing SQL migrations on Supabase.

## Tools

- `execute_sql` - Execute SQL query
- `execute_migration_file` - Execute SQL file

## Usage

Set environment variable:
```bash
set SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

Run via MCP client or use the simple script:
```bash
node execute-migration.js
```

Or use the batch file:
```bash
run-migration.bat
```
