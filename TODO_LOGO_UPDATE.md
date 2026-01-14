# Logo and Text Update Plan

## Changes to src/lib/pdfUtils.ts

### Task 1: Update generatePDF() function
- [x] Move logo to top-left corner
- [x] Increase logo size to ~55mm
- [x] Apply brand colors to "Agaicode Technologies Fees Management" text

### Task 2: Update generateStudentsPDF() function
- [x] Move logo to top-left corner
- [x] Increase logo size consistently
- [x] Apply brand colors to company name text

### Task 3: Update generateReportsPDF() function
- [x] Move logo to top-left corner
- [x] Increase logo size
- [x] Apply brand colors to the centered text

## Brand Colors
- Primary: #4F46E5 (Indigo)
- Secondary: #7C3AED (Purple)
- Gradient effect using multiple colors for text

## Files Modified
- src/lib/pdfUtils.ts

## Summary
All PDF generation functions now have:
1. Logo positioned at top-left corner (X=margin, Y=margin)
2. Logo size increased from 40mm/120mm to 55mm width
3. "Agaicode Technologies" in Indigo (#4F46E5) bold text
4. "Fees Management" in Purple (#7C3AED) normal text
5. Consistent styling across all PDF types (general, students, reports)

