# Task: Update Search Bar and Student Modal

## Summary
Update the search bar functionality in AppNavbar to:
1. Style the StudentModal like the Add Student modal (using shadcn/ui Dialog)
2. Ensure all student fields are properly displayed (name, contact, email, fee status)
3. Fix any bugs in the search/dropdown/modal flow

## Changes Made

### 1. StudentModal.tsx ✅
- [x] Replaced custom modal with shadcn/ui Dialog component
- [x] Matched styling with Add Student modal (sm:max-w-lg, consistent padding)
- [x] Ensured all fields are properly displayed (name, email, contact, join date)
- [x] Fixed loading states with Loader2 spinner
- [x] Added proper fee status display (Total Due: $3000, Total Paid, Outstanding)
- [x] Added payment history with scrollable list

### 2. SearchDropdown.tsx ✅
- [x] Verified search functionality works correctly
- [x] Debounce timing set to 300ms
- [x] Proper click-outside handling with useRef

### 3. AppNavbar.tsx ✅
- [x] Search → dropdown → modal flow verified
- [x] State management for selected student confirmed

### 4. fees/route.ts ✅
- [x] Added studentId filter parameter to GET endpoint
- [x] API now supports ?studentId=xxx for fetching specific student fees

## Testing Steps
1. Open the app and click on the search bar
2. Type a student name (at least 2 characters)
3. Verify dropdown shows matching students
4. Click on a student and verify modal opens
5. Verify modal shows all student info and fee status
6. Verify modal can be closed with X button or clicking outside

