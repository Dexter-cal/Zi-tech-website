/* ===== Zitech Limited — API & State Integration Layer ===== */

const API = {
  async get(url) {
    try {
      const res = await fetch(url, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Fetch failed for ${url}, falling back to static data:`, err);
      return null;
    }
  },

  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Server request failed');
    }
    return result;
  },

  async put(url, data) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Server request failed');
    }
    return result;
  },

  async delete(url) {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Server request failed');
    }
    return result;
  },

  getHeaders(extra = {}) {
    const token = localStorage.getItem('zt_admin_token');
    const headers = { ...extra };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
};
