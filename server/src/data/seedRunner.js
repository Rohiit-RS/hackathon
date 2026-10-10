const fs = require('fs');
const path = require('path');
const seedData = require('./seedData');

const DB_FILE = path.join(__dirname, 'db.json');

function runSeed() {
  console.log('🌱 Seeding CivicTrack Database...');
  fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf8');
  console.log('✅ Successfully seeded:');
  console.log(`   - ${seedData.users.length} Users (Citizen, Officers, Admin)`);
  console.log(`   - ${seedData.departments.length} Municipal Departments`);
  console.log(`   - ${seedData.contractors.length} Contractors`);
  console.log(`   - ${seedData.projects.length} Public Works Projects`);
  console.log(`   - ${seedData.reports.length} Citizen Issue Reports`);
  console.log(`   - ${seedData.verifications.length} Trust Verifications (Quorum & Disputes)`);
  console.log(`   - ${seedData.workOrders.length} Coordinated Work Orders`);
  console.log(`   - ${seedData.alerts.length} Area Alerts`);
  console.log('✨ Seed complete!');
}

runSeed();
