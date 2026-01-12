# TODO: Reports Page Real-Time Data Integration

## Task 1: Create Reports API Endpoint
- [x] Create `/src/app/api/reports/route.ts`
- [x] Aggregate total students count
- [x] Calculate total collected vs outstanding
- [x] Generate student-wise fees breakdown (top 6 by outstanding)
- [x] Create monthly collection trend data
- [x] Get outstanding students list
- [x] Get recent payments list (last 10)

## Task 2: Update Reports Page with Real Data
- [x] Replace hardcoded data with API calls
- [x] Add loading state with spinner
- [x] Add error handling
- [x] Add refresh functionality

## Task 3: Add Real-Time Updates
- [x] Subscribe to `fees_records` table changes
- [x] Subscribe to `students` table changes
- [x] Auto-refresh data when changes occur
- [x] Show toast notifications for updates

## Task 4: Testing
- [ ] Verify all charts display correct data
- [ ] Verify real-time updates work
- [ ] Test error states

