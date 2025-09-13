const puppeteer = require('puppeteer');

class VTopClient {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    // Open browser visibly for debugging
    this.browser = await puppeteer.launch({ 
      headless: false, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    // Optional: set viewport
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  async login(username, password) {
    const loginUrl = 'https://vtop.vit.ac.in/';

    try {
      await this.page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Update selectors if VTOP has changed
      const usernameSelector = '#loginId';
      const passwordSelector = '#passwd';
      const submitSelector = '#submitBtn';
      const logoutSelector = 'a#logout';

      // Fill credentials
      await this.page.type(usernameSelector, username, { delay: 20 });
      await this.page.type(passwordSelector, password, { delay: 20 });
      await this.page.click(submitSelector);

      // Wait for either logout button or error message
      const result = await Promise.race([
        this.page.waitForSelector(logoutSelector, { timeout: 15000 }),
        this.page.waitForSelector('.error-msg', { timeout: 15000 }) // hypothetical error selector
      ]);

      if (await this.page.$(logoutSelector)) {
        return true; // login successful
      } else {
        return false; // login failed
      }
    } catch (err) {
      console.error('Login error:', err.message);
      return false;
    }
  }

  async getSchedule() {
    try {
      await this.page.goto('https://vtop.vit.ac.in/student/viewTimetable', { waitUntil: 'networkidle2', timeout: 20000 });
      return await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(r => {
          const cols = r.querySelectorAll('td');
          return {
            day: cols[0]?.innerText.trim() || '',
            time: cols[1]?.innerText.trim() || '',
            subject: cols[2]?.innerText.trim() || '',
            venue: cols[3]?.innerText.trim() || ''
          };
        });
      });
    } catch (err) {
      console.error('Schedule fetch error:', err.message);
      return [];
    }
  }

  async getAttendance() {
    try {
      await this.page.goto('https://vtop.vit.ac.in/student/viewAttendance', { waitUntil: 'networkidle2', timeout: 20000 });
      return await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(r => {
          const cols = r.querySelectorAll('td');
          return {
            subject: cols[0]?.innerText.trim() || '',
            attended: cols[1]?.innerText.trim() || '',
            total: cols[2]?.innerText.trim() || '',
            percent: cols[3]?.innerText.trim() || ''
          };
        });
      });
    } catch (err) {
      console.error('Attendance fetch error:', err.message);
      return [];
    }
  }

  async getMarks() {
    try {
      await this.page.goto('https://vtop.vit.ac.in/student/viewMarks', { waitUntil: 'networkidle2', timeout: 20000 });
      return await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map(r => {
          const cols = r.querySelectorAll('td');
          return {
            subject: cols[0]?.innerText.trim() || '',
            test: cols[1]?.innerText.trim() || '',
            marks: cols[2]?.innerText.trim() || ''
          };
        });
      });
    } catch (err) {
      console.error('Marks fetch error:', err.message);
      return [];
    }
  }

  async close() {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
    } catch (e) {
      console.error('Close error:', e);
    }
  }
}

module.exports = VTopClient;


