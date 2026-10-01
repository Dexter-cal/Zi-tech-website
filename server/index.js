const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./data/dbStore');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'zitech-super-secret-key-2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Middleware for authenticating JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

/* ===================================================================
   PUBLIC API ENDPOINTS
   =================================================================== */

app.get('/api/config', (req, res) => {
  res.json(db.get('siteConfig'));
});

app.get('/api/services', (req, res) => {
  res.json(db.get('services'));
});

app.get('/api/products', (req, res) => {
  res.json(db.get('products'));
});

app.get('/api/projects', (req, res) => {
  res.json(db.get('projects'));
});

app.get('/api/testimonials', (req, res) => {
  res.json(db.get('testimonials'));
});

app.get('/api/stats', (req, res) => {
  res.json(db.get('stats'));
});

app.get('/api/process', (req, res) => {
  res.json(db.get('process'));
});

// Contact message submission
app.post('/api/contact', (req, res) => {
  const { name, email, phone, service, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const messages = db.get('messages');
  const newMessage = {
    id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name,
    email,
    phone: phone || '',
    service: service || 'General',
    subject: subject || 'New Inquiry',
    message,
    status: 'unread',
    createdAt: new Date().toISOString()
  };

  messages.unshift(newMessage);
  db.set('messages', messages);

  res.status(201).json({ success: true, message: 'Message sent successfully', data: newMessage });
});

// Consultation Booking submission
app.post('/api/bookings', (req, res) => {
  const { name, email, phone, company, service, preferredDate, notes } = req.body;
  if (!name || !email || !service) {
    return res.status(400).json({ error: 'Name, email, and service are required' });
  }

  const bookings = db.get('bookings');
  const newBooking = {
    id: 'bk-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    name,
    email,
    phone: phone || '',
    company: company || '',
    service,
    preferredDate: preferredDate || '',
    notes: notes || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  bookings.unshift(newBooking);
  db.set('bookings', bookings);

  res.status(201).json({ success: true, message: 'Booking requested successfully', data: newBooking });
});

// Newsletter subscription
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  const subscribers = db.get('subscribers');
  const exists = subscribers.some(s => s.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.json({ success: true, message: 'You are already subscribed to our newsletter' });
  }

  const newSub = {
    id: 'sub-' + Date.now(),
    email,
    createdAt: new Date().toISOString()
  };

  subscribers.unshift(newSub);
  db.set('subscribers', subscribers);

  res.status(201).json({ success: true, message: 'Subscribed successfully', data: newSub });
});

/* ===================================================================
   AUTHENTICATION ENDPOINTS
   =================================================================== */

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = db.get('users');
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const users = db.get('users');
  const userIndex = users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const valid = bcrypt.compareSync(currentPassword, users[userIndex].passwordHash);
  if (!valid) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  users[userIndex].passwordHash = bcrypt.hashSync(newPassword, 10);
  db.set('users', users);

  res.json({ success: true, message: 'Password updated successfully' });
});

/* ===================================================================
   ADMIN MANAGED ENDPOINTS (PROTECTED)
   =================================================================== */

// Get admin stats / dashboard summary
app.get('/api/admin/dashboard', authMiddleware, (req, res) => {
  const messages = db.get('messages');
  const bookings = db.get('bookings');
  const subscribers = db.get('subscribers');
  const services = db.get('services');
  const products = db.get('products');
  const projects = db.get('projects');

  res.json({
    unreadMessages: messages.filter(m => m.status === 'unread').length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    totalSubscribers: subscribers.length,
    totalServices: services.length,
    totalProducts: products.length,
    totalProjects: projects.length,
    recentMessages: messages.slice(0, 5),
    recentBookings: bookings.slice(0, 5)
  });
});

// Manage Site Config
app.put('/api/admin/config', authMiddleware, (req, res) => {
  const newConfig = req.body;
  if (!newConfig || typeof newConfig !== 'object') {
    return res.status(400).json({ error: 'Invalid configuration data' });
  }

  db.set('siteConfig', newConfig);
  res.json({ success: true, message: 'Site configuration updated', data: newConfig });
});

// Messages management
app.get('/api/admin/messages', authMiddleware, (req, res) => {
  res.json(db.get('messages'));
});

app.put('/api/admin/messages/:id/status', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const messages = db.get('messages');
  const msg = messages.find(m => m.id === id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  msg.status = status || 'read';
  db.set('messages', messages);
  res.json({ success: true, data: msg });
});

app.delete('/api/admin/messages/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  let messages = db.get('messages');
  messages = messages.filter(m => m.id !== id);
  db.set('messages', messages);
  res.json({ success: true, message: 'Message deleted' });
});

// Bookings management
app.get('/api/admin/bookings', authMiddleware, (req, res) => {
  res.json(db.get('bookings'));
});

app.put('/api/admin/bookings/:id/status', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const bookings = db.get('bookings');
  const bk = bookings.find(b => b.id === id);
  if (!bk) return res.status(404).json({ error: 'Booking not found' });

  bk.status = status || 'confirmed';
  db.set('bookings', bookings);
  res.json({ success: true, data: bk });
});

app.delete('/api/admin/bookings/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  let bookings = db.get('bookings');
  bookings = bookings.filter(b => b.id !== id);
  db.set('bookings', bookings);
  res.json({ success: true, message: 'Booking deleted' });
});

// Subscribers management
app.get('/api/admin/subscribers', authMiddleware, (req, res) => {
  res.json(db.get('subscribers'));
});

app.delete('/api/admin/subscribers/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  let subscribers = db.get('subscribers');
  subscribers = subscribers.filter(s => s.id !== id);
  db.set('subscribers', subscribers);
  res.json({ success: true, message: 'Subscriber deleted' });
});

// Services CRUD
app.post('/api/admin/services', authMiddleware, (req, res) => {
  const services = db.get('services');
  const item = { ...req.body, id: req.body.id || 'srv-' + Date.now() };
  services.push(item);
  db.set('services', services);
  res.status(201).json({ success: true, data: item });
});

app.put('/api/admin/services/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const services = db.get('services');
  const index = services.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Service not found' });

  services[index] = { ...services[index], ...req.body, id };
  db.set('services', services);
  res.json({ success: true, data: services[index] });
});

app.delete('/api/admin/services/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  let services = db.get('services');
  services = services.filter(s => s.id !== id);
  db.set('services', services);
  res.json({ success: true, message: 'Service deleted' });
});

// Products CRUD
app.post('/api/admin/products', authMiddleware, (req, res) => {
  const products = db.get('products');
  const item = { ...req.body, id: req.body.id || 'prod-' + Date.now() };
  products.push(item);
  db.set('products', products);
  res.status(201).json({ success: true, data: item });
});

app.put('/api/admin/products/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const products = db.get('products');
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Product not found' });

  products[index] = { ...products[index], ...req.body, id };
  db.set('products', products);
  res.json({ success: true, data: products[index] });
});

app.delete('/api/admin/products/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  let products = db.get('products');
  products = products.filter(p => p.id !== id);
  db.set('products', products);
  res.json({ success: true, message: 'Product deleted' });
});

// Projects CRUD
app.post('/api/admin/projects', authMiddleware, (req, res) => {
  const projects = db.get('projects');
  const item = { ...req.body, id: req.body.id || 'proj-' + Date.now() };
  projects.push(item);
  db.set('projects', projects);
  res.status(201).json({ success: true, data: item });
});

app.put('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const projects = db.get('projects');
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  projects[index] = { ...projects[index], ...req.body, id };
  db.set('projects', projects);
  res.json({ success: true, data: projects[index] });
});

app.delete('/api/admin/projects/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  let projects = db.get('projects');
  projects = projects.filter(p => p.id !== id);
  db.set('projects', projects);
  res.json({ success: true, message: 'Project deleted' });
});

// Fallback to SPA index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Zitech Limited Server running on port ${PORT}`);
  });
}

module.exports = app;
