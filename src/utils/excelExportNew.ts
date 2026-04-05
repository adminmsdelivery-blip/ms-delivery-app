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
  'Outsource holding(Amt)': number;
  'My holding(Amt)': number;
}

export const exportToExcel = (data: ExcelRowData[], filename: string, orders: any[]) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Build main data with static values for json_to_sheet
  const mainData = orders.map((order, index) => {
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
      'Delivery Charge': financials.deliveryCharge, // Static value for now
      'Item Charge': order.item_charge || 0,
      'Outsource Name': order.outsources?.name || '',
      'Outsource Charges': order.outsource_charges || 0,
      'Profit': financials.profit, // Static value for now
      'Net Settlement (Helper)': 0, // Static placeholder
      'Outsource holding(Amt)': 0, // Static placeholder
      'My holding(Amt)': order.outsource_charges || 0 // Static value for now
    };
  });

  // Create worksheet with static data
  const ws = XLSX.utils.json_to_sheet(mainData);

  // Inject formulas directly into worksheet cells
  // Assuming data starts on row 2
  for (let i = 0; i < mainData.length; i++) {
    const r = i + 2; // Excel row number
    
    // Delivery Charge (J)
    ws[`J${r}`] = { t: 'n', f: `I${r}-K${r}` };
    
    // Profit (N)
    ws[`N${r}`] = { t: 'n', f: `J${r}-M${r}` };
    
    // Col O (Driver Cash Held): Cash driver collected from COD/COP delivery charges
    ws[`O${r}`] = { t: 'n', f: `IF(OR(UPPER(H${r})="COD", UPPER(H${r})="COP"), J${r}, 0)` };
    
    // Col P (Driver Earnings/Our Liability): Outsource charges we owe the driver
    ws[`P${r}`] = { t: 'n', f: `M${r}` };
  }

  // Set column widths for better readability (A-Q)
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
    { wch: 20 }, // P: Outsource holding(Amt)
    { wch: 16 }, // Q: My holding(Amt)
  ];
  ws['!cols'] = colWidths;

  // Get unique outsource names correctly from data payload
  const uniqueOutsources = [...new Set(
    mainData
      .map(row => row['Outsource Name'])
      .filter(name => name && name !== 'Outsource name' && name.trim() !== '')
  )];

  // Calculate where to start the summary
  const lastDataRow = mainData.length + 1; // Assuming row 1 is main headers
  const summaryStartRow = lastDataRow + 2; // Leave a blank row

  // 1. Write the Summary Title and Headers manually
  ws[XLSX.utils.encode_cell({ r: summaryStartRow, c: 0 })] = { t: 's', v: "Settlement Summary" };
  ws[XLSX.utils.encode_cell({ r: summaryStartRow + 1, c: 0 })] = { t: 's', v: "Outsource name" };
  ws[XLSX.utils.encode_cell({ r: summaryStartRow + 1, c: 1 })] = { t: 's', v: "Total amount hold by outsource" };
  ws[XLSX.utils.encode_cell({ r: summaryStartRow + 1, c: 2 })] = { t: 's', v: "Total amount hold by us" };
  ws[XLSX.utils.encode_cell({ r: summaryStartRow + 1, c: 3 })] = { t: 's', v: "NET AMOUNT PAYABLE OR RECEIVABLE" };
  ws[XLSX.utils.encode_cell({ r: summaryStartRow + 1, c: 4 })] = { t: 's', v: "Remark" };

  // 2. Loop through unique drivers
  let currentRow = summaryStartRow + 2; 

  uniqueOutsources.forEach(outsourceName => {
    // Skip empty names or accidental header strings
    if (!outsourceName || outsourceName.toLowerCase().includes("outsource name")) return; 

    const excelSumRow = currentRow + 1; // 1-indexed for Excel formulas

    // Col A: Driver Name
    ws[XLSX.utils.encode_cell({ r: currentRow, c: 0 })] = { t: 's', v: outsourceName };
    // Col B: Hold by Outsource (Sum Column O)
    ws[XLSX.utils.encode_cell({ r: currentRow, c: 1 })] = { t: 'n', f: `SUMIF(L2:L${lastDataRow}, A${excelSumRow}, O2:O${lastDataRow})` };
    // Col C: Hold by Us (Sum Column P)
    ws[XLSX.utils.encode_cell({ r: currentRow, c: 2 })] = { t: 'n', f: `SUMIF(L2:L${lastDataRow}, A${excelSumRow}, P2:P${lastDataRow})` };
    // Col D: Net Amount
    ws[XLSX.utils.encode_cell({ r: currentRow, c: 3 })] = { t: 'n', f: `ABS(B${excelSumRow} - C${excelSumRow})` };
    // Col E: Remark
    ws[XLSX.utils.encode_cell({ r: currentRow, c: 4 })] = { t: 's', f: `IF(B${excelSumRow} > C${excelSumRow}, "You have to collect", IF(B${excelSumRow} < C${excelSumRow}, "You have to pay", "Settled"))` };

    currentRow++;
  });

  // 3. CRITICAL: Expand the worksheet range so it doesn't get cut off
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: currentRow, c: 20 }
  });

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
      'Net Settlement (Helper)': 0, // Placeholder - will be calculated by Excel formula
      'Outsource holding(Amt)': 0, // Placeholder - will be calculated by Excel formula
      'My holding(Amt)': 0 // Placeholder - will be calculated by Excel formula
    };
  });
};
