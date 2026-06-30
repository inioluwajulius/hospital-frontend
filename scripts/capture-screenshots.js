import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.join(process.cwd(), '..', '..', '..', '.gemini', 'antigravity-ide', 'brain', 'd67ffd19-943f-4e50-950a-ede62874479c', 'scratch');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('Starting screenshot capture...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Helper to inject mock auth state
  const mockLogin = async (role) => {
    await page.evaluate((role) => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({
        id: '123',
        name: 'Demo User',
        email: 'demo@medicare.com',
        role: role,
        hospitalId: 'h1'
      }));
    }, role);
  };

  // Mock API responses
  await page.route('**/api/dashboard/platform-stats', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          totalHospitals: 12,
          totalUsers: 3450,
          totalDoctors: 156,
          totalPatients: 3200,
          revenue: 125000,
          recentActivity: [
            { id: 1, action: 'New patient registered', time: '10 mins ago' },
            { id: 2, action: 'Doctor approved', time: '1 hour ago' }
          ]
        }
      })
    });
  });

  await page.route('**/api/doctor/list', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: Array(6).fill(null).map((_, i) => ({
          id: `doc${i}`,
          name: `Dr. Specialist ${i + 1}`,
          email: `dr${i}@medicare.com`,
          phone: '+1 555-010' + i,
          specialization: ['Cardiology', 'Neurology', 'Pediatrics'][i % 3],
          department: ['Cardiology', 'Neurology', 'Pediatrics'][i % 3],
          experience: 10 + i,
          availability: i % 4 === 0 ? 'On Leave' : 'Available'
        }))
      })
    });
  });

  await page.route('**/api/appointment/list', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: Array(5).fill(null).map((_, i) => ({
          id: `apt${i}`,
          patientName: `Patient ${i + 1}`,
          doctorName: `Dr. Smith`,
          date: new Date().toISOString(),
          appointmentDate: new Date().toISOString(),
          type: ['Checkup', 'Surgery', 'Consultation'][i % 3],
          status: ['Confirmed', 'In-Progress', 'Completed'][i % 3],
          reason: 'Routine checkup and follow up.'
        }))
      })
    });
  });

  try {
    // 1. Capture Login
    console.log('Capturing Login...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_Login.png'), fullPage: true });

    // 2. Capture Admin Dashboard
    console.log('Capturing Admin Dashboard...');
    await page.goto('http://localhost:5173/login');
    await mockLogin('admin');
    await page.goto('http://localhost:5173/admin/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_AdminDashboard.png'), fullPage: true });

    // 3. Capture Doctors List
    console.log('Capturing Doctors List...');
    await page.goto('http://localhost:5173/admin/doctors');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_DoctorsList.png'), fullPage: true });

    // 4. Capture Appointments
    console.log('Capturing Appointments...');
    await page.goto('http://localhost:5173/login');
    await mockLogin('doctor');
    await page.goto('http://localhost:5173/doctor/appointments');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_Appointments.png'), fullPage: true });

    console.log('Screenshots captured successfully!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

capture();
