const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'db.json');
const INITIAL_DATA_FILE = path.join(__dirname, 'initialData.json');

class DBStore {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading db.json, re-initializing:', err);
        this.resetFromInitial();
      }
    } else {
      this.resetFromInitial();
    }

    // Ensure users array and default admin exists
    if (!this.data.users || this.data.users.length === 0) {
      const defaultHash = bcrypt.hashSync('admin12', 10);
      this.data.users = [
        {
          id: 'admin-1',
          username: 'admin',
          passwordHash: defaultHash,
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      this.save();
    }

    // Ensure arrays for messages, bookings, subscribers exist
    if (!this.data.messages) this.data.messages = [];
    if (!this.data.bookings) this.data.bookings = [];
    if (!this.data.subscribers) this.data.subscribers = [];

    this.save();
  }

  resetFromInitial() {
    let initial = {};
    if (fs.existsSync(INITIAL_DATA_FILE)) {
      initial = JSON.parse(fs.readFileSync(INITIAL_DATA_FILE, 'utf8'));
    }
    const defaultHash = bcrypt.hashSync('admin12', 10);
    this.data = {
      siteConfig: initial.siteConfig || {},
      stats: initial.stats || [],
      process: initial.process || [],
      testimonials: initial.testimonials || [],
      services: initial.services || [],
      products: initial.products || [],
      projects: initial.projects || [],
      users: [
        {
          id: 'admin-1',
          username: 'admin',
          passwordHash: defaultHash,
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      messages: [],
      bookings: [],
      subscribers: []
    };
    this.save();
  }

  save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    this.save();
    return this.data[key];
  }
}

module.exports = new DBStore();
