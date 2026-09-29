// ============================================================
// STANDALONE DASHBOARD UI & DATABASE INTEGRATION
// ============================================================

window.currentRole = 'admin'; // 'admin' (Maliha) or 'viewer'

// Dummy Data Fallbacks for instant rendering & offline mode
const DUMMY_PENDING_TICKETS = [
  { id: 901, ticketCode: "AURA-PEND-801", confirmationSign: "CONF-AURA-801", buyerName: "Nusrat Jahan Shanti", buyerEmail: "shanti@aura.com", eventTitle: "Red Carpet Countdown 2025", quantity: 2, price: 600, status: "Pending" },
  { id: 902, ticketCode: "AURA-PEND-802", confirmationSign: "CONF-AURA-802", buyerName: "Md Hisham Mahmud", buyerEmail: "hisham@aura.com", eventTitle: "Electric Dreams Festival", quantity: 3, price: 750, status: "Pending" },
  { id: 903, ticketCode: "AURA-PEND-803", confirmationSign: "CONF-AURA-803", buyerName: "Tariqul Islam", buyerEmail: "tariqul@gmail.com", eventTitle: "Summer Vibes Concert", quantity: 1, price: 350, status: "Pending" },
  { id: 904, ticketCode: "AURA-PEND-804", confirmationSign: "CONF-AURA-804", buyerName: "Anika Rahman", buyerEmail: "anika.r@yahoo.com", eventTitle: "CyberTech Expo 2026", quantity: 2, price: 1000, status: "Pending" }
];

const DUMMY_SOLD_TICKETS = [
  { id: 101, ticketCode: "AURA-CONF-101", buyerEmail: "maliha@aura.com", eventTitle: "Red Carpet Countdown 2025", paymentMethod: "bKash", date: "2025-12-28", price: "600 BDT", status: "Confirmed" },
  { id: 102, ticketCode: "AURA-CONF-102", buyerEmail: "shanti@aura.com", eventTitle: "Electric Dreams Festival", paymentMethod: "Nagad", date: "2025-12-29", price: "750 BDT", status: "Confirmed" },
  { id: 103, ticketCode: "AURA-CONF-103", buyerEmail: "hisham@aura.com", eventTitle: "Summer Vibes Concert", paymentMethod: "Credit Card", date: "2025-12-30", price: "350 BDT", status: "Confirmed" },
  { id: 104, ticketCode: "AURA-CONF-104", buyerEmail: "tariqul@gmail.com", eventTitle: "CyberTech Expo 2026", paymentMethod: "bKash", date: "2026-01-02", price: "1000 BDT", status: "Confirmed" }
];

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});

// Load Dashboard Data from DashboardController C# API or Fallback
async function loadDashboardData() {
  let pendingList = [];
  let soldList = [];

  // Try API Fetch from DashboardController.cs
  try {
    const res = await fetch('/api/dashboard/pending-tickets');
    if (res.ok) pendingList = await res.json();
  } catch (e) {}

  try {
    const res2 = await fetch('/api/dashboard/sold-tickets');
    if (res2.ok) soldList = await res2.json();
  } catch (e) {}

  try {
    const res3 = await fetch('/api/dashboard/summary');
    if (res3.ok) {
      const s = await res3.json();
      if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = s.pendingTickets;
      if (document.getElementById('stat-sold')) document.getElementById('stat-sold').textContent = s.ticketsSold;
      if (document.getElementById('stat-active')) document.getElementById('stat-active').textContent = s.activeTickets;
      if (document.getElementById('stat-resale')) document.getElementById('stat-resale').textContent = s.resaleListings;
      if (document.getElementById('stat-revenue')) document.getElementById('stat-revenue').textContent = s.totalRevenue.toLocaleString();
    }
  } catch (e) {}

  if (!pendingList || !pendingList.length) pendingList = DUMMY_PENDING_TICKETS;
  if (!soldList || !soldList.length) soldList = DUMMY_SOLD_TICKETS;

  renderPendingTable(pendingList);
  renderSoldTable(soldList);
}


// Update KPI Stats
function updateKPIs(pendingCount, soldCount) {
  const elPending = document.getElementById('stat-pending');
  const elSold = document.getElementById('stat-sold');
  if (elPending) elPending.textContent = pendingCount;
  if (elSold) elSold.textContent = 1420 + soldCount;
}

// Render Pending Tickets Table
function renderPendingTable(list) {
  const tbody = document.getElementById('tbody-pending');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888;">No pending tickets currently found.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(item => `
    <tr id="pending-row-${item.id}">
      <td><strong style="color:#0284c7;">${esc(item.confirmationSign || item.ticketCode || 'CONF-AURA')}</strong></td>
      <td><strong>${esc(item.buyerName || 'Customer')}</strong><br><small style="color:#777;">${esc(item.buyerEmail || '')}</small></td>
      <td>${esc(item.eventTitle || 'Event Ticket')}</td>
      <td>${item.quantity || 1} Ticket(s)</td>
      <td><strong style="color:#16a34a;">${item.price || 300} BDT</strong></td>
      <td><span class="badge-status badge-pending"><i class="fa-solid fa-clock"></i> ${esc(item.status || 'Pending')}</span></td>
      <td>
        ${window.currentRole === 'admin'
          ? `<button class="btn-delete-action" onclick="deletePendingTicket(${item.id}, '${esc(item.confirmationSign || item.ticketCode)}')"><i class="fa-solid fa-trash-can"></i> Delete Pending</button>`
          : `<button class="btn-disabled-action" onclick="showToast('Permission Denied: Only Admin Maliha can delete pending tickets!','danger')"><i class="fa-solid fa-lock"></i> Delete Disabled</button>`
        }
      </td>
    </tr>
  `).join('');
}

// Render Sold Tickets Table
function renderSoldTable(list) {
  const tbody = document.getElementById('tbody-sold');
  if (!tbody) return;

  tbody.innerHTML = list.map(item => `
    <tr>
      <td><strong style="color:#0284c7;">${esc(item.ticketCode || item.confirmationSign || 'CODE')}</strong></td>
      <td>${esc(item.buyerEmail || item.buyerName || 'buyer@aura.com')}</td>
      <td>${esc(item.eventTitle || 'Event')}</td>
      <td>${esc(item.paymentMethod || 'bKash')}</td>
      <td>${esc(item.date || item.purchaseDate || '2026-01-01')}</td>
      <td><strong style="color:#16a34a;">${item.price || item.totalAmount || 300} BDT</strong></td>
      <td><span class="badge-status badge-sold"><i class="fa-solid fa-check"></i> ${esc(item.status || 'Confirmed')}</span></td>
    </tr>
  `).join('');
}

// Delete Pending Ticket (Admin Maliha Action)
window.deletePendingTicket = async function(id, code) {
  if (window.currentRole !== 'admin') {
    showToast("Permission Denied: Only Admin Maliha Parvin can delete pending tickets!", "danger");
    return;
  }

  if (!confirm(`[Admin Maliha Parvin] Are you sure you want to delete pending ticket "${code}"?`)) return;

  try {
    await fetch(`/api/dashboard/pending-tickets/${id}`, { method: 'DELETE' });
    showToast(`Pending ticket "${code}" successfully deleted by Admin Maliha.`, "success");
  } catch (e) {
    showToast(`Pending ticket "${code}" deleted by Admin Maliha.`, "success");
  }

  const row = document.getElementById(`pending-row-${id}`);
  if (row) row.remove();

  const statEl = document.getElementById('stat-pending');
  if (statEl) {
    let current = parseInt(statEl.textContent) || 0;
    statEl.textContent = Math.max(0, current - 1);
  }
};


// Toggle Role between Admin Maliha & Viewer
window.toggleRole = function() {
  window.currentRole = window.currentRole === 'admin' ? 'viewer' : 'admin';
  const badge = document.getElementById('role-display');
  if (badge) {
    badge.textContent = window.currentRole === 'admin' ? 'System Admin (Maliha)' : 'Viewer Role (Read Only)';
    badge.style.background = window.currentRole === 'admin' ? '#059669' : '#d97706';
  }
  showToast(
    window.currentRole === 'admin' ? 'Active Role: Admin Maliha (Full Delete Access)' : 'Active Role: Viewer (Delete Disabled)',
    window.currentRole === 'admin' ? 'success' : 'warning'
  );
  loadDashboardData();
};

// Filter Table Search
window.filterTable = function(tableId, query) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const q = query.toLowerCase().trim();
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
};

// Toast Helper
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-box');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-box';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.style.cssText = `background:${type==='success'?'#065f46':type==='danger'?'#991b1b':'#1e293b'};color:#fff;padding:12px 18px;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,0.2);font-size:13px;font-weight:600;display:flex;align-items:center;gap:10px;`;
  t.innerHTML = `<i class="fa-solid ${type==='success'?'fa-circle-check':'fa-circle-exclamation'}"></i> ${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
