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
  'Order Status': string;
}

export const exportToExcel = (data: ExcelRowData[], filename: string, orders: any[]) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert main data to worksheet
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
    { wch: 12 }, // Order Status
  ];
  ws['!cols'] = colWidths;

  // Calculate settlement summary
  const summaryData = calculateSettlementSummary(orders);
  
  // Add blank rows to separate main data from summary
  const startRow = data.length + 3; // Add 3 blank rows after main data
  
  // Add summary header
  const summaryHeader = ['Settlement Summary', '', ''];
  XLSX.utils.sheet_add_aoa(ws, [summaryHeader], { origin: startRow });
  
  // Add column headers for summary
  const columnHeaders = ['Outsource Name', 'Final Amount', 'Remark'];
  XLSX.utils.sheet_add_aoa(ws, [columnHeaders], { origin: startRow + 1 });
  
  // Add summary data rows
  if (summaryData.length > 0) {
    const summaryRows = summaryData.map(row => [
      row['Outsource Name'],
      row['Final Amount'],
      row['Remark']
    ]);
    XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: startRow + 2 });
  }

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
} => {
  // Calculate Delivery Charge: Total Amount Received - Item Charge
  const deliveryCharge = (order.total_amount_received || 0) - (order.item_charge || 0);

  // Calculate Profit: Delivery Charge - Outsource Charges
  const profit = deliveryCharge - (order.outsource_charges || 0);

  // Calculate Receivable or Payable using cash-flow formula
  
  // Step A: Calculate Driver Cash Held
  let driverCashHeld = 0;
  if (order.payment_mode === 'Cash on Delivery (COD)' || order.payment_mode === 'Cash on Pickup (COP)') {
    // If Payment Mode is "COD" or "COP": Driver Cash Held = Delivery Charge
    driverCashHeld = deliveryCharge;
  } else if (order.payment_mode === 'Online Payment') {
    // If Payment Mode is "ONLINE": Driver Cash Held = 0
    driverCashHeld = 0;
  }

  // Step B: Calculate Driver Earnings
  const driverEarnings = order.outsource_charges || 0;

  // Step C: Calculate Net Balance
  const netBalance = driverCashHeld - driverEarnings;

  // Step D: Output String for Column
  let receivablePayable = '';
  if (netBalance > 0) {
    // If Net Balance > 0: Return "Collect " + Net Balance + " from Outsource"
    receivablePayable = `Collect ${netBalance} from Outsource`;
  } else if (netBalance < 0) {
    // If Net Balance < 0: Return "Pay " + Math.abs(Net Balance) + " to Outsource"
    receivablePayable = `Pay ${Math.abs(netBalance)} to Outsource`;
  } else {
    // If Net Balance === 0: Return "Settled"
    receivablePayable = 'Settled';
  }

  return {
    deliveryCharge,
    profit,
    receivablePayable
  };
};

export const filterCompletedOrders = (orders: any[]): any[] => {
  return orders.filter(order => 
    order.order_status?.toUpperCase() === 'COMPLETED'
  );
};

export interface SettlementSummary {
  'Outsource Name': string;
  'Final Amount': number;
  'Remark': string;
}

export const calculateSettlementSummary = (orders: any[]): SettlementSummary[] => {
  // Group orders by outsource name and calculate net balance
  const outsourceBalances = orders.reduce((acc: any, order: any) => {
    const outsourceName = order.outsources?.name || 'Unassigned';
    
    // Calculate Driver Cash Held
    let driverCashHeld = 0;
    if (order.payment_mode === 'Cash on Delivery (COD)' || order.payment_mode === 'Cash on Pickup (COP)') {
      driverCashHeld = (order.total_amount_received || 0) - (order.item_charge || 0);
    } else if (order.payment_mode === 'Online Payment') {
      driverCashHeld = 0;
    }
    
    // Calculate Order Net
    const orderNet = driverCashHeld - (order.outsource_charges || 0);
    
    // Accumulate balance for this outsource
    if (!acc[outsourceName]) {
      acc[outsourceName] = 0;
    }
    acc[outsourceName] += orderNet;
    
    return acc;
  }, {});
  
  // Convert to summary format
  return Object.entries(outsourceBalances).map(([outsourceName, totalNet]) => {
    const net = totalNet as number;
    let finalAmount = 0;
    let remark = '';
    
    if (net > 0) {
      finalAmount = net;
      remark = 'Collect from Outsource';
    } else if (net < 0) {
      finalAmount = Math.abs(net);
      remark = 'Pay to Outsource';
    } else {
      finalAmount = 0;
      remark = 'Settled';
    }
    
    return {
      'Outsource Name': outsourceName,
      'Final Amount': finalAmount,
      'Remark': remark
    };
  });
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
      'Delivery Location': order.delivery_location || '',
      'Customer Contact Number': order.customer_contact_number || '',
      'Payment Mode': order.payment_mode || '',
      'Total Amount Received': order.total_amount_received || 0,
      'Delivery Charge': financials.deliveryCharge,
      'Item Charge': order.item_charge || 0,
      'Outsource Name': order.outsources?.name || '',
      'Outsource Charges': order.outsource_charges || 0,
      'Profit': financials.profit,
      'Order Status': order.order_status || 'PENDING'
    };
  });
};
