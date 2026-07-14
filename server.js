const crypto = require("crypto");
const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;
const CAPACITY = { restaurant: 100, terrace: 70 };
const hasDatabase = Boolean(process.env.DATABASE_URL);
const isProductionLike = process.env.NODE_ENV === "production" || hasDatabase;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || (isProductionLike ? "" : "Adminmb");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProductionLike ? "" : "masaboierului2026");
const adminSessions = new Map();

app.use(express.json({ limit: "1mb" }));

let pool = null;
const memory = {
  reservations: [],
  orders: [],
  clients: [],
  menuAvailability: [],
};

if (hasDatabase) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
  });
}

async function query(sql, params = []) {
  if (!pool) throw new Error("DATABASE_URL is not configured");
  const result = await pool.query(sql, params);
  return result.rows;
}

async function initDb() {
  if (!pool) return;
  await query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      people INTEGER NOT NULL CHECK (people > 0),
      phone TEXT NOT NULL,
      reservation_date DATE NOT NULL DEFAULT CURRENT_DATE,
      area TEXT NOT NULL DEFAULT 'restaurant',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      street TEXT,
      street_number TEXT,
      block TEXT,
      apartment TEXT,
      city TEXT NOT NULL,
      notes TEXT,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      items JSONB NOT NULL,
      subtotal INTEGER NOT NULL,
      delivery_fee INTEGER NOT NULL,
      total INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS clients (
      key TEXT PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      full_name TEXT,
      phone TEXT,
      reservation_count INTEGER NOT NULL DEFAULT 0,
      total_people INTEGER NOT NULL DEFAULT 0,
      order_count INTEGER NOT NULL DEFAULT 0,
      total_orders INTEGER NOT NULL DEFAULT 0,
      last_reservation_at TIMESTAMPTZ,
      last_order_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS menu_availability (
      item_key TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price TEXT,
      available BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reservation_date DATE NOT NULL DEFAULT CURRENT_DATE;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS street TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS street_number TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS block TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS apartment TEXT;
  `);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\s+/g, "");
}

function normalizeMenuKey(key) {
  return String(key || "").trim().normalize("NFC");
}

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseReservationDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (localDateString(date) !== iso) return null;
  return iso;
}

function normalizeIsoDate(value) {
  if (!value) return "";
  if (value instanceof Date) return localDateString(value);
  return String(value).slice(0, 10);
}

function formatRoDate(isoDate) {
  const normalized = normalizeIsoDate(isoDate);
  if (!normalized) return "";
  const [year, month, day] = normalized.split("-");
  return `${day}.${month}.${year}`;
}

function reservationClientKey(reservation) {
  const phone = normalizePhone(reservation.phone);
  return phone || `${reservation.lastName} ${reservation.firstName}`.trim().toLowerCase();
}

function orderClientKey(order) {
  const phone = normalizePhone(order.phone);
  return phone || String(order.customerName || "").trim().toLowerCase();
}

function rowReservation(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    people: Number(row.people),
    phone: row.phone,
    reservationDate: formatRoDate(row.reservation_date),
    reservationDateIso: normalizeIsoDate(row.reservation_date),
    area: row.area,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowOrder(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    street: row.street || "",
    streetNumber: row.street_number || "",
    block: row.block || "",
    apartment: row.apartment || "",
    city: row.city,
    notes: row.notes || "",
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    items: row.items,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowClient(row) {
  return {
    key: row.key,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    fullName: row.full_name || "",
    phone: row.phone || "",
    reservationCount: Number(row.reservation_count || 0),
    totalPeople: Number(row.total_people || 0),
    orderCount: Number(row.order_count || 0),
    totalOrders: Number(row.total_orders || 0),
    lastReservationAt: row.last_reservation_at,
    lastOrderAt: row.last_order_at,
  };
}

function buildDeliveryAddress({ street, streetNumber, block, apartment }) {
  return [
    street,
    streetNumber ? `nr. ${streetNumber}` : "",
    block ? `bloc ${block}` : "",
    apartment ? `ap. ${apartment}` : "",
  ].filter(Boolean).join(", ");
}

function rowMenuAvailability(row) {
  return {
    key: normalizeMenuKey(row.item_key),
    name: row.name,
    category: row.category,
    price: row.price || "",
    available: row.available !== false,
    updatedAt: row.updated_at,
  };
}

async function upsertClientFromReservation(reservation) {
  const key = reservationClientKey(reservation);
  if (!key) return;
  const fullName = `${reservation.lastName} ${reservation.firstName}`.trim();
  const phone = normalizePhone(reservation.phone);

  if (!pool) {
    const existing = memory.clients.find((client) => client.key === key);
    const next = {
      ...existing,
      key,
      firstName: reservation.firstName,
      lastName: reservation.lastName,
      fullName,
      phone,
      reservationCount: (existing?.reservationCount || 0) + 1,
      totalPeople: (existing?.totalPeople || 0) + Number(reservation.people || 0),
      lastReservationAt: reservation.createdAt,
    };
    memory.clients = existing ? memory.clients.map((client) => client.key === key ? next : client) : [next, ...memory.clients];
    return;
  }

  await query(`
    INSERT INTO clients (key, first_name, last_name, full_name, phone, reservation_count, total_people, last_reservation_at)
    VALUES ($1, $2, $3, $4, $5, 1, $6, $7)
    ON CONFLICT (key) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      reservation_count = clients.reservation_count + 1,
      total_people = clients.total_people + EXCLUDED.total_people,
      last_reservation_at = EXCLUDED.last_reservation_at,
      updated_at = NOW()
  `, [key, reservation.firstName, reservation.lastName, fullName, phone, reservation.people, reservation.createdAt]);
}

async function upsertClientFromOrder(order) {
  const key = orderClientKey(order);
  if (!key) return;
  const fullName = String(order.customerName || "").trim();
  const phone = normalizePhone(order.phone);

  if (!pool) {
    const existing = memory.clients.find((client) => client.key === key);
    const next = {
      ...existing,
      key,
      fullName,
      phone,
      orderCount: (existing?.orderCount || 0) + 1,
      totalOrders: (existing?.totalOrders || 0) + Number(order.total || 0),
      lastOrderAt: order.createdAt,
    };
    memory.clients = existing ? memory.clients.map((client) => client.key === key ? next : client) : [next, ...memory.clients];
    return;
  }

  await query(`
    INSERT INTO clients (key, full_name, phone, order_count, total_orders, last_order_at)
    VALUES ($1, $2, $3, 1, $4, $5)
    ON CONFLICT (key) DO UPDATE SET
      full_name = COALESCE(NULLIF(clients.full_name, ''), EXCLUDED.full_name),
      phone = EXCLUDED.phone,
      order_count = clients.order_count + 1,
      total_orders = clients.total_orders + EXCLUDED.total_orders,
      last_order_at = EXCLUDED.last_order_at,
      updated_at = NOW()
  `, [key, fullName, phone, order.total, order.createdAt]);
}

async function getReservations(reservationDate = null) {
  if (!pool) {
    return reservationDate
      ? memory.reservations.filter((reservation) => reservation.reservationDateIso === reservationDate)
      : memory.reservations;
  }
  if (reservationDate) {
    return (await query("SELECT * FROM reservations WHERE reservation_date = $1 ORDER BY created_at DESC", [reservationDate])).map(rowReservation);
  }
  return (await query("SELECT * FROM reservations ORDER BY reservation_date DESC, created_at DESC")).map(rowReservation);
}

async function getOrders() {
  if (!pool) return memory.orders;
  return (await query("SELECT * FROM orders ORDER BY created_at DESC")).map(rowOrder);
}

async function getClients() {
  if (!pool) return memory.clients;
  return (await query("SELECT * FROM clients ORDER BY COALESCE(last_order_at, last_reservation_at, updated_at) DESC")).map(rowClient);
}

async function getMenuAvailability() {
  if (!pool) return memory.menuAvailability;
  return (await query("SELECT * FROM menu_availability ORDER BY category, name")).map(rowMenuAvailability);
}

async function unavailableMenuKeys() {
  const availability = await getMenuAvailability();
  return new Set(availability.filter((item) => item.available === false).map((item) => normalizeMenuKey(item.key)));
}

function confirmedSeats(reservations, area, excludeId = null) {
  return reservations
    .filter((reservation) => reservation.status === "confirmed" && reservation.area === area && reservation.id !== excludeId)
    .reduce((sum, reservation) => sum + Number(reservation.people), 0);
}

function availableSeats(reservations, area, excludeId = null) {
  return CAPACITY[area] - confirmedSeats(reservations, area, excludeId);
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function parseCookies(req) {
  return String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim().split("="))
    .filter(([key]) => key)
    .reduce((cookies, [key, value]) => ({ ...cookies, [key]: decodeURIComponent(value || "") }), {});
}

function requireAdmin(req, res, next) {
  const token = parseCookies(req).mb_admin;
  const expiresAt = token ? adminSessions.get(token) : null;
  if (!expiresAt || expiresAt < Date.now()) {
    if (token) adminSessions.delete(token);
    res.status(401).json({ error: "Autentificare necesară." });
    return;
  }
  next();
}

app.get("/api/health", asyncHandler(async (_req, res) => {
  res.json({ ok: true, database: hasDatabase ? "postgresql" : "memory" });
}));

app.get("/api/menu/availability", asyncHandler(async (_req, res) => {
  const availability = await getMenuAvailability();
  res.json({
    unavailableKeys: availability.filter((item) => item.available === false).map((item) => item.key),
  });
}));

app.post("/api/admin/login", asyncHandler(async (req, res) => {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    res.status(500).json({ error: "ADMIN_USERNAME și ADMIN_PASSWORD trebuie setate în variabilele serverului." });
    return;
  }
  if (String(req.body.username || "").trim() !== ADMIN_USERNAME || String(req.body.password || "") !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "User sau parolă incorectă." });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  adminSessions.set(token, Date.now() + 1000 * 60 * 60 * 12);
  res.setHeader("Set-Cookie", `mb_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`);
  res.json({ ok: true });
}));

app.post("/api/admin/logout", asyncHandler(async (req, res) => {
  const token = parseCookies(req).mb_admin;
  if (token) adminSessions.delete(token);
  res.setHeader("Set-Cookie", "mb_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ ok: true });
}));

app.get("/api/admin/state", requireAdmin, asyncHandler(async (req, res) => {
  const selectedDate = String(req.query.date || localDateString()).slice(0, 10);
  const allReservations = await getReservations();
  const reservations = await getReservations(selectedDate);
  const orders = await getOrders();
  const clients = await getClients();
  const menuAvailability = await getMenuAvailability();
  const pendingReservations = allReservations.filter((item) => item.status === "pending");
  res.json({
    selectedDate,
    reservations,
    orders,
    clients,
    menuAvailability,
    notifications: {
      reservations: pendingReservations,
      orders: orders.filter((item) => item.status === "new"),
    },
    stats: {
      restaurantSeats: availableSeats(reservations, "restaurant"),
      terraceSeats: availableSeats(reservations, "terrace"),
      pendingReservations: reservations.filter((item) => item.status === "pending").length,
      pendingReservationsTotal: pendingReservations.length,
      newOrders: orders.filter((item) => item.status === "new").length,
      unavailableItems: menuAvailability.filter((item) => item.available === false).length,
    },
  });
}));

app.patch("/api/menu-availability/:key", requireAdmin, asyncHandler(async (req, res) => {
  const key = normalizeMenuKey(req.params.key);
  const available = req.body.available !== false;
  const item = {
    key,
    name: String(req.body.name || "").trim(),
    category: String(req.body.category || "").trim(),
    price: String(req.body.price || "").trim(),
    available,
    updatedAt: new Date().toISOString(),
  };

  if (!item.key || !item.name || !item.category) {
    res.status(400).json({ error: "Produsul nu este valid." });
    return;
  }

  if (!pool) {
    const existing = memory.menuAvailability.find((entry) => entry.key === item.key);
    memory.menuAvailability = existing
      ? memory.menuAvailability.map((entry) => entry.key === item.key ? item : entry)
      : [item, ...memory.menuAvailability];
  } else {
    await query(`
      INSERT INTO menu_availability (item_key, name, category, price, available, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (item_key) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        available = EXCLUDED.available,
        updated_at = EXCLUDED.updated_at
    `, [item.key, item.name, item.category, item.price, item.available, item.updatedAt]);
  }

  res.json(item);
}));

app.post("/api/reservations", asyncHandler(async (req, res) => {
  const people = Number(req.body.people);
  const reservationDateIso = parseReservationDate(req.body.reservationDate);
  const reservation = {
    id: crypto.randomUUID(),
    firstName: String(req.body.firstName || "").trim(),
    lastName: String(req.body.lastName || "").trim(),
    people,
    phone: normalizePhone(req.body.phone),
    reservationDate: formatRoDate(reservationDateIso),
    reservationDateIso,
    area: "restaurant",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (!reservation.firstName || !reservation.lastName || !reservation.phone || !reservationDateIso || !Number.isInteger(people) || people < 1) {
    res.status(400).json({ error: "Datele rezervarii nu sunt valide." });
    return;
  }

  if (!pool) {
    memory.reservations.unshift(reservation);
  } else {
    await query(`
      INSERT INTO reservations (id, first_name, last_name, people, phone, reservation_date, area, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [reservation.id, reservation.firstName, reservation.lastName, reservation.people, reservation.phone, reservation.reservationDateIso, reservation.area, reservation.status, reservation.createdAt]);
  }
  await upsertClientFromReservation(reservation);
  res.status(201).json(reservation);
}));

app.patch("/api/reservations/:id", requireAdmin, asyncHandler(async (req, res) => {
  const allReservations = await getReservations();
  const existing = allReservations.find((reservation) => reservation.id === req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Rezervarea nu exista." });
    return;
  }

  const requestedDate = req.body.reservationDate != null ? parseReservationDate(req.body.reservationDate) : existing.reservationDateIso;
  const updated = {
    ...existing,
    firstName: req.body.firstName != null ? String(req.body.firstName).trim() : existing.firstName,
    lastName: req.body.lastName != null ? String(req.body.lastName).trim() : existing.lastName,
    phone: req.body.phone != null ? normalizePhone(req.body.phone) : existing.phone,
    people: req.body.people != null ? Number(req.body.people) : existing.people,
    reservationDate: formatRoDate(requestedDate),
    reservationDateIso: requestedDate,
    area: req.body.area || existing.area,
    status: req.body.status || existing.status,
    updatedAt: new Date().toISOString(),
  };

  if (!updated.reservationDateIso || !Number.isInteger(updated.people) || updated.people < 1) {
    res.status(400).json({ error: "Numarul de persoane nu este valid." });
    return;
  }
  const sameDayReservations = allReservations.filter((reservation) => reservation.reservationDateIso === updated.reservationDateIso);
  if (updated.status === "confirmed" && updated.people > availableSeats(sameDayReservations, updated.area, updated.id)) {
    res.status(409).json({ error: "Nu sunt suficiente locuri disponibile." });
    return;
  }

  if (!pool) {
    memory.reservations = memory.reservations.map((reservation) => reservation.id === updated.id ? updated : reservation);
  } else {
    await query(`
      UPDATE reservations
      SET first_name = $2, last_name = $3, phone = $4, people = $5, reservation_date = $6, area = $7, status = $8, updated_at = $9
      WHERE id = $1
    `, [updated.id, updated.firstName, updated.lastName, updated.phone, updated.people, updated.reservationDateIso, updated.area, updated.status, updated.updatedAt]);
  }
  res.json(updated);
}));

app.delete("/api/reservations/:id", requireAdmin, asyncHandler(async (req, res) => {
  if (!pool) {
    memory.reservations = memory.reservations.filter((reservation) => reservation.id !== req.params.id);
  } else {
    await query("DELETE FROM reservations WHERE id = $1", [req.params.id]);
  }
  res.status(204).end();
}));

app.post("/api/orders", asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const subtotal = Number(req.body.subtotal || 0);
  const deliveryFee = Number(req.body.deliveryFee || 0);
  const requestedPaymentMethod = String(req.body.paymentMethod || "cash");
  if (requestedPaymentMethod !== "cash") {
    res.status(400).json({ error: "Momentan acceptăm doar plata cash." });
    return;
  }
  const addressParts = {
    street: String(req.body.street || "").trim(),
    streetNumber: String(req.body.streetNumber || "").trim(),
    block: String(req.body.block || "").trim(),
    apartment: String(req.body.apartment || "").trim(),
  };
  const composedAddress = buildDeliveryAddress(addressParts);
  const order = {
    id: crypto.randomUUID(),
    customerName: String(req.body.customerName || "").trim(),
    phone: normalizePhone(req.body.phone),
    ...addressParts,
    address: composedAddress || String(req.body.address || "").trim(),
    city: String(req.body.city || "Craiova").trim() || "Craiova",
    notes: String(req.body.notes || "").trim(),
    paymentMethod: "cash",
    paymentStatus: "cash_on_delivery",
    status: "new",
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    createdAt: new Date().toISOString(),
  };

  if (!order.customerName || !order.phone || !order.address || items.length === 0) {
    res.status(400).json({ error: "Datele comenzii nu sunt valide." });
    return;
  }

  const unavailable = await unavailableMenuKeys();
  const blockedItem = items.find((item) => unavailable.has(normalizeMenuKey(item.key)));
  if (blockedItem) {
    res.status(409).json({ error: `${blockedItem.name || "Un produs"} este indisponibil astazi.` });
    return;
  }

  if (!pool) {
    memory.orders.unshift(order);
  } else {
    await query(`
      INSERT INTO orders (id, customer_name, phone, address, street, street_number, block, apartment, city, notes, payment_method, payment_status, status, items, subtotal, delivery_fee, total, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16, $17, $18)
    `, [order.id, order.customerName, order.phone, order.address, order.street, order.streetNumber, order.block, order.apartment, order.city, order.notes, order.paymentMethod, order.paymentStatus, order.status, JSON.stringify(order.items), order.subtotal, order.deliveryFee, order.total, order.createdAt]);
  }
  await upsertClientFromOrder(order);
  res.status(201).json(order);
}));

app.patch("/api/orders/:id", requireAdmin, asyncHandler(async (req, res) => {
  const status = String(req.body.status || "");
  if (!["new", "preparing", "delivered", "cancelled"].includes(status)) {
    res.status(400).json({ error: "Statusul comenzii nu este valid." });
    return;
  }

  if (!pool) {
    memory.orders = memory.orders.map((order) => order.id === req.params.id ? { ...order, status, updatedAt: new Date().toISOString() } : order);
  } else {
    await query("UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1", [req.params.id, status]);
  }
  res.json({ ok: true });
}));

app.delete("/api/orders/:id", requireAdmin, asyncHandler(async (req, res) => {
  if (!pool) {
    memory.orders = memory.orders.filter((order) => order.id !== req.params.id);
  } else {
    await query("DELETE FROM orders WHERE id = $1", [req.params.id]);
  }
  res.status(204).end();
}));

app.delete("/api/clients/:key", requireAdmin, asyncHandler(async (req, res) => {
  if (!pool) {
    memory.clients = memory.clients.filter((client) => client.key !== req.params.key);
  } else {
    await query("DELETE FROM clients WHERE key = $1", [req.params.key]);
  }
  res.status(204).end();
}));

app.use(express.static(__dirname));
app.get("/admin", (_req, res) => res.sendFile(path.join(__dirname, "admin", "index.html")));
app.get("/admin/", (_req, res) => res.sendFile(path.join(__dirname, "admin", "index.html")));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "A aparut o eroare pe server." });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Masa Boierului server running on port ${PORT} (${hasDatabase ? "PostgreSQL" : "memory"} storage)`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
