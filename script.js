const CAPACITY = { restaurant: 100, terrace: 70 };
const ADMIN = { username: "Adminmb", password: "masaboierului2026" };
const STORAGE_KEY = "masaBoieruluiReservations";
const CLIENTS_KEY = "masaBoieruluiClients";
const ORDERS_KEY = "masaBoieruluiOrders";
const SESSION_KEY = "masaBoieruluiAdmin";
const DELIVERY_FEES = { craiova: 0, nearby: 0, outside: 0 };
const WHATSAPP_ORDER_PHONE = "40753133321";

const menu = window.MASA_BOIERULUI_MENU || [
  { category: "Mic dejun și gustări", name: "Omletă simplă", size: "120g", description: "2 ouă, lapte, unt, sare, piper și ulei de floarea-soarelui.", price: "20 Lei" },
  { category: "Mic dejun și gustări", name: "Omletă cu brânză maturată de oaie", size: "180g", description: "2 ouă, brânză de oaie, lapte, unt, ulei de floarea-soarelui, sare și piper.", price: "25 Lei" },
  { category: "Mic dejun și gustări", name: "Omletă țărănească", size: "330g", description: "Ouă, brânză de oaie, ardei gras, ciuperci, ceapă verde și creste de slănină.", price: "32 Lei" },
  { category: "Mic dejun și gustări", name: "Salată de vinete coapte pe jar cu telemea veche de oaie și roșii", size: "450g", description: "Vinete coapte pe jar, maioneză de casă, telemea veche, roșii și ceapă verde.", price: "24 Lei" },
  { category: "Mic dejun și gustări", name: "Ou ochi", size: "50g", description: "Ou, unt, ulei, sare și piper.", price: "6 Lei" },
  { category: "Mic dejun și gustări", name: "Mămăligă cu ou, smântână grasă și brânză maturată de oaie", size: "500g", description: "Ouă, mălai, unt, brânză de oaie și smântână.", price: "37 Lei" },
  { category: "Mic dejun și gustări", name: "Dovlecei pane cu sos de usturoi", size: "350g", description: "Dovlecei, făină, ouă, pesmet panko, usturoi, ulei de măsline, sare și piper.", price: "28 Lei" },
  { category: "Mic dejun și gustări", name: "Fasole bătută cu ceapă caramelizată și bacon crocant", size: "250g", description: "Fasole albă, bacon, ceapă, ulei, usturoi, boia dulce, sare și piper.", price: "28 Lei" },
  { category: "Mic dejun și gustări", name: "Clătită crocantă cu telemea veche de oaie, mozzarella și sos de smântână", size: "", description: "Clătită, telemea veche de oaie, mozzarella, smântână grasă și iaurt grecesc.", price: "25 Lei" },
  { category: "Mic dejun și gustări", name: "Hamsii prăjite cu lămâie și mujdei", size: "250g", description: "Hamsii, făină, mujdei de usturoi, lămâie, sare și piper.", price: "20 Lei" },
  { category: "Mic dejun și gustări", name: "Crochete de brânză de burduf cu sos de usturoi", size: "185g", description: "Brânză de burduf, cartofi, ouă, făină, pesmet panko, ciuperci de pădure și smântână.", price: "20 Lei" },
  { category: "Mic dejun și gustări", name: "Crispy de pui cu salată de varză, cartofi prăjiți și sos de usturoi", size: "450g", description: "Piept de pui, pesmet panko, cartofi, varză albă, morcov, măr, nuci și maioneză.", price: "40 Lei" },
  { category: "Mic dejun și gustări", name: "Șnițel de vită gigant gratinat cu mozzarella", size: "850g", description: "Șnițel de vită cu sos de roșii și ardei copți la jar, cartofi prăjiți și salată de varză.", price: "85 Lei" },
  { category: "Mic dejun și gustări", name: "Carne la garniță cu cartofi prăjiți, telemea veche de oaie și ou ochi", size: "450g", description: "Pulpă de porc în untură, cartofi prăjiți, telemea veche de oaie și ou.", price: "47 Lei" },
  { category: "Mic dejun și gustări", name: "Papară cu brânză de burduf și carne la garniță", size: "450g", description: "Ouă, cârnați în untură, pulpă de porc în untură, brânză de burduf și slănină.", price: "40 Lei" },
  { category: "Zemuri", name: "Ciorbă de burtă", size: "450g", description: "Servită cu hrean, smântână și ardei iute.", price: "33 Lei" },
  { category: "Zemuri", name: "Ciorbă de fasole cu afumătură", size: "450g", description: "Servită cu salată de ceapă roșie cu oțet și boia.", price: "32 Lei" },
  { category: "Zemuri", name: "Ciorbă de văcuță", size: "300g", description: "Servită cu hrean și smântână.", price: "33 Lei" },
  { category: "Zemuri", name: "Ciorbă ardelenească cu afumătură", size: "450g", description: "Carne afumată, legume, smântână, usturoi, tarhon și verdețuri.", price: "33 Lei" },
  { category: "Zemuri", name: "Ciorbă de perișoare cu zeamă de varză", size: "450g", description: "Perișoare, afumătură, legume, verdețuri și zeamă de varză.", price: "32 Lei" },
  { category: "Mâncăruri gătite", name: "Obrăjori de porc copți lent cu sos de ciuperci de pădure și piure", size: "350g", description: "Obrăjori, ciuperci de pădure, smântână, vin alb, roșii cherry și piure de cartofi.", price: "52 Lei" },
  { category: "Mâncăruri gătite", name: "Tocăniță haiducească de vită fragedă cu cartofi", size: "450g", description: "Pulpă de vită, ceapă, ardei, morcovi, stock de vită, roșii, măsline și verdețuri.", price: "60 Lei" },
  { category: "Mâncăruri gătite", name: "Ciulama de pui cu ciuperci și mămăligă", size: "500g", description: "Pulpă de pui, ciuperci, smântână pentru gătit, unt, vin alb și mămăligă.", price: "47 Lei" },
  { category: "Mâncăruri gătite", name: "Cocoșel de munte la ceaun cu usturoi și mămăligă prăjită în unt", size: "550g", description: "Cocoșel de munte de Bretagne, usturoi, unt, cimbru, rozmarin și mămăligă.", price: "60 Lei" },
  { category: "Mâncăruri gătite", name: "Ficăței de pui în sos roze cu bacon crocant și piure de cartofi", size: "550g", description: "Ficăței de pui, bacon afumat, unt, usturoi, smântână, pastă de tomate și piure.", price: "35 Lei" },
  { category: "Mâncăruri gătite", name: "Varză călită cu afumătură și mămăligă", size: "500g", description: "Varză dulce și murată, afumătură, slănină, ceapă, cimbru și mămăligă.", price: "38 Lei" },
  { category: "Mâncăruri gătite", name: "Pljeskavica sârbească cu urnebes, lipie și cartofi prăjiți", size: "650g", description: "Carne de vită și porc, brânză maturată, ardei copți, salată, lipie și cartofi.", price: "55 Lei" },
  { category: "Mâncăruri gătite", name: "Crispy de pui cu salată Coleslaw, cartofi prăjiți și sos de usturoi", size: "300g", description: "Piept de pui, făină, ouă, pesmet panko, cartofi, varză și maioneză.", price: "35 Lei" },
  { category: "Mâncăruri gătite", name: "Șnițel de vită gigant gratinat cu cașcaval afumat", size: "550g", description: "Șnițel cu sos de roșii și ardei copți la jar, cartofi prăjiți și salată de varză.", price: "70 Lei" },
  { category: "Preparate la jar", name: "Pljeskavica sârbească cu urnebes, lipie și cartofi prăjiți", size: "650g", description: "Carne de vită și porc, brânză maturată, ardei copți, salată verde, lipie și cartofi.", price: "55 Lei" },
  { category: "Preparate la jar", name: "Pastramă de berbecuț cu mămăligă și mujdei", size: "550g", description: "Pastramă de berbecuț, usturoi, cimbru, boia, mălai, unt și pătrunjel.", price: "65 Lei" },
  { category: "Preparate la jar", name: "Antricot de vită la grătar cu cartofi prăjiți și sos Chimichurri", size: "450g", description: "Antricot de vită la grătar, cartofi prăjiți și sos Chimichurri.", price: "98 Lei" },
  { category: "Preparate la jar", name: "Coaste BBQ cu cartofi prăjiți, porumb copt și salată de varză", size: "850g", description: "Coaste de porc, sos BBQ, cartofi prăjiți, porumb copt și salată cu maioneză.", price: "70 Lei" },
  { category: "Preparate la jar", name: "Cotlete de berbecuț cu cartofi prăjiți, mujdei și salată de varză", size: "550g", description: "Cotlete de berbecuț, cartofi prăjiți, mujdei de usturoi și salată de varză.", price: "98 Lei" },
  { category: "Preparate la jar", name: "Frigărui de berbecuț cu cartofi prăjiți și salată de varză", size: "550g", description: "Carne de berbecuț, cartofi prăjiți și salată de varză cu maioneză și usturoi.", price: "75 Lei" },
  { category: "Preparate la jar", name: "Piept de pui la grătar cu cartofi prăjiți, sos de usturoi și salată", size: "650g", description: "Piept de pui, cartofi prăjiți, sos de usturoi și salată de varză cu maioneză.", price: "40 Lei" },
  { category: "Preparate la jar", name: "Pulpă de pui dezosată la grătar cu cartofi prăjiți, sos de usturoi și salată", size: "650g", description: "Pulpă de pui dezosată, cartofi prăjiți, sos de usturoi și salată.", price: "40 Lei" },
  { category: "Preparate la jar", name: "Ceafă de porc la grătar cu cartofi prăjiți, sos de usturoi și salată", size: "550g", description: "Ceafă de porc, cartofi, usturoi, maioneză, mix de salate, ulei, sare și piper.", price: "45 Lei" },
  { category: "Preparate la jar", name: "Mititei cu cartofi prăjiți și muștar", size: "", description: "Mititei din carne de vită și porc, cartofi prăjiți și muștar.", price: "48 Lei" },
  { category: "Preparate la jar", name: "Cârnați tradiționali cu cartofi prăjiți și salată de varză murată cu boia", size: "650g", description: "Cârnați tradiționali, cartofi prăjiți, muștar, varză murată, boia și ceapă.", price: "42 Lei" },
  { category: "Platouri boierești la jar", name: "Platou 2 boieri grăbiți", size: "2 persoane / 1100g", description: "Pljeskavica, crispy strips, crochete de brânză, coaste BBQ, cartofi, Coleslaw, sosuri și murături.", price: "160 Lei" },
  { category: "Platouri boierești la jar", name: "Mix Grill Boieresc la jar", size: "4 persoane / 2300g", description: "Mititei, ceafă, pulpă de pui, cârnați, coaste BBQ, cartofi, porumb, Coleslaw și murături.", price: "240 Lei" },
  { category: "Platouri boierești la jar", name: "Festin la jar", size: "4 persoane / 2800g", description: "Antricot de vită, pastramă, ceafă, pulpă de pui, cârnați, cartofi, Coleslaw și murături.", price: "360 Lei" },
  { category: "Platouri boierești la jar", name: "Mare ospăț la jar", size: "6 persoane / 4800g", description: "Grătar bogat cu antricot, pastramă, pljeskavica, coaste, ceafă, pui, cârnați, mititei și garnituri.", price: "470 Lei" },
  { category: "Platouri boierești la jar", name: "Masa Domnească a Boierului", size: "6 persoane / 6500g", description: "Platou mare cu antricot, pastramă, pljeskavica, coaste, ceafă, pui, cârnați, mititei, crochete, jumări și garnituri.", price: "590 Lei" },
  { category: "Platouri boierești la jar", name: "Platoul Boierului Pofticios", size: "1 persoană / 1100g", description: "Cotlete de berbecuț, ceafă, mititei, pulpă de pui, cârnați, cartofi, salată și sosuri.", price: "125 Lei" },
  { category: "Garnituri și salate", name: "Cartofi prăjiți", size: "200g", description: "Cartofi, ulei și sare.", price: "20 Lei" },
  { category: "Garnituri și salate", name: "Mămăligă", size: "200g", description: "Mălai, apă și sare.", price: "13 Lei" },
  { category: "Garnituri și salate", name: "Legume la grătar", size: "250g", description: "Ardei gras, vinete, dovlecei, roșii, ciuperci, ceapă, ulei de măsline, sare și piper.", price: "20 Lei" },
  { category: "Garnituri și salate", name: "Salată de castraveți cu mărar", size: "200g", description: "Castraveți, mărar, ulei, oțet și sare.", price: "18 Lei" },
  { category: "Garnituri și salate", name: "Salată verde cu lămâie", size: "200g", description: "Salată verde, lămâie, ulei de măsline și sare.", price: "20 Lei" },
  { category: "Garnituri și salate", name: "Salată de varză cu maioneză și usturoi", size: "200g", description: "Varză albă, morcov, maioneză, usturoi, muștar Dijon, lămâie și pătrunjel.", price: "20 Lei" },
  { category: "Garnituri și salate", name: "Salată de varză cu morcov și mărar", size: "250g", description: "Varză albă, morcov, mărar, ulei, oțet și sare.", price: "18 Lei" },
  { category: "Garnituri și salate", name: "Salată de sfeclă roșie cu hrean", size: "200g", description: "Sfeclă roșie, hrean, ulei, oțet și sare.", price: "18 Lei" },
  { category: "Garnituri și salate", name: "Salată de murături", size: "200g", description: "Castraveți murați, ardei murați și conopidă.", price: "20 Lei" },
  { category: "Garnituri și salate", name: "Salată de vară", size: "200g", description: "Castraveți, roșii, ceapă, telemea, ulei, sare și piper.", price: "22 Lei" },
  { category: "Sosuri", name: "Mujdei de usturoi", size: "50g", description: "Usturoi, ulei, apă minerală, sare, piper și pătrunjel.", price: "6 Lei" },
  { category: "Sosuri", name: "Sos de hrean", size: "50g", description: "Hrean, smântână și sare.", price: "6 Lei" },
  { category: "Sosuri", name: "Smântână", size: "50g", description: "Smântână.", price: "9 Lei" },
  { category: "Sosuri", name: "Sos coaste", size: "50g", description: "Maioneză, ketchup, castraveți murați, muștar, ceapă, usturoi, miere și boia afumată.", price: "8 Lei" },
  { category: "Sosuri", name: "Sos Chimichurri", size: "50g", description: "Pătrunjel, usturoi, oregano, chilli, oțet de vin, ulei, sare și piper.", price: "8 Lei" },
  { category: "Sosuri", name: "Sos de roșii și ardei copți la jar", size: "50g", description: "Roșii coapte, ardei kapia, usturoi copt, ceapă coaptă, ulei de măsline și oțet balsamic.", price: "8 Lei" },
  { category: "Desert", name: "Clătite cu sos de vin, miere și nuci", size: "250g", description: "Clătite, vin roșu, miere, nuci, unt, zahăr brun și scorțișoară.", price: "28 Lei" },
  { category: "Desert", name: "Papanași cu smântână și dulceață de afine", size: "300g", description: "Brânză de vaci, făină, ouă, zahăr, smântână, dulceață de afine și zahăr vanilat.", price: "30 Lei" },
  { category: "Desert", name: "Orez cu lapte, caramel și nuci caramelizate", size: "250g", description: "Lapte, orez, zahăr, smântână pentru frișcă, unt, caramel sărat, nuci și vanilie.", price: "23 Lei" },
  { category: "Desert", name: "Clătite cu ciocolată, afine sau fructe de pădure", size: "250g", description: "Clătite cu topping la alegere.", price: "23 Lei" },
  { category: "Băuturi", name: "Espresso", size: "", description: "Cafea.", price: "9 Lei" },
  { category: "Băuturi", name: "Cappuccino", size: "", description: "Cafea cu lapte.", price: "18 Lei" },
  { category: "Băuturi", name: "Caffè Latte", size: "", description: "Cafea cu lapte.", price: "18 Lei" },
  { category: "Băuturi", name: "Frappe", size: "", description: "Cafea rece.", price: "18 Lei" },
  { category: "Băuturi", name: "Răcoritoare Coca-Cola, Fanta, Sprite", size: "250ml", description: "Coca-Cola, Coca-Cola Zero, Fanta sau Sprite.", price: "11 Lei" },
  { category: "Băuturi", name: "Schweppes", size: "250ml", description: "Mandarin, Tonic, Pink sau Bitter Lemon.", price: "15 Lei" },
  { category: "Băuturi", name: "Cappy", size: "250ml", description: "Piersică, portocale, portocale roșii sau pere.", price: "15 Lei" },
  { category: "Băuturi", name: "Fuze Tea", size: "250ml", description: "Piersică sau lămâie.", price: "15 Lei" },
  { category: "Băuturi", name: "Limonadă", size: "300ml", description: "Limonadă proaspătă.", price: "19 Lei" },
  { category: "Băuturi", name: "Fresh", size: "250ml", description: "Portocale sau grapefruit.", price: "25 Lei" },
  { category: "Băuturi", name: "Apă plată / minerală", size: "0,75l", description: "Apă la sticlă mare.", price: "17 Lei" },
  { category: "Băuturi", name: "Apă plată / minerală", size: "0,33l", description: "Apă la sticlă mică.", price: "10 Lei" },
  { category: "Bere și cidru", name: "Strongbow", size: "0,33l", description: "Gold Apple, Pear, Red Berries sau Dark Fruit.", price: "14 Lei" },
  { category: "Bere și cidru", name: "Heineken draught", size: "0,25l / 0,40l", description: "Bere draught.", price: "9 / 15 Lei" },
  { category: "Bere și cidru", name: "Birra Moretti draught", size: "0,40l", description: "Bere draught.", price: "15 Lei" },
  { category: "Bere și cidru", name: "Silva Strong Dark Lager", size: "0,50l", description: "Bere dark lager.", price: "18 Lei" },
  { category: "Bere și cidru", name: "Desperados", size: "0,40l", description: "Bere cu gust de tequila.", price: "22 Lei" },
  { category: "Bere și cidru", name: "Edelweiss Hefe Weissbier", size: "0,50l", description: "Bere weissbier.", price: "25 Lei" },
  { category: "Bere și cidru", name: "Bere la sticlă", size: "0,33l - 0,50l", description: "Heineken, Birra Moretti, Ciuc Premium Lager sau Amstel.", price: "13 - 17 Lei" },
  { category: "Bere și cidru", name: "Bere 0.0% fără alcool", size: "0,33l - 0,50l", description: "Heineken 0.0%, Birra Moretti 0.0%, Ciuc Radler lămâie și lime sau zmeură și lămâie.", price: "14 - 17 Lei" },
  { category: "Vinuri și spirtoase", name: "Vin Recaș", size: "187ml / 500ml / 1l", description: "Alb, roșu sau rose, sec/demisec, pahar, carafă mică sau carafă mare.", price: "18 - 39 Lei" },
  { category: "Vinuri și spirtoase", name: "Courvoisier VSOP", size: "50ml", description: "Cognac.", price: "25 Lei" },
  { category: "Vinuri și spirtoase", name: "Vechea Romagna", size: "50ml", description: "Cognac.", price: "35 Lei" },
  { category: "Vinuri și spirtoase", name: "Zacapa", size: "50ml", description: "Rom.", price: "30 Lei" },
  { category: "Vinuri și spirtoase", name: "Captain Morgan", size: "50ml", description: "Rom.", price: "20 Lei" },
  { category: "Vinuri și spirtoase", name: "Jack Daniels", size: "50ml", description: "Whiskey.", price: "20 Lei" },
  { category: "Vinuri și spirtoase", name: "Chivas 12 ani", size: "50ml", description: "Whiskey.", price: "32 Lei" },
  { category: "Vinuri și spirtoase", name: "Finlandia", size: "50ml", description: "Vodcă.", price: "15 Lei" },
  { category: "Vinuri și spirtoase", name: "Jägermeister", size: "50ml", description: "Digestiv.", price: "20 Lei" },
];

const menuTabs = document.querySelector("#menuTabs");
const menuGrid = document.querySelector("#menuGrid");
const cartOpenBtn = document.querySelector("#cartOpenBtn");
const cartCloseBtn = document.querySelector("#cartCloseBtn");
const cartModal = document.querySelector("#cartModal");
const cartFabCount = document.querySelector("#cartFabCount");
const cartItems = document.querySelector("#cartItems");
const checkoutForm = document.querySelector("#checkoutForm");
const checkoutOpenBtn = document.querySelector("#checkoutOpenBtn");
const continueOrderBtn = document.querySelector("#continueOrderBtn");
const deliveryCity = document.querySelector("#deliveryCity");
const orderMessage = document.querySelector("#orderMessage");
const orderConfirmModal = document.querySelector("#orderConfirmModal");
const orderConfirmCloseBtn = document.querySelector("#orderConfirmCloseBtn");
const orderConfirmDoneBtn = document.querySelector("#orderConfirmDoneBtn");
const orderConfirmWhatsAppBtn = document.querySelector("#orderConfirmWhatsAppBtn");
const orderConfirmText = document.querySelector("#orderConfirmText");
const reservationForm = document.querySelector("#reservationForm");
const reservationMessage = document.querySelector("#reservationMessage");
const dailyMenuImage = document.querySelector("#dailyMenuImage");
const dailyMenuDay = document.querySelector("#dailyMenuDay");
const dailyMenuCaption = document.querySelector("#dailyMenuCaption");
const dailyMenuActions = document.querySelector("#dailyMenuActions");
const dailyMenuClosed = document.querySelector("#dailyMenuClosed");
const adminLogin = document.querySelector("#adminLogin");
const adminPanel = document.querySelector("#adminPanel");
const adminMessage = document.querySelector("#adminMessage");
const reservationsList = document.querySelector("#reservationsList");
const logoutBtn = document.querySelector("#logoutBtn");

let cart = [];
let activeMenuCategory = "Toate";
let unavailableMenuKeys = new Set();
let pendingWhatsAppUrl = "";

const DAILY_MENU_BY_DAY = {
  1: { day: "Luni", src: "assets/meniu-zilei-luni.jpg" },
  2: { day: "Marți", src: "assets/meniu-zilei-marti.jpg" },
};

const DAILY_MENU_OPTIONS = {
  first: { label: "Felul 1", price: "18 Lei" },
  second: { label: "Felul 2", price: "22 Lei" },
  complete: { label: "Meniu complet", price: "33 Lei" },
};

let activeDailyMenu = null;

function renderDailyMenu() {
  if (!dailyMenuImage) return;
  const today = new Date().getDay();
  const isWeekday = today >= 1 && today <= 5;
  const menuForToday = DAILY_MENU_BY_DAY[today];
  const selectedMenu = menuForToday || DAILY_MENU_BY_DAY[2] || DAILY_MENU_BY_DAY[1];
  activeDailyMenu = isWeekday ? { ...selectedMenu, hasPhoto: Boolean(menuForToday) } : null;

  dailyMenuImage.src = selectedMenu.src;
  dailyMenuImage.alt = `Meniul zilei - ${selectedMenu.day}`;
  dailyMenuImage.closest(".daily-menu-media")?.style.setProperty("--daily-menu-image", `url("${selectedMenu.src}")`);
  dailyMenuActions?.classList.toggle("hidden", !isWeekday);
  dailyMenuClosed?.classList.toggle("hidden", isWeekday);
  if (dailyMenuDay) dailyMenuDay.textContent = isWeekday
    ? (menuForToday ? `Astăzi, ${selectedMenu.day}` : "Meniul zilei")
    : "Weekend";
  if (dailyMenuCaption) dailyMenuCaption.textContent = isWeekday
    ? (menuForToday ? `Meniul zilei pentru ${selectedMenu.day}` : `Poza pentru această zi va fi adăugată în curând. Momentan este afișat meniul de ${selectedMenu.day}.`)
    : "Meniul zilei revine Luni, în intervalul 11:00-16:00.";
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

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

function readOrders() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
}

function writeOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\s+/g, "");
}

function priceNumber(price) {
  const match = String(price || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function money(value) {
  return `${Number(value || 0)} Lei`;
}

function cityLabel(value) {
  if (value === "nearby") return "Localitate limitrofă";
  if (value === "outside") return "În afara zonei standard";
  return "Craiova";
}

function paymentMethodLabel(value) {
  return "Cash la livrare";
}

function menuItemKey(item) {
  const index = menu.indexOf(item);
  return item.id || `menu-${index}`;
}

function buildWhatsAppOrderUrl(order, savedOrder = {}, orderItems = order.items || []) {
  const items = orderItems
    .map((item) => `- ${item.quantity} x ${item.name} - ${item.priceLabel}`)
    .join("\n");
  const message = [
    "COMANDA MASA BOIERULUI",
    savedOrder.id ? `ID comandă: ${savedOrder.id}` : "",
    "",
    "PRODUSE:",
    items || "Produse lipsă",
    "",
    `Client: ${order.customerName}`,
    `Telefon: ${order.phone}`,
    `Adresă livrare: ${order.address}`,
    `Localitate: ${cityLabel(order.city)}`,
    `Plată: ${paymentMethodLabel(order.paymentMethod)}`,
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Taxă livrare: ${money(order.deliveryFee)}`,
    `Total: ${money(Number(order.subtotal) + Number(order.deliveryFee))}`,
    ...(order.notes ? ["", `Observații: ${order.notes}`] : []),
  ].join("\n");

  return `https://wa.me/${WHATSAPP_ORDER_PHONE}?text=${encodeURIComponent(message)}`;
}

function todayRoDate() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;
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

function upsertClientFromReservation(reservation) {
  const phone = normalizePhone(reservation.phone);
  const fullName = `${reservation.lastName} ${reservation.firstName}`.trim();
  const key = phone || fullName.toLowerCase();
  const clients = readClients();
  const existing = clients.find((client) => client.key === key);
  const next = {
    key,
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    fullName,
    phone,
    lastReservationAt: reservation.createdAt,
    reservationCount: (existing?.reservationCount || 0) + 1,
    totalPeople: (existing?.totalPeople || 0) + Number(reservation.people || 0),
  };

  writeClients(existing ? clients.map((client) => client.key === key ? { ...client, ...next } : client) : [next, ...clients]);
}

function confirmedSeats(area) {
  return readReservations()
    .filter((reservation) => reservation.status === "confirmed" && reservation.area === area)
    .reduce((sum, reservation) => sum + Number(reservation.people), 0);
}

function availableSeats(area) {
  return CAPACITY[area] - confirmedSeats(area);
}

function renderSeats() {
  setText("#adminRestaurantSeats", availableSeats("restaurant"));
  setText("#adminTerraceSeats", availableSeats("terrace"));
}

function renderMenu(category = "Toate") {
  if (!menuGrid) return;
  activeMenuCategory = category;
  const items = category === "Toate" ? menu : menu.filter((item) => item.category === category);
  menuGrid.innerHTML = items.map((item, index) => {
    const itemKey = menuItemKey(item);
    const unavailable = unavailableMenuKeys.has(itemKey);
    return `
    <article class="dish ${unavailable ? "unavailable" : ""}">
      <div>
        <small>${item.category}${item.size ? ` • ${item.size}` : ""}</small>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        ${unavailable ? `<span class="unavailable-label">Indisponibil astăzi</span>` : ""}
      </div>
      <div class="dish-order">
        <b>${item.price}</b>
        <button class="btn small" type="button" data-add-menu="${index}" ${unavailable ? "disabled" : ""}>${unavailable ? "Indisponibil" : "Adaugă"}</button>
      </div>
    </article>
  `;
  }).join("");

  menuGrid.querySelectorAll("[data-add-menu]").forEach((button) => {
    button.addEventListener("click", () => addToCart(items[Number(button.dataset.addMenu)]));
  });
}

function renderMenuTabs() {
  if (!menuTabs) return;
  const categories = ["Toate", ...new Set(menu.map((item) => item.category))];
  menuTabs.innerHTML = categories.map((category, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-category="${category}">${category}</button>`).join("");
  menuTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      menuTabs.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderMenu(button.dataset.category);
    });
  });
}

function addToCart(item) {
  const key = menuItemKey(item);
  if (unavailableMenuKeys.has(key)) {
    alert("Produsul este indisponibil astăzi.");
    return;
  }
  const existing = cart.find((cartItem) => cartItem.key === key);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      key,
      name: item.name,
      category: item.category,
      priceLabel: item.price,
      unitPrice: priceNumber(item.price),
      quantity: 1,
    });
  }
  renderCart();
  cartOpenBtn?.classList.add("has-items");
  window.setTimeout(() => cartOpenBtn?.classList.remove("has-items"), 450);
}

function addDailyMenuToCart(optionKey) {
  if (!activeDailyMenu) {
    alert("Meniul zilei este disponibil doar de Luni până Vineri.");
    return;
  }
  const option = DAILY_MENU_OPTIONS[optionKey];
  if (!option) return;
  addToCart({
    id: `daily-menu-${optionKey}`,
    category: "Meniul zilei",
    name: `${option.label} - ${activeDailyMenu.day}`,
    size: "11:00-16:00",
    description: "Meniul zilei Masa Boierului",
    price: option.price,
  });
}

async function loadMenuAvailability() {
  if (!menuGrid) return;
  try {
    const data = await apiRequest("/api/menu/availability");
    unavailableMenuKeys = new Set(data.unavailableKeys || []);
    cart = cart.filter((item) => !unavailableMenuKeys.has(item.key));
    renderMenu(activeMenuCategory);
    renderCart();
  } catch (_error) {
    unavailableMenuKeys = new Set();
  }
}

function cartSubtotal() {
  return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function selectedDeliveryFee() {
  return DELIVERY_FEES[deliveryCity?.value || "craiova"] || DELIVERY_FEES.craiova;
}

function renderCart() {
  if (!cartItems) return;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartFabCount) cartFabCount.textContent = itemCount;
  checkoutOpenBtn?.toggleAttribute("disabled", cart.length === 0);

  if (cart.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Coșul este gol.</p>`;
    checkoutForm?.classList.add("checkout-hidden");
  } else {
    cartItems.innerHTML = cart.map((item) => `
      <div class="cart-row" data-cart-key="${item.key}">
        <div>
          <strong>${item.name}</strong>
          <small>${item.quantity} x ${item.priceLabel}</small>
        </div>
        <div class="cart-controls">
          <button type="button" data-cart-minus>-</button>
          <span>${item.quantity}</span>
          <button type="button" data-cart-plus>+</button>
        </div>
      </div>
    `).join("");
  }

  cartItems.querySelectorAll("[data-cart-minus]").forEach((button) => {
    button.addEventListener("click", () => updateCartQuantity(button.closest(".cart-row").dataset.cartKey, -1));
  });
  cartItems.querySelectorAll("[data-cart-plus]").forEach((button) => {
    button.addEventListener("click", () => updateCartQuantity(button.closest(".cart-row").dataset.cartKey, 1));
  });

  const subtotal = cartSubtotal();
  const deliveryFee = selectedDeliveryFee();
  setText("#cartSubtotal", money(subtotal));
  setText("#deliveryFee", money(deliveryFee));
  setText("#cartTotal", money(cart.length ? subtotal + deliveryFee : 0));
}

function openCart(showCheckout = false) {
  if (!cartModal) return;
  cartModal.classList.remove("hidden");
  cartModal.classList.add("open");
  cartModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  if (showCheckout && cart.length > 0) checkoutForm?.classList.remove("checkout-hidden");
}

function closeCart() {
  if (!cartModal) return;
  cartModal.classList.add("hidden");
  cartModal.classList.remove("open");
  cartModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function openOrderConfirm(text, whatsappUrl = "") {
  if (!orderConfirmModal) return;
  pendingWhatsAppUrl = whatsappUrl;
  if (orderConfirmText) orderConfirmText.textContent = text;
  orderConfirmModal.classList.remove("hidden");
  orderConfirmModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeOrderConfirm() {
  if (!orderConfirmModal) return;
  orderConfirmModal.classList.add("hidden");
  orderConfirmModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function continueToWhatsApp() {
  if (!pendingWhatsAppUrl) return;
  window.location.href = pendingWhatsAppUrl;
}

function updateCartQuantity(key, delta) {
  cart = cart.map((item) => item.key === key ? { ...item, quantity: item.quantity + delta } : item)
    .filter((item) => item.quantity > 0);
  renderCart();
}

async function submitOrder(event) {
  event.preventDefault();
  if (!checkoutForm) return;
  if (cart.length === 0) {
    showMessage(orderMessage, "Adaugă cel puțin un preparat în coș.", "error");
    return;
  }

  const form = new FormData(checkoutForm);
  const unavailableCartItem = cart.find((item) => unavailableMenuKeys.has(item.key));
  if (unavailableCartItem) {
    showMessage(orderMessage, `${unavailableCartItem.name} este indisponibil astăzi.`, "error");
    return;
  }
  const payment = "cash";
  const deliveryFee = selectedDeliveryFee();
  const subtotal = cartSubtotal();
  const orderItems = cart.map((item) => ({ ...item }));
  const order = {
    customerName: String(form.get("customerName")).trim(),
    phone: normalizePhone(form.get("phone")),
    address: String(form.get("address")).trim(),
    city: String(form.get("city")),
    notes: String(form.get("notes") || "").trim(),
    paymentMethod: payment,
    items: orderItems,
    subtotal,
    deliveryFee,
  };

  try {
    const savedOrder = await apiRequest("/api/orders", { method: "POST", body: JSON.stringify(order) });
    const whatsappUrl = buildWhatsAppOrderUrl(order, savedOrder, orderItems);
    cart = [];
    checkoutForm.reset();
    checkoutForm.classList.add("checkout-hidden");
    renderCart();
    const paymentText = "Comanda a fost salvată. Continuă către WhatsApp și apasă Trimite.";
    showMessage(orderMessage, "", "ok");
    closeCart();
    openOrderConfirm(paymentText, whatsappUrl);
  } catch (error) {
    showMessage(orderMessage, error.message, "error");
  }
}

function showMessage(element, text, type = "ok") {
  if (!element) return;
  element.textContent = text;
  element.className = `form-note ${type}`;
}

async function submitReservation(event) {
  event.preventDefault();
  if (!reservationForm) return;
  const form = new FormData(reservationForm);
  const people = Number(form.get("people"));
  const phone = String(form.get("phone")).trim();

  if (!Number.isInteger(people) || people < 1) {
    showMessage(reservationMessage, "Te rugăm să introduci un număr valid de persoane.", "error");
    return;
  }

  const reservation = {
    firstName: String(form.get("firstName")).trim(),
    lastName: String(form.get("lastName")).trim(),
    people,
    reservationDate: String(form.get("reservationDate")).trim(),
    phone,
  };

  try {
    await apiRequest("/api/reservations", { method: "POST", body: JSON.stringify(reservation) });
    reservationForm.reset();
    const dateInput = reservationForm.querySelector("[name='reservationDate']");
    if (dateInput) dateInput.value = todayRoDate();
    showMessage(reservationMessage, "Rezervarea a fost trimisă. Te vom suna pentru confirmare.", "ok");
  } catch (error) {
    showMessage(reservationMessage, error.message, "error");
  }
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

function renderAdmin() {
  if (!adminLogin || !adminPanel || !logoutBtn || !reservationsList) return;
  renderSeats();
  const reservations = readReservations();
  setText("#pendingCount", reservations.filter((item) => item.status === "pending").length);

  if (!isAdminLoggedIn()) {
    adminLogin.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    return;
  }

  adminLogin.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  if (reservations.length === 0) {
    reservationsList.innerHTML = `<div class="reservation-card"><p>Nu există rezervări încă.</p></div>`;
    return;
  }

  reservationsList.innerHTML = reservations.map((reservation) => {
    const date = new Date(reservation.createdAt).toLocaleString("ro-RO");
    const statusLabel = reservation.status === "pending" ? "În așteptare" : reservation.status === "confirmed" ? "Confirmată" : "Anulată";
    const canEdit = reservation.status === "pending";
    return `
      <article class="reservation-card" data-id="${reservation.id}">
        <div>
          <span class="status ${reservation.status}">${statusLabel}</span>
          <h3>${reservation.lastName} ${reservation.firstName}</h3>
          <p><strong>${reservation.people}</strong> persoane • <a href="tel:${reservation.phone}">${reservation.phone}</a></p>
          <p>Primită: ${date}</p>
          <p>Zonă: ${reservation.area === "terrace" ? "Terasă" : "Restaurant"}</p>
        </div>
        <div class="admin-actions">
          <select ${canEdit ? "" : "disabled"} data-action="area">
            <option value="restaurant" ${reservation.area === "restaurant" ? "selected" : ""}>Restaurant</option>
            <option value="terrace" ${reservation.area === "terrace" ? "selected" : ""}>Terasă</option>
          </select>
          <button class="btn" type="button" data-action="confirm" ${canEdit ? "" : "disabled"}>Confirmă</button>
          <button class="btn danger" type="button" data-action="cancel" ${canEdit ? "" : "disabled"}>Anulează</button>
          <button class="btn ghost" type="button" data-action="delete">Șterge</button>
        </div>
      </article>
    `;
  }).join("");

  reservationsList.querySelectorAll("[data-action='area']").forEach((select) => {
    select.addEventListener("change", () => {
      const id = select.closest(".reservation-card").dataset.id;
      const reservations = readReservations().map((reservation) => reservation.id === id ? { ...reservation, area: select.value } : reservation);
      writeReservations(reservations);
      renderAdmin();
    });
  });

  reservationsList.querySelectorAll("[data-action='confirm']").forEach((button) => {
    button.addEventListener("click", () => updateReservationStatus(button.closest(".reservation-card").dataset.id, "confirmed"));
  });

  reservationsList.querySelectorAll("[data-action='cancel']").forEach((button) => {
    button.addEventListener("click", () => updateReservationStatus(button.closest(".reservation-card").dataset.id, "cancelled"));
  });

  reservationsList.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => deleteReservation(button.closest(".reservation-card").dataset.id));
  });
}

function updateReservationStatus(id, status) {
  const reservations = readReservations();
  const target = reservations.find((reservation) => reservation.id === id);

  if (!target) return;

  if (status === "confirmed" && target.people > availableSeats(target.area)) {
    alert(`Nu sunt suficiente locuri disponibile în ${target.area === "terrace" ? "terasă" : "restaurant"}.`);
    return;
  }

  writeReservations(reservations.map((reservation) => reservation.id === id ? { ...reservation, status } : reservation));
  renderAdmin();
}

function deleteReservation(id) {
  writeReservations(readReservations().filter((reservation) => reservation.id !== id));
  renderAdmin();
}

function loginAdmin(event) {
  event.preventDefault();
  if (!adminLogin) return;
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

function updateActiveNav() {
  if (window.location.hash === "#comenzi") {
    history.replaceState(null, "", "#meniu");
  }
  const hash = window.location.hash || "#acasa";
  document.querySelectorAll(".nav nav a[href^='#']").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === hash);
  });
}

renderDailyMenu();
renderMenuTabs();
renderMenu();
loadMenuAvailability();
renderCart();
renderSeats();
renderAdmin();
updateActiveNav();
if (reservationForm?.querySelector("[name='reservationDate']")) {
  reservationForm.querySelector("[name='reservationDate']").value = todayRoDate();
}
window.addEventListener("hashchange", updateActiveNav);
if (menuGrid) window.setInterval(loadMenuAvailability, 30000);
deliveryCity?.addEventListener("change", renderCart);
cartOpenBtn?.addEventListener("click", () => openCart(false));
cartCloseBtn?.addEventListener("click", closeCart);
continueOrderBtn?.addEventListener("click", closeCart);
checkoutOpenBtn?.addEventListener("click", () => openCart(true));
cartModal?.querySelectorAll("[data-cart-close]").forEach((element) => {
  element.addEventListener("click", closeCart);
});
orderConfirmCloseBtn?.addEventListener("click", closeOrderConfirm);
orderConfirmDoneBtn?.addEventListener("click", closeOrderConfirm);
orderConfirmWhatsAppBtn?.addEventListener("click", continueToWhatsApp);
orderConfirmModal?.querySelectorAll("[data-confirm-close]").forEach((element) => {
  element.addEventListener("click", closeOrderConfirm);
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    closeOrderConfirm();
  }
});
checkoutForm?.addEventListener("submit", submitOrder);
dailyMenuActions?.querySelectorAll("[data-daily-menu]").forEach((button) => {
  button.addEventListener("click", () => addDailyMenuToCart(button.dataset.dailyMenu));
});
reservationForm?.addEventListener("submit", submitReservation);
adminLogin?.addEventListener("submit", loginAdmin);
logoutBtn?.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  renderAdmin();
});
