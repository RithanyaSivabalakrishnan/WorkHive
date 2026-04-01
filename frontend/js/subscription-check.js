// subscription-check.js — call this on every admin page load
async function checkSubscriptionStatus() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'admin') return; // only show to admin

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/api/subscription/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data } = await res.json();
    if (!data) return;

    const banner = document.getElementById('sub-banner');
    if (!banner) return;

    if (data.expired) {
      // Full blocking banner for expired
      banner.innerHTML = `
        <div style="
          background: #fef2f2;
          border-bottom: 2px solid #fca5a5;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        ">
          <div style="display:flex;align-items:center;gap:12px">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong style="color:#dc2626;font-size:14px">Your subscription has expired</strong>
              <div style="color:#7f1d1d;font-size:12px;margin-top:2px">
                Some features are restricted. Renew your plan to restore full access.
              </div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button onclick="openRenewModal()" style="
              background:#dc2626;color:white;border:none;padding:8px 18px;
              border-radius:8px;font-size:13px;font-weight:600;cursor:pointer
            ">Renew Now</button>
          </div>
        </div>`;
      banner.style.display = 'block';

      
      const mainContent = document.querySelector('.main-content') // adjust selector
        || document.querySelector('main')
        || document.querySelector('.content');
      if (mainContent) {
        mainContent.style.paddingTop = '60px';
      }

    } else if (data.daysLeft !== null && data.daysLeft <= 7) {
      // Warning banner for expiring soon
      const isUrgent = data.daysLeft <= 3;
      banner.innerHTML = `
        <div style="
          background: ${isUrgent ? '#fffbeb' : '#f0fdf4'};
          border-bottom: 2px solid ${isUrgent ? '#fbbf24' : '#86efac'};
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        ">
          <div style="display:flex;align-items:center;gap:12px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="${isUrgent ? '#d97706' : '#16a34a'}" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style="font-size:13px;color:${isUrgent ? '#92400e' : '#14532d'}">
              Your <strong>${data.plan}</strong> plan expires in
              <strong>${data.daysLeft} day${data.daysLeft !== 1 ? 's' : ''}</strong>
              (${new Date(data.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})
            </span>
          </div>
          <button onclick="openRenewModal()" style="
            background:${isUrgent ? '#d97706' : '#16a34a'};color:white;border:none;
            padding:7px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0
          ">Renew / Upgrade</button>
        </div>`;
      banner.style.display = 'block';
    }

  } catch (err) {
    console.warn('Subscription check failed:', err);
  }
}

function openRenewModal() {
  const modal = document.createElement('div');
  modal.id = 'renew-modal';
  modal.innerHTML = `
    <div style="
      position:fixed;inset:0;background:rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;z-index:9999
    " onclick="if(event.target===this)this.remove()">
      <div style="
        background:white;border-radius:16px;padding:32px;max-width:460px;
        width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.2)
      ">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Choose a Plan</h2>
        <p style="font-size:13px;color:#6b7280;margin-bottom:24px">
          Select a plan to renew or upgrade your workspace
        </p>

        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
          ${[
      { id: 'free', label: 'Free', price: '₹0 / 30 days', desc: 'Up to 3 projects, 5 users', color: '#6b7280' },
      { id: 'pro', label: 'Pro', price: '₹999 / year', desc: 'Unlimited projects, 25 users', color: '#01696f' },
      { id: 'enterprise', label: 'Enterprise', price: '₹4999 / year', desc: 'Unlimited everything + priority support', color: '#7a39bb' }
    ].map(p => `
            <label style="
              display:flex;align-items:center;gap:16px;padding:14px 16px;
              border:2px solid #e5e7eb;border-radius:10px;cursor:pointer;
              transition:.15s" onmouseover="this.style.borderColor='${p.color}'"
              onmouseout="this.style.borderColor=document.querySelector('#plan-${p.id}').checked?'${p.color}':'#e5e7eb'">
              <input type="radio" name="plan" id="plan-${p.id}" value="${p.id}"
                style="accent-color:${p.color};width:16px;height:16px"
                onchange="document.querySelectorAll('[name=plan]').forEach(r=>{
                  r.closest('label').style.borderColor = r.checked ? r.nextElementSibling.dataset.color : '#e5e7eb'
                })">
              <span data-color="${p.color}" style="flex:1">
                <strong style="display:block;font-size:14px;color:#111">${p.label}</strong>
                <span style="font-size:12px;color:#6b7280">${p.desc}</span>
              </span>
              <strong style="font-size:13px;color:${p.color};white-space:nowrap">${p.price}</strong>
            </label>
          `).join('')}
        </div>

        <div style="display:flex;gap:10px">
          <button onclick="document.getElementById('renew-modal').remove()" style="
            flex:1;padding:12px;border:1px solid #e5e7eb;border-radius:8px;
            background:white;font-size:14px;font-weight:500;cursor:pointer
          ">Cancel</button>
          <button onclick="submitRenewal()" style="
            flex:2;padding:12px;background:#01696f;color:white;border:none;
            border-radius:8px;font-size:14px;font-weight:700;cursor:pointer
          ">Confirm Plan</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function submitRenewal() {
  const selected = document.querySelector('input[name="plan"]:checked');
  if (!selected) { alert('Please select a plan.'); return; }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/api/subscription/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ plan: selected.value })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    document.getElementById('renew-modal')?.remove();
    document.getElementById('sub-banner')?.remove();
    alert(`✅ ${data.message}`);
    location.reload();
  } catch (err) {
    alert('Renewal failed: ' + err.message);
  }
}


// Call on page load
checkSubscriptionStatus();
