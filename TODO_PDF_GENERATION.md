# PDF Generation Implementation Plan

## Information Gathered

### Project Structure
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with custom UI components
- **State Management**: React hooks (useState, useEffect, useCallback)
- **Real-time**: Supabase subscriptions

### Key Files Analyzed
1. **src/app/students/page.tsx**: 
   - Displays student list table with columns: Name, Email, Contact, Join Date, Actions
   - Uses `Table` components from shadcn/ui
   - Has search functionality and add/edit/delete dialogs

2. **src/app/reports/page.tsx**:
   - Contains summary cards (Total Students, Total Collected, Total Outstanding)
   - Has 4 charts: Pie Chart, Bar Chart, Area Chart, Radar Chart
   - Contains 2 tables: Outstanding Payments, Recent Payments
   - Uses recharts for visualization

3. **src/components/ui/AppNavbar.tsx**:
   - Logo is located at `/assets/Agaicode2.png`
   - Logo dimensions in navbar: width={220} height={57} (scaled to h-14 w-auto)
   - Uses `Image` component with quality={100} and priority

4. **package.json**:
   - No PDF generation libraries currently installed
   - Will need to add: `jspdf`, `html2canvas`

## Plan

### Step 1: Install Dependencies
- Install `jspdf` and `html2canvas` for PDF generation

### Step 2: Create PDF Utility Module
Create `src/lib/pdfUtils.ts` with:
- `generatePDF` function that:
  - Loads the company logo (high quality)
  - Creates a new PDF document
  - Adds logo at the top in full HD quality
  - Captures and adds content (tables/sections)
  - Downloads the PDF

### Step 3: Update Students Page
- Add "Download PDF" button next to the search/filter controls
- Import PDF utility functions
- Create handler function for PDF generation
- Use html2canvas to capture the student table
- Include logo and student data in PDF

### Step 4: Update Reports Page
- Add "Download PDF" button next to the page title
- Import PDF utility functions
- Create handler function for PDF generation
- Capture summary cards and tables
- Note: Charts are canvas elements and may need special handling

### Step 5: Testing & Refinement
- Test PDF generation on both pages
- Ensure logo quality is maintained
- Handle any errors gracefully

## Dependent Files to be Edited
1. `package.json` - Add dependencies
2. `src/lib/pdfUtils.ts` - Create new utility file
3. `src/app/students/page.tsx` - Add PDF download button and functionality
4. `src/app/reports/page.tsx` - Add PDF download button and functionality

## Followup Steps
1. After implementing, run `npm install` to install new dependencies
2. Test PDF generation by visiting both pages
3. Verify logo appears correctly in PDF
4. Check PDF formatting and layout

