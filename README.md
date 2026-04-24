# Logistics OS

A logistics operating system built with TypeScript and Supabase.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase URL and anon key.

3. Run the diagnostic script:
   ```bash
   npx ts-node -r dotenv/config check.ts
   ```

## Project Structure

- `src/lib/supabase/client.ts` - Supabase client setup
- `src/types.ts` - TypeScript type definitions
- `check.ts` - Diagnostic script for Supabase connection</content>
<parameter name="filePath">/workspaces/logistics-os/README.md