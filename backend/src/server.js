require('dotenv').config();
const app = require('./app');
const { initDb, query } = require('./database/db');
const seed = require('./database/seed');

const PORT = process.env.PORT || 5050;

async function startServer() {
  try {
    console.log('🚀 Initializing BBMS Backend Server...');
    await initDb();

    // Check if database needs seeding
    const usersCount = await query('SELECT COUNT(*) as count FROM users;');
    const count = parseInt(usersCount.rows[0]?.count || 0);

    if (count === 0) {
      console.log('📦 Empty database detected. Running initial seed...');
      await seed();
    } else {
      console.log(`📊 Database loaded with existing records (${count} users).`);
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🩸 BBMS Backend Server running on http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🛡️  JWT RBAC Enabled: Super Admin, Org Admin, Volunteer, Donor, Hospital`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to start BBMS server:', err);
    process.exit(1);
  }
}

startServer();
