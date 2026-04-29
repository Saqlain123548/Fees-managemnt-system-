# Feature Implementation Tracker

## Feature 1 — Live Graphs on Expenses Page
- [ ] Install `jspdf-autotable`
- [ ] Create DB migration for `status` column
- [ ] Update `src/app/api/expenses/route.ts` (GET/POST with status)
- [ ] Update `src/app/api/expenses/[id]/route.ts` (PUT with status)
- [ ] Update `src/lib/pdfUtils.ts` (add `generateExpensesPDF`)
- [ ] Update `src/app/expenses/page.tsx`:
  - [ ] Add Recharts BarChart (Monthly Expenses Overview)
  - [ ] Add Recharts PieChart Donut (Expenses by Category)
  - [ ] Add "Download PDF" button
  - [ ] Add Status column to table with color badges
  - [ ] Add status filter tabs (All/Paid/Pending/Due)
  - [ ] Add status summary counts
  - [ ] Add status dropdown in Add/Edit modal
  - [ ] Add inline status change in table rows

