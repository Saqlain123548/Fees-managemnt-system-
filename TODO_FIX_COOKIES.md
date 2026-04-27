# Fix: Type error - Property 'get' does not exist on type 'Promise<ReadonlyRequestCookies>'

## Steps
- [x] 1. Analyze the error and identify affected files
- [x] 2. Read relevant source files
- [x] 3. Create fix plan and get user confirmation
- [ ] 4. Edit `src/lib/supabaseServer.ts` to await `cookies()` and use `getAll`/`setAll` API
- [ ] 5. Run TypeScript check to verify the fix

