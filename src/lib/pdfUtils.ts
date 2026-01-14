import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF document with company logo and content
 * @param contentElement - The HTML element to capture for PDF content
 * @param fileName - The name of the PDF file to download
 * @param title - The title to add to the PDF
 */
export async function generatePDF(
  contentElement: HTMLElement | null,
  fileName: string,
  title: string
): Promise<void> {
  if (!contentElement) {
    throw new Error('Content element not found');
  }

  // Create a new PDF document (A4 size)
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Add company logo at the top-left corner
  try {
    const logoImg = new Image();
    logoImg.src = '/assets/Agaicode2.png';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
    });

    // Calculate logo dimensions for high quality (HD) - bigger and fitted to corner
    const logoMaxWidth = pageWidth - (margin * 2);
    const logoAspectRatio = logoImg.width / logoImg.height;
    const logoWidth = Math.min(logoMaxWidth, 55); // Larger logo: 55mm width for good quality
    const logoHeight = logoWidth / logoAspectRatio;

    // Add logo to PDF (top-left corner)
    pdf.addImage(logoImg, 'PNG', margin, margin, logoWidth, logoHeight);
    currentY = margin + logoHeight + 15; // Position after logo with spacing
    
    // Add brand-colored title text after logo
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    
    // Apply brand colors (indigo to purple gradient effect using text)
    pdf.setTextColor(79, 70, 229); // Indigo primary color
    pdf.text('Agaicode Technologies', pageWidth / 2, margin + 25, { align: 'center' });
    
    // Add subtitle with secondary brand color
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237); // Purple secondary color
    pdf.text('Fees Management', pageWidth / 2, margin + 33, { align: 'center' });
    
    // Reset text color and continue below
    pdf.setTextColor(0);
    currentY = margin + logoHeight + 40;
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback: Add text title with brand colors if logo fails
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text('Agaicode Technologies', pageWidth / 2, currentY + 5, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237);
    pdf.text('Fees Management', pageWidth / 2, currentY + 12, { align: 'center' });
    pdf.setTextColor(0);
    currentY += 20;
  }

  // Add title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Add date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  // Add a separator line
  pdf.setDrawColor(200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Reset text color
  pdf.setTextColor(0);

  // Capture the content element as canvas
  try {
    const canvas = await html2canvas(contentElement, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Check if content fits on current page, add new page if needed
    if (currentY + imgHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }

    // Add the captured content
    pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error capturing content:', error);
    throw new Error('Failed to capture content for PDF');
  }

  // Add footer with page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Download the PDF
  pdf.save(fileName);
}

/**
 * Generates a PDF for student list
 * @param students - Array of student data
 * @param fileName - The name of the PDF file
 */
export async function generateStudentsPDF(
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    contact: string;
    joinDate: string;
  }>,
  fileName: string = 'students-list.pdf'
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = margin;

  // Add company logo at top-left corner
  try {
    const logoImg = new Image();
    logoImg.src = '/assets/Agaicode2.png';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
    });

    const logoMaxWidth = pageWidth - (margin * 2);
    const logoAspectRatio = logoImg.width / logoImg.height;
    const logoWidth = Math.min(logoMaxWidth, 55); // Larger logo: 55mm width
    const logoHeight = logoWidth / logoAspectRatio;

    // Add logo to PDF (top-left corner)
    pdf.addImage(logoImg, 'PNG', margin, margin, logoWidth, logoHeight);
    currentY = margin + logoHeight + 15;
    
    // Add brand-colored title text
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229); // Indigo primary
    pdf.text('Agaicode Technologies', pageWidth / 2, margin + 25, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237); // Purple secondary
    pdf.text('Fees Management', pageWidth / 2, margin + 33, { align: 'center' });
    
    pdf.setTextColor(0);
    currentY = margin + logoHeight + 40;
  } catch (error) {
    console.error('Error loading logo:', error);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text('Agaicode Technologies', pageWidth / 2, currentY + 5, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237);
    pdf.text('Fees Management', pageWidth / 2, currentY + 12, { align: 'center' });
    pdf.setTextColor(0);
    currentY += 20;
  }

  // Add Students List title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Students List', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Add date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
  pdf.text(`Total Students: ${students.length}`, pageWidth / 2, currentY + 5, { align: 'center' });
  currentY += 15;

  // Reset text color
  pdf.setTextColor(0);

  // Add separator
  pdf.setDrawColor(200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Table headers
  const headers = ['Name', 'Email', 'Contact', 'Join Date'];
  const colWidths = [50, 60, 35, 35];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const startX = (pageWidth - tableWidth) / 2;

  // Draw table header
  pdf.setFillColor(79, 70, 229); // Indigo color
  pdf.rect(startX, currentY, tableWidth, 8, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255);
  
  let colX = startX;
  headers.forEach((header, index) => {
    pdf.text(header, colX + 2, currentY + 5.5);
    colX += colWidths[index];
  });
  currentY += 8;

  // Draw table rows
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0);

  students.forEach((student, index) => {
    // Check if we need a new page
    if (currentY > 270) {
      pdf.addPage();
      currentY = margin;
    }

    // Alternate row colors
    if (index % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(startX, currentY, tableWidth, 7, 'F');
    }

    colX = startX;
    const rowData = [
      `${student.firstName} ${student.lastName}`,
      student.email,
      student.contact || '—',
      student.joinDate ? new Date(student.joinDate).toLocaleDateString() : '—'
    ];

    rowData.forEach((cell, cellIndex) => {
      // Truncate long text
      let cellText = cell;
      if (cellText.length > 25) {
        cellText = cellText.substring(0, 22) + '...';
      }
      pdf.text(cellText, colX + 2, currentY + 5);
      colX += colWidths[cellIndex];
    });

    currentY += 7;
  });

  // Add footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text(
      `Page ${i} of ${pageCount} | Agaicode Technologies - Fees Management System`,
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  pdf.save(fileName);
}

/**
 * Generates a PDF for reports
 * @param reportData - Reports data object containing summary and tables
 * @param fileName - The name of the PDF file
 */
export async function generateReportsPDF(
  reportData: {
    summary: {
      totalStudents: number;
      totalCollected: number;
      totalOutstanding: number;
    };
    outstandingStudents: Array<{ name: string; balance: number; status: string }>;
    recentPayments: Array<{ date: string; student: string; amount: number; method: string }>;
  },
  fileName: string = 'reports.pdf'
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = margin;

  // Extract summary data
  const { summary, outstandingStudents, recentPayments } = reportData;

  // Add company logo at top-left corner (larger and positioned perfectly)
  try {
    const logoImg = new Image();
    logoImg.src = '/assets/Agaicode2.png';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
    });

    const logoMaxWidth = pageWidth - (margin * 2);
    const logoAspectRatio = logoImg.width / logoImg.height;
    const logoWidth = Math.min(logoMaxWidth, 55); // Larger logo: 55mm width
    const logoHeight = logoWidth / logoAspectRatio;

    // Position logo at top-left corner
    pdf.addImage(logoImg, 'PNG', margin, margin, logoWidth, logoHeight);
    
    // Add brand-colored centered text "Agaicode Technologies Fees Management"
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229); // Indigo primary color
    pdf.text('Agaicode Technologies', pageWidth / 2, margin + 25, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237); // Purple secondary color
    pdf.text('Fees Management', pageWidth / 2, margin + 33, { align: 'center' });
    
    pdf.setTextColor(0);
    currentY = margin + logoHeight + 40; // Extra 10mm spacing after company text
  } catch (error) {
    console.error('Error loading logo:', error);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text('Agaicode Technologies', pageWidth / 2, currentY + 5, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237);
    pdf.text('Fees Management', pageWidth / 2, currentY + 12, { align: 'center' });
    pdf.setTextColor(0);
    currentY += 20;
  }

  // Add Financial Reports title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Financial Reports', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Add date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  // Reset text color
  pdf.setTextColor(0);

  // Add separator
  pdf.setDrawColor(200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Summary Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Summary', margin, currentY);
  currentY += 8;

  // Summary cards
  const summaryItems = [
    { label: 'Total Students', value: summary.totalStudents.toString() },
    { label: 'Total Collected', value: `₨ ${summary.totalCollected.toLocaleString()}` },
    { label: 'Total Outstanding', value: `₨ ${summary.totalOutstanding.toLocaleString()}` },
  ];

  const cardWidth = (pageWidth - margin * 2 - 20) / 3;
  
  summaryItems.forEach((item, index) => {
    const cardX = margin + (index * (cardWidth + 10));
    
    // Card background
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(cardX, currentY, cardWidth, 25, 3, 3, 'F');
    
    // Card text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text(item.label, cardX + 5, currentY + 8);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0);
    pdf.text(item.value, cardX + 5, currentY + 18);
  });
  currentY += 35;

  // Outstanding Students Table
  if (outstandingStudents.length > 0) {
    if (currentY > 230) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Outstanding Payments', margin, currentY);
    currentY += 8;

    // Table headers
    const headers = ['Student Name', 'Balance', 'Status'];
    const colWidths = [70, 40, 30];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const tableStartX = margin;

    // Header row
    pdf.setFillColor(79, 70, 229);
    pdf.rect(tableStartX, currentY, tableWidth, 8, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255);
    
    let colX = tableStartX;
    headers.forEach((header, index) => {
      pdf.text(header, colX + 2, currentY + 5.5);
      colX += colWidths[index];
    });
    currentY += 8;

    // Data rows
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0);

    outstandingStudents.forEach((student, index) => {
      if (currentY > 280) {
        pdf.addPage();
        currentY = margin;
      }

      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(tableStartX, currentY, tableWidth, 7, 'F');
      }

      colX = tableStartX;
      const rowData = [
        student.name.length > 25 ? student.name.substring(0, 22) + '...' : student.name,
        `₨ ${student.balance.toLocaleString()}`,
        student.status.charAt(0).toUpperCase() + student.status.slice(1)
      ];

      rowData.forEach((cell, cellIndex) => {
        pdf.text(cell, colX + 2, currentY + 5);
        colX += colWidths[cellIndex];
      });

      currentY += 7;
    });
    currentY += 10;
  }

  // Recent Payments Table
  if (recentPayments.length > 0) {
    if (currentY > 230) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recent Payments', margin, currentY);
    currentY += 8;

    // Table headers
    const headers = ['Date', 'Student', 'Amount'];
    const colWidths = [30, 70, 40];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const tableStartX = margin;

    // Header row
    pdf.setFillColor(79, 70, 229);
    pdf.rect(tableStartX, currentY, tableWidth, 8, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255);
    
    let colX = tableStartX;
    headers.forEach((header, index) => {
      pdf.text(header, colX + 2, currentY + 5.5);
      colX += colWidths[index];
    });
    currentY += 8;

    // Data rows
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0);

    recentPayments.slice(0, 10).forEach((payment, index) => {
      if (currentY > 280) {
        pdf.addPage();
        currentY = margin;
      }

      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(tableStartX, currentY, tableWidth, 7, 'F');
      }

      colX = tableStartX;
      const rowData = [
        payment.date,
        payment.student.length > 25 ? payment.student.substring(0, 22) + '...' : payment.student,
        `₨ ${payment.amount.toLocaleString()}`
      ];

      rowData.forEach((cell, cellIndex) => {
        pdf.text(cell, colX + 2, currentY + 5);
        colX += colWidths[cellIndex];
      });

      currentY += 7;
    });
  }

  // Add footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text(
      `Page ${i} of ${pageCount} | Agaicode Technologies - Fees Management System`,
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  pdf.save(fileName);
}

