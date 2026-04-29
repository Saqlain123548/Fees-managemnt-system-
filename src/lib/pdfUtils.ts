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

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  try {
    const logoImg = new Image();
    logoImg.src = '/assets/Agaicode2.png';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
    });

    const logoMaxWidth = pageWidth - (margin * 2);
    const logoAspectRatio = logoImg.width / logoImg.height;
    const logoWidth = Math.min(logoMaxWidth, 55);
    const logoHeight = logoWidth / logoAspectRatio;

    pdf.addImage(logoImg, 'PNG', margin, margin, logoWidth, logoHeight);
    currentY = margin + logoHeight + 15;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text('Agaicode Technologies', pageWidth / 2, margin + 25, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237);
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

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  pdf.setDrawColor(200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  pdf.setTextColor(0);

  try {
    const canvas = await html2canvas(contentElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (currentY + imgHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error capturing content:', error);
    throw new Error('Failed to capture content for PDF');
  }

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

  pdf.save(fileName);
}

/**
 * Generates a PDF for student list
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

  try {
    const logoImg = new Image();
    logoImg.src = '/assets/Agaicode2.png';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
    });

    const logoMaxWidth = pageWidth - (margin * 2);
    const logoAspectRatio = logoImg.width / logoImg.height;
    const logoWidth = Math.min(logoMaxWidth, 55);
    const logoHeight = logoWidth / logoAspectRatio;

    pdf.addImage(logoImg, 'PNG', margin, margin, logoWidth, logoHeight);
    currentY = margin + logoHeight + 15;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text('Agaicode Technologies', pageWidth / 2, margin + 25, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237);
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

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Students List', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
  pdf.text(`Total Students: ${students.length}`, pageWidth / 2, currentY + 5, { align: 'center' });
  currentY += 15;

  pdf.setTextColor(0);
  pdf.setDrawColor(200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  const headers = ['Name', 'Email', 'Contact', 'Join Date'];
  const colWidths = [50, 60, 35, 35];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const startX = (pageWidth - tableWidth) / 2;

  pdf.setFillColor(79, 70, 229);
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

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0);

  students.forEach((student, index) => {
    if (currentY > 270) {
      pdf.addPage();
      currentY = margin;
    }

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
      let cellText = cell;
      if (cellText.length > 25) {
        cellText = cellText.substring(0, 22) + '...';
      }
      pdf.text(cellText, colX + 2, currentY + 5);
      colX += colWidths[cellIndex];
    });

    currentY += 7;
  });

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

  const { summary, outstandingStudents, recentPayments } = reportData;

  try {
    const logoImg = new Image();
    logoImg.src = '/assets/Agaicode2.png';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
    });

    const logoMaxWidth = pageWidth - (margin * 2);
    const logoAspectRatio = logoImg.width / logoImg.height;
    const logoWidth = Math.min(logoMaxWidth, 55);
    const logoHeight = logoWidth / logoAspectRatio;

    pdf.addImage(logoImg, 'PNG', margin, margin, logoWidth, logoHeight);

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text('Agaicode Technologies', pageWidth / 2, margin + 25, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237);
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

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Financial Reports', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  pdf.setTextColor(0);
  pdf.setDrawColor(200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Summary', margin, currentY);
  currentY += 8;

  const summaryItems = [
    { label: 'Total Students', value: summary.totalStudents.toString() },
    { label: 'Total Collected', value: `₨ ${summary.totalCollected.toLocaleString()}` },
    { label: 'Total Outstanding', value: `₨ ${summary.totalOutstanding.toLocaleString()}` },
  ];

  const cardWidth = (pageWidth - margin * 2 - 20) / 3;

  summaryItems.forEach((item, index) => {
    const cardX = margin + (index * (cardWidth + 10));
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(cardX, currentY, cardWidth, 25, 3, 3, 'F');
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

  if (outstandingStudents.length > 0) {
    if (currentY > 230) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Outstanding Payments', margin, currentY);
    currentY += 8;

    const headers = ['Student Name', 'Balance', 'Status'];
    const colWidths = [70, 40, 30];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const tableStartX = margin;

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

  if (recentPayments.length > 0) {
    if (currentY > 230) {
      pdf.addPage();
      currentY = margin;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recent Payments', margin, currentY);
    currentY += 8;

    const headers = ['Date', 'Student', 'Amount'];
    const colWidths = [30, 70, 40];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const tableStartX = margin;

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
 * Generates a PDF for company expenses report
 */
export async function generateExpensesPDF(
  expenses: Array<{
    id: string;
    expenseDate: string;
    type: string;
    description: string;
    amount: number;
    status: string;
  }>,
  fileName: string = 'company-expenses-report.pdf'
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = margin;

  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  try {
    const logoImg = new Image();
    logoImg.src = '/assets/Agaicode2.png';
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
    });

    const logoMaxWidth = pageWidth - (margin * 2);
    const logoAspectRatio = logoImg.width / logoImg.height;
    const logoWidth = Math.min(logoMaxWidth, 55);
    const logoHeight = logoWidth / logoAspectRatio;

    pdf.addImage(logoImg, 'PNG', margin, margin, logoWidth, logoHeight);
    currentY = margin + logoHeight + 15;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text('AGAICODE TECHNOLOGIES', pageWidth / 2, margin + 25, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237);
    pdf.text('Fees Management', pageWidth / 2, margin + 33, { align: 'center' });

    pdf.setTextColor(0);
    currentY = margin + logoHeight + 40;
  } catch (error) {
    console.error('Error loading logo:', error);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text('AGAICODE TECHNOLOGIES', pageWidth / 2, currentY + 5, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(124, 58, 237);
    pdf.text('Fees Management', pageWidth / 2, currentY + 12, { align: 'center' });
    pdf.setTextColor(0);
    currentY += 20;
  }

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Company Expenses Report', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(`Date of download: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  pdf.setTextColor(0);
  pdf.setDrawColor(200);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  if (expenses.length > 0) {
    const headers = ['Date', 'Type', 'Description', 'Price (Rs)', 'Status'];
    const colWidths = [25, 30, 65, 25, 25];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const tableStartX = (pageWidth - tableWidth) / 2;

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

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0);

    expenses.forEach((expense, index) => {
      if (currentY > 270) {
        pdf.addPage();
        currentY = margin;
        pdf.setFillColor(79, 70, 229);
        pdf.rect(tableStartX, currentY, tableWidth, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255);
        let hColX = tableStartX;
        headers.forEach((header, hIndex) => {
          pdf.text(header, hColX + 2, currentY + 5.5);
          hColX += colWidths[hIndex];
        });
        currentY += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0);
      }

      if (index % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(tableStartX, currentY, tableWidth, 7, 'F');
      }

      colX = tableStartX;
      const rowData = [
        expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
        expense.type,
        expense.description ? (expense.description.length > 32 ? expense.description.substring(0, 29) + '...' : expense.description) : '—',
        `Rs ${expense.amount.toLocaleString()}`,
        expense.status
      ];

      rowData.forEach((cell, cellIndex) => {
        if (cellIndex === 4) {
          if (cell === 'Paid') pdf.setTextColor(16, 185, 129);
          else if (cell === 'Pending') pdf.setTextColor(245, 158, 11);
          else if (cell === 'Due') pdf.setTextColor(239, 68, 68);
        }
        pdf.text(String(cell), colX + 2, currentY + 5);
        if (cellIndex === 4) pdf.setTextColor(0);
        colX += colWidths[cellIndex];
      });

      currentY += 7;
    });

    currentY += 10;

    pdf.setFillColor(238, 242, 255);
    pdf.rect(tableStartX, currentY, tableWidth, 9, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Total Expenses:', tableStartX + 2, currentY + 6.5);
    pdf.text(`Rs ${totalAmount.toLocaleString()}`, tableStartX + tableWidth - colWidths[4] - colWidths[3] + 2, currentY + 6.5);
    currentY += 15;
  } else {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(150);
    pdf.text('No expenses recorded.', pageWidth / 2, currentY + 5, { align: 'center' });
    pdf.setTextColor(0);
    currentY += 15;
  }

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
