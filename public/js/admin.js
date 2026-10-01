/* ===== Zitech Limited — Admin Panel Module ===== */

const AdminApp = {
  activeTab: 'overview',
  data: {
    dashboard: null,
    services: [],
    products: [],
    projects: [],
    messages: [],
    bookings: [],
    subscribers: [],
    config: null
  },

  init() {
    const token = localStorage.getItem('zt_admin_token');
    if (!token) {
      this.renderLoginForm();
    } else {
      this.verifyTokenAndLoad();
    }
  },

  async verifyTokenAndLoad() {
    try {
      const res = await API.get('/api/auth/verify');
      if (res && res.success) {
        this.renderAdminLayout();
        this.loadTabContent(this.activeTab);
      } else {
        this.logout();
      }
    } catch (err) {
      this.logout();
    }
  },

  logout() {
    localStorage.removeItem('zt_admin_token');
    localStorage.removeItem('zt_admin_user');
    this.renderLoginForm();
  },

  renderLoginForm() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <section class="section">
        <div class="login-container">
          <div class="login-header">
            <h2>Admin Portal</h2>
            <p>Zitech Limited System Management</p>
          </div>
          <form id="admin-login-form">
            <div class="admin-form-group">
              <label for="login-username">Username</label>
              <input type="text" id="login-username" class="admin-form-control" placeholder="Enter username" required value="admin">
            </div>
            <div class="admin-form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" class="admin-form-control" placeholder="Enter password" required value="admin12">
            </div>
            <div id="login-error" style="color: #ff4d4f; font-size: 0.85rem; margin-bottom: 12px; display: none;"></div>
            <button type="submit" class="admin-btn admin-btn-primary" style="width: 100%;">Sign In</button>
          </form>
        </div>
      </section>
    `;

    const form = document.getElementById('admin-login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      const errBox = document.getElementById('login-error');

      errBox.style.display = 'none';

      try {
        const res = await API.post('/api/auth/login', { username, password });
        if (res.token) {
          localStorage.setItem('zt_admin_token', res.token);
          localStorage.setItem('zt_admin_user', JSON.stringify(res.user));
          toast('Authentication successful');
          this.verifyTokenAndLoad();
        }
      } catch (err) {
        errBox.textContent = err.message || 'Login failed';
        errBox.style.display = 'block';
      }
    });
  },

  renderAdminLayout() {
    const app = document.getElementById('app');
    if (!app) return;

    const user = JSON.parse(localStorage.getItem('zt_admin_user') || '{}');

    app.innerHTML = `
      <div class="admin-wrapper">
        <div class="admin-header">
          <div>
            <h1 class="admin-title">Admin Dashboard</h1>
            <span class="admin-badge">Authenticated as ${user.username || 'Admin'}</span>
          </div>
          <button class="admin-btn admin-btn-secondary" id="admin-logout-btn">Log Out</button>
        </div>

        <div class="admin-nav-tabs">
          <button class="admin-tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
          <button class="admin-tab-btn ${this.activeTab === 'services' ? 'active' : ''}" data-tab="services">Services</button>
          <button class="admin-tab-btn ${this.activeTab === 'products' ? 'active' : ''}" data-tab="products">Products</button>
          <button class="admin-tab-btn ${this.activeTab === 'projects' ? 'active' : ''}" data-tab="projects">Projects</button>
          <button class="admin-tab-btn ${this.activeTab === 'messages' ? 'active' : ''}" data-tab="messages">Messages</button>
          <button class="admin-tab-btn ${this.activeTab === 'bookings' ? 'active' : ''}" data-tab="bookings">Bookings</button>
          <button class="admin-tab-btn ${this.activeTab === 'subscribers' ? 'active' : ''}" data-tab="subscribers">Newsletter</button>
          <button class="admin-tab-btn ${this.activeTab === 'settings' ? 'active' : ''}" data-tab="settings">Site Config</button>
          <button class="admin-tab-btn ${this.activeTab === 'password' ? 'active' : ''}" data-tab="password">Security</button>
        </div>

        <div id="admin-tab-content">
          <div style="text-align: center; padding: 40px;">Loading content...</div>
        </div>
      </div>
    `;

    document.getElementById('admin-logout-btn').addEventListener('click', () => this.logout());

    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.getAttribute('data-tab');
        this.loadTabContent(this.activeTab);
      });
    });
  },

  async loadTabContent(tab) {
    const container = document.getElementById('admin-tab-content');
    if (!container) return;

    if (tab === 'overview') {
      const data = await API.get('/api/admin/dashboard');
      if (data) {
        this.data.dashboard = data;
        container.innerHTML = `
          <div class="admin-stats-grid">
            <div class="stat-box">
              <div class="number">${data.unreadMessages}</div>
              <div class="label">Unread Messages</div>
            </div>
            <div class="stat-box">
              <div class="number">${data.pendingBookings}</div>
              <div class="label">Pending Bookings</div>
            </div>
            <div class="stat-box">
              <div class="number">${data.totalSubscribers}</div>
              <div class="label">Subscribers</div>
            </div>
            <div class="stat-box">
              <div class="number">${data.totalProducts}</div>
              <div class="label">Products</div>
            </div>
          </div>

          <div class="admin-card">
            <div class="admin-card-title">Recent Inquiries</div>
            <div class="admin-table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.recentMessages.length ? data.recentMessages.map(m => `
                    <tr>
                      <td>${m.name}</td>
                      <td>${m.email}</td>
                      <td>${m.subject}</td>
                      <td>${new Date(m.createdAt).toLocaleDateString()}</td>
                      <td><span style="color: ${m.status === 'unread' ? '#ff4d4f' : 'var(--cyan)'}">${m.status}</span></td>
                    </tr>
                  `).join('') : '<tr><td colspan="5">No recent messages</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    } else if (tab === 'services') {
      const services = await API.get('/api/services');
      this.data.services = services || [];
      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-title">
            <span>Services Catalog</span>
            <button class="admin-btn admin-btn-primary admin-btn-sm" id="add-service-btn">Add New Service</button>
          </div>
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Tagline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.data.services.map(s => `
                  <tr>
                    <td>${s.id}</td>
                    <td><strong>${s.title}</strong></td>
                    <td>${s.tagline}</td>
                    <td>
                      <button class="admin-btn admin-btn-secondary admin-btn-sm edit-service-btn" data-id="${s.id}">Edit</button>
                      <button class="admin-btn admin-btn-danger admin-btn-sm delete-service-btn" data-id="${s.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('add-service-btn').addEventListener('click', () => this.openServiceModal());
      container.querySelectorAll('.edit-service-btn').forEach(b => {
        b.addEventListener('click', () => {
          const srv = this.data.services.find(s => s.id === b.getAttribute('data-id'));
          this.openServiceModal(srv);
        });
      });
      container.querySelectorAll('.delete-service-btn').forEach(b => {
        b.addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this service?')) {
            await API.delete('/api/admin/services/' + b.getAttribute('data-id'));
            toast('Service deleted');
            this.loadTabContent('services');
          }
        });
      });
    } else if (tab === 'products') {
      const products = await API.get('/api/products');
      this.data.products = products || [];
      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-title">
            <span>Products Inventory</span>
            <button class="admin-btn admin-btn-primary admin-btn-sm" id="add-product-btn">Add New Product</button>
          </div>
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.data.products.map(p => `
                  <tr>
                    <td>${p.id}</td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.category}</td>
                    <td>${p.price}</td>
                    <td>
                      <button class="admin-btn admin-btn-secondary admin-btn-sm edit-product-btn" data-id="${p.id}">Edit</button>
                      <button class="admin-btn admin-btn-danger admin-btn-sm delete-product-btn" data-id="${p.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('add-product-btn').addEventListener('click', () => this.openProductModal());
      container.querySelectorAll('.edit-product-btn').forEach(b => {
        b.addEventListener('click', () => {
          const prod = this.data.products.find(p => p.id === b.getAttribute('data-id'));
          this.openProductModal(prod);
        });
      });
      container.querySelectorAll('.delete-product-btn').forEach(b => {
        b.addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this product?')) {
            await API.delete('/api/admin/products/' + b.getAttribute('data-id'));
            toast('Product deleted');
            this.loadTabContent('products');
          }
        });
      });
    } else if (tab === 'projects') {
      const projects = await API.get('/api/projects');
      this.data.projects = projects || [];
      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-title">
            <span>Case Studies & Projects</span>
            <button class="admin-btn admin-btn-primary admin-btn-sm" id="add-project-btn">Add New Project</button>
          </div>
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Client</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.data.projects.map(pj => `
                  <tr>
                    <td>${pj.id}</td>
                    <td><strong>${pj.title}</strong></td>
                    <td>${pj.category}</td>
                    <td>${pj.client}</td>
                    <td>
                      <button class="admin-btn admin-btn-secondary admin-btn-sm edit-project-btn" data-id="${pj.id}">Edit</button>
                      <button class="admin-btn admin-btn-danger admin-btn-sm delete-project-btn" data-id="${pj.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      document.getElementById('add-project-btn').addEventListener('click', () => this.openProjectModal());
      container.querySelectorAll('.edit-project-btn').forEach(b => {
        b.addEventListener('click', () => {
          const pj = this.data.projects.find(p => p.id === b.getAttribute('data-id'));
          this.openProjectModal(pj);
        });
      });
      container.querySelectorAll('.delete-project-btn').forEach(b => {
        b.addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this project?')) {
            await API.delete('/api/admin/projects/' + b.getAttribute('data-id'));
            toast('Project deleted');
            this.loadTabContent('projects');
          }
        });
      });
    } else if (tab === 'messages') {
      const messages = await API.get('/api/admin/messages');
      this.data.messages = messages || [];
      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-title">Inquiries & Messages</div>
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.data.messages.map(m => `
                  <tr>
                    <td>${new Date(m.createdAt).toLocaleDateString()}</td>
                    <td><strong>${m.name}</strong><br><small>${m.email}</small></td>
                    <td>${m.subject}</td>
                    <td><div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.message}</div></td>
                    <td><span style="color: ${m.status === 'unread' ? '#ff4d4f' : 'var(--cyan)'}">${m.status}</span></td>
                    <td>
                      ${m.status === 'unread' ? `<button class="admin-btn admin-btn-secondary admin-btn-sm mark-msg-read" data-id="${m.id}">Mark Read</button>` : ''}
                      <button class="admin-btn admin-btn-danger admin-btn-sm delete-msg-btn" data-id="${m.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelectorAll('.mark-msg-read').forEach(b => {
        b.addEventListener('click', async () => {
          await API.put('/api/admin/messages/' + b.getAttribute('data-id') + '/status', { status: 'read' });
          toast('Marked as read');
          this.loadTabContent('messages');
        });
      });
      container.querySelectorAll('.delete-msg-btn').forEach(b => {
        b.addEventListener('click', async () => {
          if (confirm('Delete message?')) {
            await API.delete('/api/admin/messages/' + b.getAttribute('data-id'));
            toast('Message deleted');
            this.loadTabContent('messages');
          }
        });
      });
    } else if (tab === 'bookings') {
      const bookings = await API.get('/api/admin/bookings');
      this.data.bookings = bookings || [];
      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-title">Consultation Bookings</div>
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Preferred Date</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.data.bookings.map(b => `
                  <tr>
                    <td><strong>${b.name}</strong><br><small>${b.email} | ${b.phone}</small></td>
                    <td>${b.service}</td>
                    <td>${b.preferredDate || 'N/A'}</td>
                    <td>${b.notes || '-'}</td>
                    <td><span style="color: ${b.status === 'pending' ? '#ff4d4f' : 'var(--lime)'}">${b.status}</span></td>
                    <td>
                      ${b.status === 'pending' ? `<button class="admin-btn admin-btn-primary admin-btn-sm confirm-bk-btn" data-id="${b.id}">Confirm</button>` : ''}
                      <button class="admin-btn admin-btn-danger admin-btn-sm delete-bk-btn" data-id="${b.id}">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelectorAll('.confirm-bk-btn').forEach(b => {
        b.addEventListener('click', async () => {
          await API.put('/api/admin/bookings/' + b.getAttribute('data-id') + '/status', { status: 'confirmed' });
          toast('Booking confirmed');
          this.loadTabContent('bookings');
        });
      });
      container.querySelectorAll('.delete-bk-btn').forEach(b => {
        b.addEventListener('click', async () => {
          if (confirm('Delete booking?')) {
            await API.delete('/api/admin/bookings/' + b.getAttribute('data-id'));
            toast('Booking deleted');
            this.loadTabContent('bookings');
          }
        });
      });
    } else if (tab === 'subscribers') {
      const subs = await API.get('/api/admin/subscribers');
      this.data.subscribers = subs || [];
      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-title">Newsletter Subscribers</div>
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Subscribed Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.data.subscribers.map(s => `
                  <tr>
                    <td>${s.email}</td>
                    <td>${new Date(s.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button class="admin-btn admin-btn-danger admin-btn-sm delete-sub-btn" data-id="${s.id}">Remove</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelectorAll('.delete-sub-btn').forEach(b => {
        b.addEventListener('click', async () => {
          if (confirm('Remove subscriber?')) {
            await API.delete('/api/admin/subscribers/' + b.getAttribute('data-id'));
            toast('Subscriber removed');
            this.loadTabContent('subscribers');
          }
        });
      });
    } else if (tab === 'settings') {
      const config = await API.get('/api/config');
      this.data.config = config || {};
      container.innerHTML = `
        <div class="admin-card">
          <div class="admin-card-title">Website Configuration</div>
          <form id="admin-config-form">
            <div class="admin-form-group">
              <label>Contact Email</label>
              <input type="email" id="cfg-email" class="admin-form-control" value="${config.email || ''}">
            </div>
            <div class="admin-form-group">
              <label>Phone Number (Display)</label>
              <input type="text" id="cfg-phone" class="admin-form-control" value="${config.phone || ''}">
            </div>
            <div class="admin-form-group">
              <label>WhatsApp Number (Digits only)</label>
              <input type="text" id="cfg-whatsapp" class="admin-form-control" value="${config.whatsapp || ''}">
            </div>
            <div class="admin-form-group">
              <label>Physical Address</label>
              <input type="text" id="cfg-address" class="admin-form-control" value="${config.address || ''}">
            </div>
            <div class="admin-form-group">
              <label>Business Hours</label>
              <input type="text" id="cfg-hours" class="admin-form-control" value="${config.hours || ''}">
            </div>
            <button type="submit" class="admin-btn admin-btn-primary">Save Settings</button>
          </form>
        </div>
      `;

      document.getElementById('admin-config-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const updated = {
          ...config,
          email: document.getElementById('cfg-email').value,
          phone: document.getElementById('cfg-phone').value,
          whatsapp: document.getElementById('cfg-whatsapp').value,
          address: document.getElementById('cfg-address').value,
          hours: document.getElementById('cfg-hours').value
        };
        await API.put('/api/admin/config', updated);
        toast('Configuration saved');
      });
    } else if (tab === 'password') {
      container.innerHTML = `
        <div class="admin-card" style="max-width: 500px;">
          <div class="admin-card-title">Security & Account</div>
          <form id="admin-pass-form">
            <div class="admin-form-group">
              <label>Current Password</label>
              <input type="password" id="cur-pass" class="admin-form-control" required>
            </div>
            <div class="admin-form-group">
              <label>New Password</label>
              <input type="password" id="new-pass" class="admin-form-control" required minlength="6">
            </div>
            <div class="admin-form-group">
              <label>Confirm New Password</label>
              <input type="password" id="confirm-pass" class="admin-form-control" required minlength="6">
            </div>
            <button type="submit" class="admin-btn admin-btn-primary">Update Password</button>
          </form>
        </div>
      `;

      document.getElementById('admin-pass-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('cur-pass').value;
        const newPassword = document.getElementById('new-pass').value;
        const confirmPassword = document.getElementById('confirm-pass').value;

        if (newPassword !== confirmPassword) {
          return toast('New passwords do not match');
        }

        try {
          await API.post('/api/auth/change-password', { currentPassword, newPassword });
          toast('Password updated successfully!');
          document.getElementById('admin-pass-form').reset();
        } catch (err) {
          toast(err.message || 'Error updating password');
        }
      });
    }
  },

  openServiceModal(item = null) {
    const isEdit = !!item;
    const body = `
      <h3 style="margin-bottom: 20px;">${isEdit ? 'Edit Service' : 'Add New Service'}</h3>
      <form id="srv-modal-form">
        <div class="admin-form-group">
          <label>ID</label>
          <input type="text" id="m-srv-id" class="admin-form-control" value="${item ? item.id : ''}" ${isEdit ? 'disabled' : 'required'}>
        </div>
        <div class="admin-form-group">
          <label>Title</label>
          <input type="text" id="m-srv-title" class="admin-form-control" value="${item ? item.title : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Tagline</label>
          <input type="text" id="m-srv-tagline" class="admin-form-control" value="${item ? item.tagline : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Description</label>
          <textarea id="m-srv-desc" class="admin-form-control" rows="3" required>${item ? item.desc : ''}</textarea>
        </div>
        <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? 'Update Service' : 'Create Service'}</button>
      </form>
    `;
    openModal(body);

    document.getElementById('srv-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('m-srv-id').value,
        title: document.getElementById('m-srv-title').value,
        tagline: document.getElementById('m-srv-tagline').value,
        desc: document.getElementById('m-srv-desc').value,
        icon: item ? item.icon : 'code',
        features: item ? item.features : ['Professional IT Support', 'Managed Infrastructure']
      };

      if (isEdit) {
        await API.put('/api/admin/services/' + payload.id, payload);
        toast('Service updated');
      } else {
        await API.post('/api/admin/services', payload);
        toast('Service created');
      }
      closeModal();
      this.loadTabContent('services');
    });
  },

  openProductModal(item = null) {
    const isEdit = !!item;
    const body = `
      <h3 style="margin-bottom: 20px;">${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
      <form id="prod-modal-form">
        <div class="admin-form-group">
          <label>ID</label>
          <input type="text" id="m-prod-id" class="admin-form-control" value="${item ? item.id : ''}" ${isEdit ? 'disabled' : 'required'}>
        </div>
        <div class="admin-form-group">
          <label>Name</label>
          <input type="text" id="m-prod-name" class="admin-form-control" value="${item ? item.name : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Category</label>
          <input type="text" id="m-prod-cat" class="admin-form-control" value="${item ? item.category : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Price</label>
          <input type="text" id="m-prod-price" class="admin-form-control" value="${item ? item.price : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Description</label>
          <textarea id="m-prod-desc" class="admin-form-control" rows="3" required>${item ? item.desc : ''}</textarea>
        </div>
        <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? 'Update Product' : 'Create Product'}</button>
      </form>
    `;
    openModal(body);

    document.getElementById('prod-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('m-prod-id').value,
        name: document.getElementById('m-prod-name').value,
        category: document.getElementById('m-prod-cat').value,
        price: document.getElementById('m-prod-price').value,
        desc: document.getElementById('m-prod-desc').value,
        specs: item ? item.specs : ['Enterprise Grade', '1 Year Warranty']
      };

      if (isEdit) {
        await API.put('/api/admin/products/' + payload.id, payload);
        toast('Product updated');
      } else {
        await API.post('/api/admin/products', payload);
        toast('Product created');
      }
      closeModal();
      this.loadTabContent('products');
    });
  },

  openProjectModal(item = null) {
    const isEdit = !!item;
    const body = `
      <h3 style="margin-bottom: 20px;">${isEdit ? 'Edit Project' : 'Add New Project'}</h3>
      <form id="proj-modal-form">
        <div class="admin-form-group">
          <label>ID</label>
          <input type="text" id="m-proj-id" class="admin-form-control" value="${item ? item.id : ''}" ${isEdit ? 'disabled' : 'required'}>
        </div>
        <div class="admin-form-group">
          <label>Title</label>
          <input type="text" id="m-proj-title" class="admin-form-control" value="${item ? item.title : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Category</label>
          <input type="text" id="m-proj-cat" class="admin-form-control" value="${item ? item.category : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Client</label>
          <input type="text" id="m-proj-client" class="admin-form-control" value="${item ? item.client : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Summary</label>
          <textarea id="m-proj-summary" class="admin-form-control" rows="3" required>${item ? item.summary : ''}</textarea>
        </div>
        <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? 'Update Project' : 'Create Project'}</button>
      </form>
    `;
    openModal(body);

    document.getElementById('proj-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('m-proj-id').value,
        title: document.getElementById('m-proj-title').value,
        category: document.getElementById('m-proj-cat').value,
        client: document.getElementById('m-proj-client').value,
        summary: document.getElementById('m-proj-summary').value,
        highlights: item ? item.highlights : ['100% On-time Delivery']
      };

      if (isEdit) {
        await API.put('/api/admin/projects/' + payload.id, payload);
        toast('Project updated');
      } else {
        await API.post('/api/admin/projects', payload);
        toast('Project created');
      }
      closeModal();
      this.loadTabContent('projects');
    });
  }
};
