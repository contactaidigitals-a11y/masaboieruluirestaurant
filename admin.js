const CAPACITY = { restaurant: 100, terrace: 70 };
const ADMIN = { username: "Adminmb", password: "masaboierului2026" };
const STORAGE_KEY = "masaBoieruluiReservations";
const CLIENTS_KEY = "masaBoieruluiClients";
const SESSION_KEY = "masaBoieruluiAdmin";

const adminLogin = document.querySelector("#adminLogin");
const adminPanel = document.querySelector("#adminPanel");
const adminMessage = document.querySelector("#adminMessage");
const reservationsList = document.querySelector("#reservationsList");
const clientsList = document.querySelector("#clientsList");
const clientSearch = document.querySelector("#clientSearch");
const logoutBtn = document.querySelector("#logoutBtn");

let editingReservationId = null;

function readReservations() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function writeReservations(reservations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
}

function readClients() {
  return JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
}

function writeClients(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\s+/g, "");
}

function clientKey(reservation) {
  const phone = normalizePhone(reservation.phone);
  return phone || `${reservation.lastName} ${reservation.firstName}`.trim().toLowerCase();
}

function rebuildClientsFromReservations() {
  const existingByKey = new Map(readClients().map((client) => [client.key, client]));
  const reservationsByKey = new Map();

  readReservations().forEach((reservation) => {
    const key = clientKey(reservation);
    if (!key) return;

    const current = reservationsByKey.get(key) || {
      key,
      firstName: reservation.firstName,
      lastName: reservation.lastName,
      fullName: `${reservation.lastName} ${reservation.firstName}`.trim(),
      phone: normalizePhone(reservation.phone),
      reservationCount: 0,
      totalPeople: 0,
      lastReservationAt: reservation.createdAt,
    };

    current.firstName = reservation.firstName || current.firstName;
    current.lastName = reservation.lastName || current.lastName;
    current.fullName = `${current.lastName} ${current.firstName}`.trim();
    current.phone = normalizePhone(reservation.phone) || current.phone;
    current.reservationCount += 1;
    current.totalPeople += Number(reservation.people || 0);
    if (new Date(reservation.createdAt) > new Date(current.lastReservationAt)) {
      current.lastReservationAt = reservation.createdAt;
    }
    reservationsByKey.set(key, current);
  });

  const merged = Array.from(reservationsByKey.values()).map((client) => ({
    ...existingByKey.get(client.key),
    ...client,
  }));

  existingByKey.forEach((client, key) => {
    if (!reservationsByKey.has(key)) merged.push(client);
  });

  writeClients(merged);
}

function confirmedSeats(area, excludeId = null) {
  return readReservations()
    .filter((reservation) => reservation.status === "confirmed" && reservation.area === area && reservation.id !== excludeId)
    .reduce((sum, reservation) => sum + Number(reservation.people), 0);
}

function availableSeats(area, excludeId = null) {
  return CAPACITY[area] - confirmedSeats(area, excludeId);
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

function showMessage(element, text, type = "ok") {
  element.textContent = text;
  element.className = `form-note ${type}`;
}

function statusLabel(status) {
  if (status === "confirmed") return "Confirmat";
  if (status === "cancelled") return "Anulat";
  return "În așteptare";
}

function renderAdmin() {
  rebuildClientsFromReservations();
  const reservations = readReservations();
  document.querySelector("#adminRestaurantSeats").textContent = availableSeats("restaurant");
  document.querySelector("#adminTerraceSeats").textContent = availableSeats("terrace");
  document.querySelector("#pendingCount").textContent = reservations.filter((item) => item.status === "pending").length;

  if (!isAdminLoggedIn()) {
    adminLogin.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    return;
  }

  adminLogin.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  renderReservations(reservations);
  renderClients();
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
    button.addEventListener("click", () => updateReservationStatus(button.closest(".reservation-card").dataset.id, "confirmed"));
  });

  reservationsList.querySelectorAll("[data-action='cancel']").forEach((button) => {
    button.addEventListener("click", () => updateReservationStatus(button.closest(".reservation-card").dataset.id, "cancelled"));
  });

  reservationsList.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      editingReservationId = button.closest(".reservation-card").dataset.id;
      renderAdmin();
    });
  });

  reservationsList.querySelectorAll("button[data-action='save-edit']").forEach((button) => {
    button.addEventListener("click", () => saveReservationEdit(button.closest(".reservation-card").dataset.id));
  });

  reservationsList.querySelectorAll("[data-action='cancel-edit']").forEach((button) => {
    button.addEventListener("click", () => {
      editingReservationId = null;
      renderAdmin();
    });
  });

  reservationsList.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => deleteReservation(button.closest(".reservation-card").dataset.id));
  });
}

function updateReservationStatus(id, status) {
  const reservations = readReservations();
  const target = reservations.find((reservation) => reservation.id === id);
  if (!target) return;

  if (status === "confirmed" && target.people > availableSeats(target.area, id)) {
    alert(`Nu sunt suficiente locuri disponibile în ${target.area === "terrace" ? "terasă" : "restaurant"}.`);
    return;
  }

  writeReservations(reservations.map((reservation) => reservation.id === id ? { ...reservation, status } : reservation));
  editingReservationId = null;
  renderAdmin();
}

function saveReservationEdit(id) {
  const card = reservationsList.querySelector(`[data-id="${id}"]`);
  const form = card.querySelector(".reservation-edit-form");
  const message = card.querySelector("[data-edit-message]");
  const data = new FormData(form);
  const people = Number(data.get("people"));
  const area = String(data.get("area"));
  const status = String(data.get("status"));

  if (!Number.isInteger(people) || people < 1) {
    showMessage(message, "Numărul de persoane trebuie să fie valid.", "error");
    return;
  }

  if (status === "confirmed" && people > availableSeats(area, id)) {
    showMessage(message, `Nu sunt suficiente locuri disponibile în ${area === "terrace" ? "terasă" : "restaurant"}.`, "error");
    return;
  }

  const updatedReservations = readReservations().map((reservation) => {
    if (reservation.id !== id) return reservation;
    return {
      ...reservation,
      firstName: String(data.get("firstName")).trim(),
      lastName: String(data.get("lastName")).trim(),
      phone: normalizePhone(data.get("phone")),
      people,
      area,
      status,
      updatedAt: new Date().toISOString(),
    };
  });

  writeReservations(updatedReservations);
  editingReservationId = null;
  renderAdmin();
}

function deleteReservation(id) {
  writeReservations(readReservations().filter((reservation) => reservation.id !== id));
  editingReservationId = null;
  renderAdmin();
}

function renderClients() {
  const query = String(clientSearch?.value || "").trim().toLowerCase();
  const clients = readClients()
    .filter((client) => `${client.fullName} ${client.phone}`.toLowerCase().includes(query))
    .sort((a, b) => new Date(b.lastReservationAt || 0) - new Date(a.lastReservationAt || 0));

  if (clients.length === 0) {
    clientsList.innerHTML = `<div class="client-card"><p>Nu există clienți pentru această căutare.</p></div>`;
    return;
  }

  clientsList.innerHTML = clients.map((client) => {
    const lastDate = client.lastReservationAt ? new Date(client.lastReservationAt).toLocaleString("ro-RO") : "Fără rezervări";
    return `
      <article class="client-card">
        <div>
          <h3>${client.fullName || "Client fără nume"}</h3>
          <p><a href="tel:${client.phone}">${client.phone || "Telefon lipsă"}</a></p>
        </div>
        <div>
          <span>${client.reservationCount || 0} rezervări</span>
          <span>${client.totalPeople || 0} persoane total</span>
          <small>Ultima rezervare: ${lastDate}</small>
          <button class="btn ghost client-delete" type="button" data-client-delete="${client.key}">Șterge client</button>
        </div>
      </article>
    `;
  }).join("");

  clientsList.querySelectorAll("[data-client-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      writeClients(readClients().filter((client) => client.key !== button.dataset.clientDelete));
      renderClients();
    });
  });
}

function loginAdmin(event) {
  event.preventDefault();
  const form = new FormData(adminLogin);
  const username = String(form.get("username")).trim();
  const password = String(form.get("password"));

  if (username === ADMIN.username && password === ADMIN.password) {
    sessionStorage.setItem(SESSION_KEY, "true");
    adminLogin.reset();
    showMessage(adminMessage, "");
    renderAdmin();
    return;
  }

  showMessage(adminMessage, "User sau parolă incorectă.", "error");
}

adminLogin.addEventListener("submit", loginAdmin);
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  renderAdmin();
});
clientSearch?.addEventListener("input", renderClients);
renderAdmin();
