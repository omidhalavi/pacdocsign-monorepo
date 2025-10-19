const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

// Database connection configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'pacdoc_prod',
  process.env.DB_USERNAME || 'root',
  process.env.DB_PASSWORD || '',
  {
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    dialectModule: mysql2,
    dialectOptions: { 
      connectTimeout: 30000,
      socketPath: process.env.DB_SOCKET_PATH || '/cloudsql/pacdocv2-api-prod:us-west2:pacdoc-prod-1'
    },
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 20000,
    },
  }
);

async function checkOrderInDatabase() {
  console.log('🔍 Checking order 2161928 in database...');
  console.log('===============================================================');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Query for the specific order
    const [results] = await sequelize.query(`
      SELECT 
        Id,
        w_Borrower_First_Name,
        w_Borrower_Last_Name,
        w_Loan_Number,
        w_Appointment_Date,
        w_Appointment_Time,
        clientID,
        division_id,
        f_signer_id,
        Contact_ID,
        created_at,
        updated_at
      FROM borrower 
      WHERE Id = 2161928
    `);

    if (results.length > 0) {
      console.log('✅ Order 2161928 FOUND in database:');
      console.log('📋 Order Details:');
      const order = results[0];
      Object.entries(order).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

      // Check if there are any document activity records for this order
      const [docActivity] = await sequelize.query(`
        SELECT 
          id,
          userid,
          usertype,
          action,
          orderid,
          filename,
          date_time
        FROM document_activity 
        WHERE orderid = 2161928
        ORDER BY date_time DESC
        LIMIT 10
      `);

      if (docActivity.length > 0) {
        console.log(`\n📄 Found ${docActivity.length} document activity records:`);
        docActivity.forEach(activity => {
          console.log(`   - ${activity.action}: ${activity.filename} (${activity.usertype}) - ${activity.date_time}`);
        });
      } else {
        console.log('\n❌ No document activity records found for order 2161928');
      }

      // Check document count table
      const [docCount] = await sequelize.query(`
        SELECT 
          id,
          borrower_id,
          filename,
          usertype,
          user_id,
          create_on,
          status
        FROM document_count 
        WHERE borrower_id = 2161928
        ORDER BY create_on DESC
        LIMIT 10
      `);

      if (docCount.length > 0) {
        console.log(`\n📊 Found ${docCount.length} document count records:`);
        docCount.forEach(count => {
          console.log(`   - ${count.filename} (${count.usertype}) - Status: ${count.status} - ${count.create_on}`);
        });
      } else {
        console.log('\n❌ No document count records found for order 2161928');
      }

    } else {
      console.log('❌ Order 2161928 NOT FOUND in database');
      
      // Check what order IDs exist around this range
      const [nearbyOrders] = await sequelize.query(`
        SELECT Id, w_Borrower_Last_Name, created_at
        FROM borrower 
        WHERE Id BETWEEN 2161900 AND 2162000
        ORDER BY Id
        LIMIT 10
      `);

      if (nearbyOrders.length > 0) {
        console.log('\n🔍 Nearby order IDs found:');
        nearbyOrders.forEach(order => {
          console.log(`   - ID: ${order.Id}, Name: ${order.w_Borrower_Last_Name}, Created: ${order.created_at}`);
        });
      } else {
        console.log('\n❌ No orders found in the range 2161900-2162000');
      }
    }

  } catch (error) {
    console.error('❌ Database query failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkOrderInDatabase().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

