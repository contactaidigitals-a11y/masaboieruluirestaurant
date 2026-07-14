const SESSION_KEY = "masaBoieruluiAdmin";

const adminLogin = document.querySelector("#adminLogin");
const adminPanel = document.querySelector("#adminPanel");
const adminMessage = document.querySelector("#adminMessage");
const reservationsList = document.querySelector("#reservationsList");
const ordersList = document.querySelector("#ordersList");
const clientsList = document.querySelector("#clientsList");
const orderSearch = document.querySelector("#orderSearch");
const orderDateFilter = document.querySelector("#orderDateFilter");
const orderDateClear = document.querySelector("#orderDateClear");
const clientSearch = document.querySelector("#clientSearch");
const pendingReservationsOverview = document.querySelector("#pendingReservationsOverview");
const adminMenuList = document.querySelector("#adminMenuList");
const menuSearch = document.querySelector("#menuSearch");
const reservationDateFilter = document.querySelector("#reservationDateFilter");
const logoutBtn = document.querySelector("#logoutBtn");
const tabButtons = document.querySelectorAll("[data-admin-tab]");
const tabPanels = document.querySelectorAll("[data-admin-tab-panel]");

let editingReservationId = null;
const adminMenu = window.MASA_BOIERULUI_MENU || [];

let adminState = { reservations: [], orders: [], clients: [], menuAvailability: [], stats: {} };
let activeAdminTab = "orders";
let pollTimer = null;

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isoToShortDate(isoDate) {
  const [year, month, day] = String(isoDate || "").slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${String(year).slice(-2)}` : "";
}

function shortDateToIso(value) {
  const text = String(value || "").trim();
  const shortDate = text.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (shortDate) return `20${shortDate[3]}-${shortDate[2]}-${shortDate[1]}`;
  const fullDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (fullDate) return `${fullDate[3]}-${fullDate[2]}-${fullDate[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return localDateString();
}

function optionalShortDateToIso(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const shortDate = text.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (shortDate) return `20${shortDate[3]}-${shortDate[2]}-${shortDate[1]}`;
  const fullDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (fullDate) return `${fullDate[3]}-${fullDate[2]}-${fullDate[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return "";
}

function normalizeReservationDateFilter() {
  if (!reservationDateFilter) return localDateString();
  const isoDate = shortDateToIso(reservationDateFilter.value || isoToShortDate(localDateString()));
  reservationDateFilter.value = isoToShortDate(isoDate);
  return isoDate;
}

function normalizeOptionalDateFilter(input) {
  if (!input || !input.value.trim()) return "";
  return optionalShortDateToIso(input.value);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      throw new Error("Serverul nu a raspuns cu API valid. Reincarca pagina si verifica daca aplicatia Node ruleaza.");
    }
  }
  if (!response.ok) throw new Error(data?.error || "Cererea nu a putut fi procesată.");
  return data;
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

function showMessage(element, text, type = "ok") {
  element.textContent = text;
  element.className = `form-note ${type}`;
}

function money(value) {
  return `${Number(value || 0)} Lei`;
}

function menuItemKey(item) {
  const index = adminMenu.indexOf(item);
  return item.id || `menu-${index}`;
}

function menuAvailabilityMap() {
  return new Map((adminState.menuAvailability || []).map((item) => [item.key, item]));
}

function isMenuItemAvailable(item) {
  const state = menuAvailabilityMap().get(menuItemKey(item));
  return state?.available !== false;
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\s+/g, "");
}

function statusLabel(status) {
  if (status === "confirmed") return "Confirmat";
  if (status === "cancelled") return "Anulat";
  return "În așteptare";
}

function orderStatusLabel(status) {
  if (status === "preparing") return "În pregătire";
  if (status === "delivered") return "Livrată";
  if (status === "cancelled") return "Anulată";
  return "Nouă";
}

function paymentLabel(order) {
  return "Cash la livrare";
}

function switchAdminTab(tab) {
  activeAdminTab = tab;
  tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.adminTab === tab));
  tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.adminTabPanel === tab));
}

function updateAdminBadges() {
  const ordersCount = document.querySelector("#ordersTabCount");
  const reservationsCount = document.querySelector("#reservationsTabCount");
  const menuCount = document.querySelector("#menuTabCount");
  const pendingTotal = adminState.stats.pendingReservationsTotal ?? adminState.notifications?.reservations?.length ?? adminState.stats.pendingReservations ?? 0;
  if (ordersCount) ordersCount.textContent = adminState.stats.newOrders || 0;
  if (reservationsCount) reservationsCount.textContent = pendingTotal;
  if (menuCount) menuCount.textContent = adminState.stats.unavailableItems || 0;
  const total = Number(adminState.stats.newOrders || 0) + Number(pendingTotal);
  document.title = total > 0 ? `(${total}) Admin | Masa Boierului` : "Admin | Masa Boierului";
}

async function loadAdminState() {
  const date = normalizeReservationDateFilter();
  adminState = await apiRequest(`/api/admin/state?date=${encodeURIComponent(date)}`);
}

async function renderAdmin() {
  if (!isAdminLoggedIn()) {
    adminLogin.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    return;
  }

  adminLogin.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  try {
    if (reservationDateFilter && !reservationDateFilter.value) reservationDateFilter.value = isoToShortDate(localDateString());
    await loadAdminState();
    document.querySelector("#adminRestaurantSeats").textContent = adminState.stats.restaurantSeats;
    document.querySelector("#adminTerraceSeats").textContent = adminState.stats.terraceSeats;
    document.querySelector("#pendingCount").textContent = adminState.stats.pendingReservationsTotal ?? adminState.notifications?.reservations?.length ?? adminState.stats.pendingReservations ?? 0;
    document.querySelector("#newOrdersCount").textContent = adminState.stats.newOrders;
    updateAdminBadges();
    renderPendingReservationsOverview();
    renderReservations(adminState.reservations);
    renderOrders(adminState.orders);
    renderMenuAvailability();
    renderClients();
  } catch (error) {
    if (error.message === "Autentificare necesară.") {
      sessionStorage.removeItem(SESSION_KEY);
      renderAdmin();
      return;
    }
    reservationsList.innerHTML = `<div class="reservation-card"><p>${error.message}</p></div>`;
  }
}

function roDateToIsoDate(roDate) {
  const [day, month, year] = String(roDate || "").split(".");
  return year && month && day ? `${year}-${month}-${day}` : "";
}

function roDateToShortDate(roDate) {
  const [day, month, year] = String(roDate || "").split(".");
  return year && month && day ? `${day}/${month}/${String(year).slice(-2)}` : "";
}

function renderPendingReservationsOverview() {
  if (!pendingReservationsOverview) return;
  const pending = adminState.notifications?.reservations || [];

  if (pending.length === 0) {
    pendingReservationsOverview.innerHTML = `<div class="pending-overview-empty">Nu există rezervări noi în așteptare.</div>`;
    return;
  }

  const grouped = pending.reduce((acc, reservation) => {
    const date = reservation.reservationDate || "Fără dată";
    acc[date] = acc[date] || [];
    acc[date].push(reservation);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    const aIso = roDateToIsoDate(a);
    const bIso = roDateToIsoDate(b);
    return aIso.localeCompare(bIso);
  });

  pendingReservationsOverview.innerHTML = `
    <div class="pending-overview-head">
      <strong>${pending.length} rezervări noi în așteptare</strong>
      <span>Apar aici indiferent de data selectată.</span>
    </div>
    <div class="pending-overview-days">
      ${sortedGroups.map(([date, reservations]) => `
        <button type="button" data-pending-date="${roDateToShortDate(date)}">
          <strong>${date}</strong>
          <span>${reservations.length} ${reservations.length === 1 ? "rezervare" : "rezervări"}</span>
        </button>
      `).join("")}
    </div>
  `;

  pendingReservationsOverview.querySelectorAll("[data-pending-date]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!reservationDateFilter || !button.dataset.pendingDate) return;
      reservationDateFilter.value = button.dataset.pendingDate;
      editingReservationId = null;
      renderAdmin();
    });
  });
}

function renderMenuAvailability() {
  if (!adminMenuList) return;
  const query = String(menuSearch?.value || "").trim().toLowerCase();
  const items = adminMenu.filter((item) => `${item.category} ${item.name}`.toLowerCase().includes(query));

  if (items.length === 0) {
    adminMenuList.innerHTML = `<div class="admin-menu-empty">Nu exista produse pentru aceasta cautare.</div>`;
    return;
  }

  const groups = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  adminMenuList.innerHTML = Object.entries(groups).map(([category, categoryItems]) => `
    <section class="admin-menu-category">
      <h3>${category}</h3>
      <div class="admin-menu-items">
        ${categoryItems.map((item) => {
          const key = menuItemKey(item);
          const available = isMenuItemAvailable(item);
          return `
            <label class="admin-menu-item ${available ? "" : "unavailable"}">
              <input type="checkbox" data-menu-key="${key}" ${available ? "checked" : ""}>
              <span>
                <strong>${item.name}</strong>
                <small>${item.size ? `${item.size} - ` : ""}${item.price}</small>
              </span>
              <em>${available ? "Disponibil" : "Indisponibil"}</em>
            </label>
          `;
        }).join("")}
      </div>
    </section>
  `).join("");

  adminMenuList.querySelectorAll("[data-menu-key]").forEach((input) => {
    input.addEventListener("change", () => toggleMenuItem(input));
  });
}

async function toggleMenuItem(input) {
  const item = adminMenu.find((entry) => menuItemKey(entry) === input.dataset.menuKey);
  if (!item) return;
  input.disabled = true;

  try {
    await apiRequest(`/api/menu-availability/${encodeURIComponent(input.dataset.menuKey)}`, {
      method: "PATCH",
      body: JSON.stringify({
        available: input.checked,
        name: item.name,
        category: item.category,
        price: item.price,
      }),
    });
    await loadAdminState();
    updateAdminBadges();
    renderMenuAvailability();
  } catch (error) {
    input.checked = !input.checked;
    alert(error.message);
  } finally {
    input.disabled = false;
  }
}

function startAdminPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (!isAdminLoggedIn() || editingReservationId) return;
    renderAdmin();
  }, 10000);
}

function stopAdminPolling() {
  if (!pollTimer) return;
  clearInterval(pollTimer);
  pollTimer = null;
}

function renderReservations(reservations) {
  if (reservations.length === 0) {
    reservationsList.innerHTML = `<div class="reservation-card"><p>Nu există rezervări încă.</p></div>`;
    return;
  }

  const groups = [
    ["pending", "În așteptare"],
    ["confirmed", "Confirmate"],
    ["cancelled", "Anulate"],
  ];
  reservationsList.innerHTML = groups.map(([status, label]) => {
    const items = reservations.filter((reservation) => reservation.status === status);
    if (items.length === 0) return "";
    return `
      <section class="admin-status-group">
        <div class="admin-status-group-head">
          <h3>${label}</h3>
          <span>${items.length}</span>
        </div>
        <div class="admin-status-group-list">
          ${items.map(renderReservationCard).join("")}
        </div>
      </section>
    `;
  }).join("");

  bindReservationActions();
}

function renderReservationCard(reservation) {
  if (reservation.id === editingReservationId) return renderEditCard(reservation);

  const date = new Date(reservation.createdAt).toLocaleString("ro-RO");
  const canConfirm = reservation.status !== "confirmed";
  const canCancel = reservation.status !== "cancelled";

  return `
    <article class="reservation-card status-card-${reservation.status}" data-id="${reservation.id}">
      <div>
        <span class="status ${reservation.status}">${statusLabel(reservation.status)}</span>
        <h3>${reservation.lastName} ${reservation.firstName}</h3>
        <p><strong>${reservation.people}</strong> persoane • <a href="tel:${reservation.phone}">${reservation.phone}</a></p>
        <p>Data rezervării: <strong>${reservation.reservationDate}</strong></p>
        <p>Primită: ${date}</p>
        <p>Zonă: ${reservation.area === "terrace" ? "Terasă" : "Restaurant"}</p>
      </div>
      <div class="admin-actions">
        <button class="btn" type="button" data-action="confirm" ${canConfirm ? "" : "disabled"}>Confirmă</button>
        <button class="btn edit" type="button" data-action="edit">Modifică</button>
        <button class="btn danger" type="button" data-action="cancel" ${canCancel ? "" : "disabled"}>Anulează</button>
        <button class="btn ghost" type="button" data-action="delete">Șterge</button>
      </div>
    </article>
  `;
}

function renderEditCard(reservation) {
  return `
    <article class="reservation-card editing" data-id="${reservation.id}">
      <form class="reservation-edit-form" data-action="save-edit">
        <label>Nume<input name="lastName" value="${reservation.lastName || ""}" required></label>
        <label>Prenume<input name="firstName" value="${reservation.firstName || ""}" required></label>
        <label>Telefon<input name="phone" value="${reservation.phone || ""}" required></label>
        <label>Număr persoane<input name="people" type="number" min="1" max="120" value="${reservation.people}" required></label>
        <label>Data rezervării<input name="reservationDate" type="text" inputmode="numeric" placeholder="zz.ll.aaaa" pattern="\\d{2}\\.\\d{2}\\.\\d{4}" value="${reservation.reservationDate || ""}" required></label>
        <label>Zonă
          <select name="area">
            <option value="restaurant" ${reservation.area === "restaurant" ? "selected" : ""}>Restaurant</option>
            <option value="terrace" ${reservation.area === "terrace" ? "selected" : ""}>Terasă</option>
          </select>
        </label>
        <label>Status
          <select name="status">
            <option value="pending" ${reservation.status === "pending" ? "selected" : ""}>În așteptare</option>
            <option value="confirmed" ${reservation.status === "confirmed" ? "selected" : ""}>Confirmat</option>
            <option value="cancelled" ${reservation.status === "cancelled" ? "selected" : ""}>Anulat</option>
          </select>
        </label>
        <p class="form-note" data-edit-message></p>
      </form>
      <div class="admin-actions">
        <button class="btn" type="button" data-action="save-edit">Salvează</button>
        <button class="btn ghost" type="button" data-action="cancel-edit">Renunță</button>
      </div>
    </article>
  `;
}

function bindReservationActions() {
  reservationsList.querySelectorAll("[data-action='confirm']").forEach((button) => {
    button.addEventListener("click", () => updateReservation(button.closest(".reservation-card").dataset.id, { status: "confirmed" }));
  });

  reservationsList.querySelectorAll("[data-action='cancel']").forEach((button) => {
    button.addEventListener("click", () => updateReservation(button.closest(".reservation-card").dataset.id, { status: "cancelled" }));
  });

  reservationsList.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      editingReservationId = button.closest(".reservation-card").dataset.id;
      renderReservations(adminState.reservations);
    });
  });

  reservationsList.querySelectorAll("[data-action='save-edit']").forEach((button) => {
    button.addEventListener("click", () => saveReservationEdit(button.closest(".reservation-card").dataset.id));
  });

  reservationsList.querySelectorAll("[data-action='cancel-edit']").forEach((button) => {
    button.addEventListener("click", () => {
      editingReservationId = null;
      renderReservations(adminState.reservations);
    });
  });

  reservationsList.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => deleteReservation(button.closest(".reservation-card").dataset.id));
  });
}

async function updateReservation(id, patch) {
  try {
    await apiRequest(`/api/reservations/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    editingReservationId = null;
    renderAdmin();
  } catch (error) {
    alert(error.message);
  }
}

async function saveReservationEdit(id) {
  const card = reservationsList.querySelector(`[data-id="${id}"]`);
  const form = card.querySelector(".reservation-edit-form");
  const message = card.querySelector("[data-edit-message]");
  const data = new FormData(form);
  const people = Number(data.get("people"));

  if (!Number.isInteger(people) || people < 1) {
    showMessage(message, "Numărul de persoane trebuie să fie valid.", "error");
    return;
  }

  try {
    await apiRequest(`/api/reservations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        firstName: String(data.get("firstName")).trim(),
        lastName: String(data.get("lastName")).trim(),
        phone: normalizePhone(data.get("phone")),
        people,
        reservationDate: String(data.get("reservationDate")).trim(),
        area: String(data.get("area")),
        status: String(data.get("status")),
      }),
    });
    editingReservationId = null;
    renderAdmin();
  } catch (error) {
    showMessage(message, error.message, "error");
  }
}

async function deleteReservation(id) {
  await apiRequest(`/api/reservations/${id}`, { method: "DELETE" });
  editingReservationId = null;
  renderAdmin();
}

function renderOrders(orders) {
  if (!ordersList) return;
  const query = String(orderSearch?.value || "").trim().toLowerCase();
  const selectedDate = normalizeOptionalDateFilter(orderDateFilter);
  const filteredOrders = orders.filter((order) => {
    const matchesQuery = `${order.customerName} ${order.phone} ${order.address} ${order.city}`.toLowerCase().includes(query);
    const matchesDate = !selectedDate || orderDateIso(order) === selectedDate;
    return matchesQuery && matchesDate;
  });

  if (filteredOrders.length === 0) {
    ordersList.innerHTML = `<div class="order-admin-card"><p>${query || selectedDate ? "Nu există comenzi pentru filtrul ales." : "Nu există comenzi încă."}</p></div>`;
    return;
  }

  const groups = [
    ["new", "Comenzi noi"],
    ["preparing", "În pregătire"],
    ["delivered", "Livrate"],
    ["cancelled", "Anulate"],
  ];
  ordersList.innerHTML = groups.map(([status, label]) => {
    const items = filteredOrders.filter((order) => order.status === status);
    if (items.length === 0) return "";
    return `
      <section class="admin-status-group">
        <div class="admin-status-group-head">
          <h3>${label}</h3>
          <span>${items.length}</span>
        </div>
        <div class="admin-status-group-list">
          ${items.map(renderOrderCard).join("")}
        </div>
      </section>
    `;
  }).join("");

  ordersList.querySelectorAll("[data-order-action]").forEach((button) => {
    button.addEventListener("click", () => updateOrder(button.closest(".order-admin-card").dataset.orderId, button.dataset.orderAction));
  });
}

function orderDateIso(order) {
  const date = new Date(order.createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return localDateString(date);
}

function orderMapQuery(order, cityLabel) {
  const preciseAddress = [
    order.street,
    order.streetNumber ? `nr. ${order.streetNumber}` : "",
    order.block ? `bloc ${order.block}` : "",
  ].filter(Boolean).join(", ");
  return [preciseAddress || order.address, cityLabel, "Romania"].filter(Boolean).join(", ");
}

function orderCityLabel(value) {
  const city = String(value || "").trim();
  if (!city || city.toLowerCase() === "craiova") return "Craiova";
  if (city === "nearby") return "Localitate limitrofă";
  if (city === "outside") return "În afara zonei standard";
  return city;
}

function renderOrderCard(order) {
  const date = new Date(order.createdAt).toLocaleString("ro-RO");
  const cityLabel = orderCityLabel(order.city);
  const items = (order.items || []).map((item) => `<li>${item.quantity} x ${item.name} <span>${item.priceLabel}</span></li>`).join("");
  const mapQuery = orderMapQuery(order, cityLabel);
  const encodedMapQuery = encodeURIComponent(mapQuery);
  return `
    <article class="order-admin-card status-card-${order.status}" data-order-id="${order.id}">
      <div>
        <span class="status order-${order.status}">${orderStatusLabel(order.status)}</span>
        <h3>${order.customerName}</h3>
        <p><a href="tel:${order.phone}">${order.phone}</a> • ${cityLabel}</p>
        <p>${order.address}</p>
        <p>Primită: ${date}</p>
        <p>Plată: ${paymentLabel(order)}</p>
        ${order.notes ? `<p>Observații: ${order.notes}</p>` : ""}
        <ul class="order-admin-items">${items}</ul>
        <p><strong>Total: ${money(order.total)}</strong> <span>(${money(order.subtotal)} + livrare ${money(order.deliveryFee)})</span></p>
        <div class="order-map">
          <iframe title="Locatie comanda" src="https://www.google.com/maps?q=${encodedMapQuery}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}" target="_blank" rel="noopener">Deschide locatia in Google Maps</a>
        </div>
      </div>
      <div class="admin-actions">
        <button class="btn" type="button" data-order-action="preparing" ${order.status === "preparing" ? "disabled" : ""}>În pregătire</button>
        <button class="btn edit" type="button" data-order-action="delivered" ${order.status === "delivered" ? "disabled" : ""}>Livrată</button>
        <button class="btn danger" type="button" data-order-action="cancelled" ${order.status === "cancelled" ? "disabled" : ""}>Anulează</button>
        <button class="btn ghost" type="button" data-order-action="delete">Șterge</button>
      </div>
    </article>
  `;
}

async function updateOrder(id, action) {
  if (action === "delete") {
    await apiRequest(`/api/orders/${id}`, { method: "DELETE" });
  } else {
    await apiRequest(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status: action }) });
  }
  renderAdmin();
}

function renderClients() {
  const query = String(clientSearch?.value || "").trim().toLowerCase();
  const clients = adminState.clients
    .filter((client) => `${client.fullName} ${client.phone}`.toLowerCase().includes(query))
    .sort((a, b) => new Date(b.lastOrderAt || b.lastReservationAt || 0) - new Date(a.lastOrderAt || a.lastReservationAt || 0));

  if (clients.length === 0) {
    clientsList.innerHTML = `<div class="client-card"><p>Nu există clienți pentru această căutare.</p></div>`;
    return;
  }

  clientsList.innerHTML = clients.map((client) => {
    const lastReservation = client.lastReservationAt ? new Date(client.lastReservationAt).toLocaleString("ro-RO") : "Fără rezervări";
    const lastOrder = client.lastOrderAt ? new Date(client.lastOrderAt).toLocaleString("ro-RO") : "Fără comenzi";
    return `
      <article class="client-card">
        <div>
          <h3>${client.fullName || "Client fără nume"}</h3>
          <p><a href="tel:${client.phone}">${client.phone || "Telefon lipsă"}</a></p>
        </div>
        <div>
          <span>${client.reservationCount || 0} rezervări</span>
          <span>${client.orderCount || 0} comenzi • ${money(client.totalOrders || 0)}</span>
          <small>Ultima rezervare: ${lastReservation}</small>
          <small>Ultima comandă: ${lastOrder}</small>
          <button class="btn ghost client-delete" type="button" data-client-delete="${client.key}">Șterge client</button>
        </div>
      </article>
    `;
  }).join("");

  clientsList.querySelectorAll("[data-client-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      await apiRequest(`/api/clients/${encodeURIComponent(button.dataset.clientDelete)}`, { method: "DELETE" });
      renderAdmin();
    });
  });
}

async function loginAdmin(event) {
  event.preventDefault();
  const form = new FormData(adminLogin);
  const username = String(form.get("username")).trim();
  const password = String(form.get("password"));

  try {
    await apiRequest("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    sessionStorage.setItem(SESSION_KEY, "true");
    adminLogin.reset();
    showMessage(adminMessage, "");
    renderAdmin();
    startAdminPolling();
    return;
  } catch (error) {
    showMessage(adminMessage, error.message, "error");
  }
}

adminLogin.addEventListener("submit", loginAdmin);
logoutBtn.addEventListener("click", async () => {
  await apiRequest("/api/admin/logout", { method: "POST" }).catch(() => null);
  sessionStorage.removeItem(SESSION_KEY);
  stopAdminPolling();
  isFirstAdminLoad = true;
  renderAdmin();
});
clientSearch?.addEventListener("input", renderClients);
orderSearch?.addEventListener("input", () => renderOrders(adminState.orders));
orderDateFilter?.addEventListener("change", () => renderOrders(adminState.orders));
orderDateFilter?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  renderOrders(adminState.orders);
});
orderDateClear?.addEventListener("click", () => {
  if (orderDateFilter) orderDateFilter.value = "";
  renderOrders(adminState.orders);
});
menuSearch?.addEventListener("input", renderMenuAvailability);
reservationDateFilter?.addEventListener("change", () => {
  normalizeReservationDateFilter();
  editingReservationId = null;
  renderAdmin();
});
reservationDateFilter?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  normalizeReservationDateFilter();
  editingReservationId = null;
  renderAdmin();
});
tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchAdminTab(button.dataset.adminTab));
});
switchAdminTab(activeAdminTab);
renderAdmin();
if (isAdminLoggedIn()) startAdminPolling();
