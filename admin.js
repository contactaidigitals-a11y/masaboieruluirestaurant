const SESSION_KEY = "masaBoieruluiAdmin";

const adminLogin = document.querySelector("#adminLogin");
const adminPanel = document.querySelector("#adminPanel");
const adminMessage = document.querySelector("#adminMessage");
const reservationsList = document.querySelector("#reservationsList");
const ordersList = document.querySelector("#ordersList");
const clientsList = document.querySelector("#clientsList");
const clientSearch = document.querySelector("#clientSearch");
const adminMenuList = document.querySelector("#adminMenuList");
const menuSearch = document.querySelector("#menuSearch");
const reservationDateFilter = document.querySelector("#reservationDateFilter");
const logoutBtn = document.querySelector("#logoutBtn");
const enableNotificationsBtn = document.querySelector("#enableNotificationsBtn");
const tabButtons = document.querySelectorAll("[data-admin-tab]");
const tabPanels = document.querySelectorAll("[data-admin-tab-panel]");

let editingReservationId = null;
const adminMenu = window.MASA_BOIERULUI_MENU || [];

let adminState = { reservations: [], orders: [], clients: [], menuAvailability: [], stats: {} };
let activeAdminTab = "orders";
let isFirstAdminLoad = true;
let knownOrderIds = new Set();
let knownReservationIds = new Set();
let pollTimer = null;

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
  if (order.paymentMethod === "card") return "Card online - Netopia în așteptare";
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
  if (ordersCount) ordersCount.textContent = adminState.stats.newOrders || 0;
  if (reservationsCount) reservationsCount.textContent = adminState.stats.pendingReservations || 0;
  if (menuCount) menuCount.textContent = adminState.stats.unavailableItems || 0;
  const total = Number(adminState.stats.newOrders || 0) + Number(adminState.stats.pendingReservations || 0);
  document.title = total > 0 ? `(${total}) Admin | Masa Boierului` : "Admin | Masa Boierului";
}

function playAdminSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.22);
  } catch (_error) {
    // Browserul poate bloca sunetul pana exista interactiune.
  }
}

function notifyAdmin(title, body) {
  playAdminSound();
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "../assets/62890.jpg" });
  }
}

function detectNewItems() {
  const notificationOrders = adminState.notifications?.orders || adminState.orders;
  const notificationReservations = adminState.notifications?.reservations || adminState.reservations;
  const currentOrderIds = new Set(notificationOrders.map((order) => order.id));
  const currentReservationIds = new Set(notificationReservations.map((reservation) => reservation.id));

  if (isFirstAdminLoad) {
    knownOrderIds = currentOrderIds;
    knownReservationIds = currentReservationIds;
    isFirstAdminLoad = false;
    return;
  }

  const newOrders = notificationOrders.filter((order) => !knownOrderIds.has(order.id));
  const newReservations = notificationReservations.filter((reservation) => !knownReservationIds.has(reservation.id));

  newOrders.forEach((order) => {
    notifyAdmin("Comandă nouă", `${order.customerName} - ${money(order.total)} - ${paymentLabel(order)}`);
  });
  newReservations.forEach((reservation) => {
    notifyAdmin("Rezervare nouă", `${reservation.lastName} ${reservation.firstName} - ${reservation.people} persoane - ${reservation.reservationDate}`);
  });

  knownOrderIds = currentOrderIds;
  knownReservationIds = currentReservationIds;
}

async function loadAdminState() {
  const date = reservationDateFilter?.value || localDateString();
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
    if (reservationDateFilter && !reservationDateFilter.value) reservationDateFilter.value = localDateString();
    await loadAdminState();
    document.querySelector("#adminRestaurantSeats").textContent = adminState.stats.restaurantSeats;
    document.querySelector("#adminTerraceSeats").textContent = adminState.stats.terraceSeats;
    document.querySelector("#pendingCount").textContent = adminState.stats.pendingReservations;
    document.querySelector("#newOrdersCount").textContent = adminState.stats.newOrders;
    updateAdminBadges();
    detectNewItems();
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

  reservationsList.innerHTML = reservations.map((reservation) => {
    if (reservation.id === editingReservationId) return renderEditCard(reservation);

    const date = new Date(reservation.createdAt).toLocaleString("ro-RO");
    const canConfirm = reservation.status !== "confirmed";
    const canCancel = reservation.status !== "cancelled";

    return `
      <article class="reservation-card" data-id="${reservation.id}">
        <div>
          <span class="status ${reservation.status}">${statusLabel(reservation.status)}</span>
          <h3>${reservation.lastName} ${reservation.firstName}</h3>
          <p><strong>${reservation.people}</strong> persoane • <a href="tel:${reservation.phone}">${reservation.phone}</a></p>
          <p>Data rezervării: ${reservation.reservationDate}</p>
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
  }).join("");

  bindReservationActions();
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
  if (orders.length === 0) {
    ordersList.innerHTML = `<div class="order-admin-card"><p>Nu există comenzi încă.</p></div>`;
    return;
  }

  ordersList.innerHTML = orders.map((order) => {
    const date = new Date(order.createdAt).toLocaleString("ro-RO");
    const cityLabel = order.city === "nearby" ? "Localitate limitrofă" : order.city === "outside" ? "În afara zonei standard" : "Craiova";
    const items = (order.items || []).map((item) => `<li>${item.quantity} x ${item.name} <span>${item.priceLabel}</span></li>`).join("");
    return `
      <article class="order-admin-card" data-order-id="${order.id}">
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
        </div>
        <div class="admin-actions">
          <button class="btn" type="button" data-order-action="preparing">În pregătire</button>
          <button class="btn edit" type="button" data-order-action="delivered">Livrată</button>
          <button class="btn danger" type="button" data-order-action="cancelled">Anulează</button>
          <button class="btn ghost" type="button" data-order-action="delete">Șterge</button>
        </div>
      </article>
    `;
  }).join("");

  ordersList.querySelectorAll("[data-order-action]").forEach((button) => {
    button.addEventListener("click", () => updateOrder(button.closest(".order-admin-card").dataset.orderId, button.dataset.orderAction));
  });
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
menuSearch?.addEventListener("input", renderMenuAvailability);
reservationDateFilter?.addEventListener("change", () => {
  editingReservationId = null;
  isFirstAdminLoad = true;
  renderAdmin();
});
tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchAdminTab(button.dataset.adminTab));
});
enableNotificationsBtn?.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Browserul nu suportă notificări.");
    return;
  }
  const permission = await Notification.requestPermission();
  enableNotificationsBtn.textContent = permission === "granted" ? "Notificări active" : "Notificări blocate";
  playAdminSound();
});
switchAdminTab(activeAdminTab);
renderAdmin();
if (isAdminLoggedIn()) startAdminPolling();
