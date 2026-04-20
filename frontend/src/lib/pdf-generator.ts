import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateHistoryPDF = (
  history: any[],
  companyName: string,
  walletAddress: string
) => {
  const doc = new jsPDF();

  // Header - VL REGISTRY Branding
  doc.setFillColor(1, 45, 29); // #012d1d
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BLOCK CARBON', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL ENVIRONMENTAL ACTIVITY LEDGER', 15, 32);

  // Company Info
  doc.setTextColor(1, 45, 29);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('STATEMENT OF ACTIVITY', 15, 55);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Company: ${companyName}`, 15, 62);
  doc.text(`Wallet: ${walletAddress}`, 15, 67);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 72);

  // Table Data Preparation
  const tableData = history.map(event => {
    let type = 'ACTIVITY';
    let amount = 'N/A';
    let project = 'Registry Project';
    
    switch(event.action) {
      case 'SALE':
        type = 'PURCHASE';
        amount = `${(event.payload?.amount || 0).toLocaleString()} MT`;
        project = event.batch?.producer?.name || 'Carbon Project';
        break;
      case 'RETIREMENT':
        type = 'RETIREMENT';
        amount = `${(event.payload?.amount || 0).toLocaleString()} MT`;
        project = event.batch?.producer?.name || 'Carbon Project';
        break;
      case 'SUBMISSION':
        type = 'SUBMISSION';
        amount = `${(event.payload?.quantity || 0).toLocaleString()} MT`;
        project = event.batch?.producer?.name || 'Carbon Project';
        break;
      case 'APPROVAL':
        type = 'VERIFICATION';
        amount = `${(event.payload?.quantity || 0).toLocaleString()} MT`;
        project = event.batch?.producer?.name || 'Carbon Project';
        break;
      default:
        type = event.action.replace('CREDITS_', '').replace('_', ' ');
    }

    const date = new Date(event.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return [
      date,
      project,
      type,
      amount,
      event.txHash ? `${event.txHash.slice(0, 10)}...` : 'REGISTERED'
    ];
  });

  // Generate Table
  autoTable(doc, {
    startY: 85,
    head: [['Date', 'Project', 'Activity', 'Volume', 'Reference #']],
    body: tableData,
    headStyles: {
      fillColor: [27, 67, 50], // #1b4332
      textColor: [107, 254, 156], // #6bfe9c
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [65, 72, 68] // #414844
    },
    alternateRowStyles: {
      fillColor: [244, 250, 253] // #f4fafd
    },
    margin: { left: 15, right: 15 }
  });


  // Footer / Security Proof
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Block Carbon Universal Registry - Immutable Blockchain Ledger Statement - Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }

  // Download
  const filename = `Block-Carbon-History-${companyName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
