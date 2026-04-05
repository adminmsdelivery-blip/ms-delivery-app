import * as XLSX from 'xlsx';

export interface ExcelRowData {
  'Order Date': string;
  'Order Number': string;
  'Client Name': string;
  'Pickup Location': string;
  'Customer Name': string;
  'Delivery Location': string;
  'Customer Contact Number': string;
  'Payment Mode': string;
  'Total Amount Received': number;
  'Delivery Charge': number;
  'Item Charge': number;
  'Outsource Name': string;
  'Outsource Charges': number;
  'Profit': number;
  'Receivable / Payable': string;
}

export const exportToExcel = (data: ExcelRowData[], filename: string) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths for better readability
  const colWidths = [
    { wch: 12 }, // Order Date
    { wch: 15 }, // Order Number
    { wch: 20 }, // Client Name
    { wch: 25 }, // Pickup Location
    { wch: 20 }, // Customer Name
    { wch: 25 }, // Delivery Location
    { wch: 18 }, // Customer Contact Number
    { wch: 15 }, // Payment Mode
    { wch: 18 }, // Total Amount Received
    { wch: 15 }, // Delivery Charge
    { wch: 12 }, // Item Charge
    { wch: 20 }, // Outsource Name
    { wch: 16 }, // Outsource Charges
    { wch: 10 }, // Profit
    { wch: 18 }, // Receivable / Payable
  ];
  ws['!cols'] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Settlement Report');

  // Generate the Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  // Create a Blob from the buffer
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Create a download link and trigger the download
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const calculateFinancials = (order: any): {
  deliveryCharge: number;
  profit: number;
  receivablePayable: string;
  totalAmountReceived: number;
} => {
  // Calculate Total Amount Received based on Payment Mode
  let totalAmountReceived = 0;
  if (order.payment_mode === 'Cash on Delivery (COD)' || order.payment_mode === 'Cash on Pickup (COP)') {
    totalAmountReceived = order.total_amount_received || (order.item_charge + order.delivery_charges);
  }
  // For Online Payment, total_amount_received should be manually entered or 0

  // Calculate Delivery Charge (this might be the total charge minus item charge)
  const deliveryCharge = order.delivery_charges || 0;

  // Calculate Profit
  const profit = deliveryCharge - (order.outsource_charges || 0);

  // Calculate Receivable/Payable
  let receivablePayable = 'Settled: 0';
  const net = totalAmountReceived - (order.outsource_charges || 0);
  
  if (net > 0) {
    receivablePayable = `Receivable: ${Math.abs(net).toFixed(2)}`;
  } else if (net < 0) {
    receivablePayable = `Payable: ${Math.abs(net).toFixed(2)}`;
  }

  return {
    deliveryCharge,
    profit,
    receivablePayable,
    totalAmountReceived
  };
};

export const mapOrdersToExcelData = (orders: any[]): ExcelRowData[] => {
  return orders.map(order => {
    const financials = calculateFinancials(order);
    
    return {
      'Order Date': order.order_date || '',
      'Order Number': order.order_number || '',
      'Client Name': order.clients?.name || 'Unknown Client',
      'Pickup Location': order.pickup_location || '',
      'Customer Name': order.customer_name || '',
      'Delivery Location': order.drop_location || '',
      'Customer Contact Number': order.customer_contact_number || '',
      'Payment Mode': order.payment_mode || '',
      'Total Amount Received': financials.totalAmountReceived,
      'Delivery Charge': financials.deliveryCharge,
      'Item Charge': order.item_charge || 0,
      'Outsource Name': order.outsource_name || '',
      'Outsource Charges': order.outsource_charges || 0,
      'Profit': financials.profit,
      'Receivable / Payable': financials.receivablePayable
    };
  });
};
