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
  'Net Settlement (Helper)': number;
}

export const exportToExcel = (data: ExcelRowData[], filename: string, orders: any[]) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create worksheet with Excel formulas using aoa_to_sheet
  // Headers (Row 1)
  const headers = [
    'Order Date',
    'Order Number', 
    'Client Name',
    'Pickup Location',
    'Customer Name',
    'Delivery Location',
    'Customer Contact Number',
    'Payment Mode',
    'Total Amount Received',
    'Delivery Charge',
    'Item Charge',
    'Outsource Name',
    'Outsource Charges',
    'Profit',
    'Net Settlement (Helper)'
  ];

  // Data rows with formulas (starting from Row 2)
  const wsData = [headers];
  
  orders.forEach((order, index) => {
    const row = index + 2; // Excel row number (starting from 2)
    
    wsData.push([
      order.order_date || '',
      order.order_number || '',
      order.clients?.name || 'Unknown Client',
      order.pickup_location || '',
      order.customer_name || '',
      order.delivery_location || '',
      order.customer_contact_number || '',
      order.payment_mode || '',
      order.total_amount_received || 0,
      { t: 'n', f: `I${row}-K${row}` }, // Delivery Charge = Total Amount - Item Charge
      order.item_charge || 0,
      order.outsources?.name || '',
      order.outsource_charges || 0,
      { t: 'n', f: `J${row}-M${row}` }, // Profit = Delivery Charge - Outsource Charges
      { t: 'n', f: `IF(OR(H${row}="COD", H${row}="COP"), J${row}-M${row}, 0-M${row})` } // Net Settlement
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability (A-O)
  const colWidths = [
    { wch: 12 }, // A: Order Date
    { wch: 15 }, // B: Order Number
    { wch: 20 }, // C: Client Name
    { wch: 25 }, // D: Pickup Location
    { wch: 20 }, // E: Customer Name
    { wch: 25 }, // F: Delivery Location
    { wch: 18 }, // G: Customer Contact Number
    { wch: 15 }, // H: Payment Mode
    { wch: 18 }, // I: Total Amount Received
    { wch: 15 }, // J: Delivery Charge
    { wch: 12 }, // K: Item Charge
    { wch: 20 }, // L: Outsource Name
    { wch: 16 }, // M: Outsource Charges
    { wch: 10 }, // N: Profit
    { wch: 18 }, // O: Net Settlement (Helper)
  ];
  ws['!cols'] = colWidths;

  // Calculate settlement summary with dynamic formulas
  const summaryData = calculateSettlementSummary(orders);
  
  // Add blank rows to separate main data from summary
  const lastRow = orders.length + 1; // Last row of main data
  const summaryStartRow = lastRow + 4; // Start summary 4 rows below
  
  // Add summary header
  XLSX.utils.sheet_add_aoa(ws, [
    ['Settlement Summary'],
    ['Outsource Name', 'Final Amount', 'Remark']
  ], { origin: summaryStartRow });
  
  // Add summary rows with dynamic formulas
  const summaryRows = summaryData.map((summary, index) => {
    const currentRow = summaryStartRow + 2 + index;
    const outsourceName = summary['Outsource Name'];
    
    return [
      outsourceName,
      { t: 'n', f: `ABS(SUMIF(L2:L${lastRow}, "${outsourceName}", O2:O${lastRow}))` },
      { t: 's', f: `IF(SUMIF(L2:L${lastRow}, "${outsourceName}", O2:O${lastRow}) > 0, "Collect from Outsource", IF(SUMIF(L2:L${lastRow}, "${outsourceName}", O2:O${lastRow}) < 0, "Pay to Outsource", "Settled"))` }
    ];
  });
  
  XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: summaryStartRow + 2 });

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Settlement Report");

  // Write the file
  XLSX.writeFile(wb, `${filename}.xlsx`);
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
      'Net Settlement (Helper)': 0 // Placeholder - will be calculated by Excel formula
    };
  });
};
