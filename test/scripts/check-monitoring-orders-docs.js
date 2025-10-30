const mysql = require('mysql2/promise');
const moment = require('moment-timezone');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '34.94.89.132',
  user: process.env.DB_USERNAME || 'app',
  password: process.env.DB_PASSWORD || '5p8j7wNDekJjxrDz',
  database: process.env.DB_NAME || 'xml2db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Function to check if docs are received (matches frontend logic)
function hasDocsReceived(docsReceivedValue) {
  if (!docsReceivedValue) {
    return false;
  }
  
  const normalizedValue = String(docsReceivedValue).trim().toLowerCase();
  return normalizedValue === 'y' || normalizedValue === 'yes';
}

// Function to check if no docs (matches frontend logic)
function hasNoDocs(docsReceivedValue) {
  const normalizedValue = docsReceivedValue ? String(docsReceivedValue).trim().toLowerCase() : '';
  return normalizedValue === '' || 
         normalizedValue === 'n' || 
         normalizedValue === 'no' ||
         docsReceivedValue === null ||
         docsReceivedValue === undefined;
}

// Function to check if should show orange (within 6 hours of today's appointment)
function shouldShowOrange(row) {
  // Check if no docs
  if (!hasNoDocs(row.w_docs_received)) {
    return false; // Has docs, don't show orange
  }
  
  // Check if appointment date/time exists
  if (!row.w_Appointment_Date || !row.w_Appointment_Time) {
    return false; // Missing appointment info
  }
  
  try {
    // Parse appointment date and time (format: MM/DD/YYYY hh:mm A)
    const appointmentDateTime = moment(
      `${row.w_Appointment_Date} ${row.w_Appointment_Time}`,
      'MM/DD/YYYY hh:mm A'
    );
    
    // Validate that moment parsed correctly
    if (!appointmentDateTime.isValid()) {
      return false; // Invalid date
    }
    
    // Check if appointment is today
    const today = moment().tz('America/Los_Angeles').startOf('day');
    const appointmentDate = moment(appointmentDateTime).startOf('day');
    const isToday = today.isSame(appointmentDate);
    
    if (!isToday) {
      return false; // Not today
    }
    
    // Calculate hours until appointment
    const now = moment().tz('America/Los_Angeles');
    const hoursUntilAppointment = appointmentDateTime.diff(now, 'hours', true);
    
    // Show orange if appointment is within 6 hours from now (before or just after)
    return hoursUntilAppointment <= 6 && hoursUntilAppointment >= -0.5;
  } catch (error) {
    console.error(`Error parsing date for order ${row.Id}:`, error.message);
    return false;
  }
}

async function checkMonitoringOrders() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to database\n');
    
    // Get today's date in the format used by the database
    const today = moment().tz('America/Los_Angeles').format('YYYY-MM-DD');
    const todayFormatted = moment().tz('America/Los_Angeles').format('MM/DD/YYYY');
    
    console.log(`Checking monitoring orders for today: ${todayFormatted}\n`);
    
    // Query for monitoring orders (status = 'Assigned' and appointment date = today)
    const query = `
      SELECT 
        b.Id,
        b.w_Loan_Number,
        b.w_Borrower_First_Name,
        b.w_Borrower_Last_Name,
        b.w_Appointment_Date,
        b.w_Appointment_Time,
        b.w_sql_appointment_date,
        b.w_docs_received,
        b.f_status_web,
        b.confirmation_call_status,
        b.client_docs,
        b.client_docs_via,
        (SELECT COUNT(*) FROM document_count dc 
         WHERE dc.borrower_id = b.Id 
         AND dc.status = 'A' 
         AND dc.usertype != 'signer'
         AND dc.filename NOT LIKE '%merged.%'
         AND dc.filename NOT LIKE '%moved.%') as document_count
      FROM borrower b
      WHERE b.w_sql_appointment_date = CURDATE()
        AND b.f_status_web = 'Assigned'
        AND (b.f_signer_id IS NOT NULL AND b.f_signer_id != '')
      ORDER BY b.Id DESC
    `;
    
    const [rows] = await connection.execute(query);
    
    console.log(`Found ${rows.length} monitoring orders for today\n`);
    console.log('='.repeat(100));
    
    if (rows.length === 0) {
      console.log('No monitoring orders found for today.');
      return;
    }
    
    let issuesFound = 0;
    let correctDisplay = 0;
    
    rows.forEach((row, index) => {
      const borrowerName = `${row.w_Borrower_First_Name || ''} ${row.w_Borrower_Last_Name || ''}`.trim();
      const docsValue = row.w_docs_received || '(null/empty)';
      const shouldBeOrange = shouldShowOrange(row);
      const hasDocs = hasDocsReceived(row.w_docs_received);
      const noDocs = hasNoDocs(row.w_docs_received);
      
      // If it should be orange but has docs, that's an issue
      const isIssue = shouldBeOrange && hasDocs;
      
      if (isIssue) {
        issuesFound++;
        console.log(`\n⚠️  ISSUE #${issuesFound}: Order ID ${row.Id}`);
      } else {
        correctDisplay++;
      }
      
      console.log(`${isIssue ? '⚠️  ' : '✓  '}Order #${index + 1}: ID ${row.Id} | Loan: ${row.w_Loan_Number}`);
      console.log(`   Borrower: ${borrowerName}`);
      console.log(`   Appointment: ${row.w_Appointment_Date} ${row.w_Appointment_Time}`);
      console.log(`   w_docs_received: "${docsValue}" (raw: ${JSON.stringify(row.w_docs_received)})`);
      console.log(`   client_docs: ${row.client_docs || '(null)'}`);
      console.log(`   client_docs_via: ${row.client_docs_via || '(null)'}`);
      console.log(`   document_count: ${row.document_count || 0} documents in system`);
      console.log(`   Docs check - hasDocs: ${hasDocs}, noDocs: ${noDocs}`);
      console.log(`   Should show orange: ${shouldBeOrange}`);
      
      // Additional check: if there are documents in the system but w_docs_received is empty
      if ((row.document_count > 0 || row.client_docs === 'YES') && !hasDocs) {
        console.log(`   ⚠️  WARNING: Has documents (count: ${row.document_count}, client_docs: ${row.client_docs}) but w_docs_received is "${docsValue}"`);
      }
      
      if (isIssue) {
        console.log(`   ❌ PROBLEM: Has docs but would show orange!`);
      } else if (hasDocs && shouldBeOrange) {
        console.log(`   ❌ PROBLEM: Has docs but logic says orange!`);
      } else if (!hasDocs && !shouldBeOrange) {
        console.log(`   ⚠️  NOTE: No docs but won't show orange (might be outside 6-hour window)`);
      }
      console.log('');
    });
    
    console.log('='.repeat(100));
    console.log(`\nSummary:`);
    console.log(`  Total orders: ${rows.length}`);
    console.log(`  Correct display: ${correctDisplay}`);
    console.log(`  Issues found: ${issuesFound}`);
    
    // Check for data inconsistencies
    let dataInconsistencies = 0;
    rows.forEach(row => {
      if ((row.document_count > 0 || row.client_docs === 'YES') && !hasDocsReceived(row.w_docs_received)) {
        dataInconsistencies++;
      }
    });
    
    if (dataInconsistencies > 0) {
      console.log(`\n⚠️  DATA INCONSISTENCY: ${dataInconsistencies} orders have documents but w_docs_received is not set to 'Y'`);
      console.log(`   These orders will incorrectly show orange even though they have documents.`);
      console.log(`   Consider running fix-docs-received.sql to update the database.`);
    }
    
    if (issuesFound > 0) {
      console.log(`\n❌ Found ${issuesFound} orders that have docs but would incorrectly show orange!`);
      console.log(`   Check the w_docs_received values in the database.`);
    } else if (dataInconsistencies === 0) {
      console.log(`\n✓ All orders correctly configured - no issues found!`);
    }
    
  } catch (error) {
    console.error('Error checking monitoring orders:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
  }
}

// Run the check
checkMonitoringOrders()
  .then(() => {
    console.log('\n✓ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  });
