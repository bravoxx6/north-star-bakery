/* =========================================================
   North Star Bakery - script.js
   Loaded on every page with "defer".

   1. Pre-order list (products.html): customers add items,
      change quantities, and remove items. The list is saved
      in localStorage so it survives refreshes and page changes.
   2. Navigation counter (all pages): shows how many items
      are in the list next to "Contact & Pre-Order".
   3. Form (contact.html): pre-fills "Item details" from the
      saved list and validates every field with clear messages
      shown right below the field.
   ========================================================= */

/* ---------- Data ---------- */

// localStorage key for the saved pre-order list
const STORAGE_KEY = "northStarPreOrderList";

// Array of product objects: everything a customer can add to the list
const PRODUCTS = [
  { id: "country-sourdough", name: "Country Sourdough", category: "Breads", unit: "loaf" },
  { id: "seeded-multigrain", name: "Seeded Multigrain", category: "Breads", unit: "loaf" },
  { id: "signature-loaf", name: "Rye and Signature Loaf", category: "Breads", unit: "loaf" },
  { id: "croissants", name: "Croissants", category: "Pastries", unit: "piece" },
  { id: "scones-muffins", name: "Scones and Muffins", category: "Pastries", unit: "piece" },
  { id: "cookies", name: "Cookies", category: "Pastries", unit: "piece" },
  { id: "everyday-cake", name: "Everyday Cake", category: "Cakes", unit: "cake" },
  { id: "celebration-cake", name: "Celebration or Event Cake", category: "Cakes", unit: "cake" }
];

const MAX_QUANTITY = 24;

// The customer's list: an array of { id, qty } objects.
// Loaded from localStorage when any page opens.
let orderList = loadOrderList();

/* ---------- Storage helpers ---------- */

function loadOrderList() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) {
      return [];
    }
    // Keep only items that still exist in PRODUCTS and have a valid quantity
    return saved.filter(function (item) {
      return findProduct(item.id) && Number.isInteger(item.qty) && item.qty > 0;
    });
  } catch (error) {
    // Storage blocked or data damaged: start with an empty list
    return [];
  }
}

function saveOrderList() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderList));
  } catch (error) {
    // Storage unavailable (for example, private browsing): the list still works on this page
  }
}

/* ---------- Pre-order list logic ---------- */

function findProduct(id) {
  return PRODUCTS.find(function (product) {
    return product.id === id;
  });
}

function findListItem(id) {
  return orderList.find(function (item) {
    return item.id === id;
  });
}

function getTotalItems() {
  return orderList.reduce(function (total, item) {
    return total + item.qty;
  }, 0);
}

function addToList(id) {
  const existing = findListItem(id);
  if (existing) {
    existing.qty = Math.min(existing.qty + 1, MAX_QUANTITY);
  } else {
    orderList.push({ id: id, qty: 1 });
  }
  updateAfterChange(findProduct(id).name + " added to your pre-order list.");
}

function changeQuantity(id, amount) {
  const item = findListItem(id);
  if (!item) {
    return;
  }
  item.qty += amount;
  if (item.qty <= 0) {
    removeFromList(id);
    return;
  }
  item.qty = Math.min(item.qty, MAX_QUANTITY);
  updateAfterChange(findProduct(id).name + " quantity is now " + item.qty + ".");
}

function removeFromList(id) {
  orderList = orderList.filter(function (item) {
    return item.id !== id;
  });
  updateAfterChange(findProduct(id).name + " removed from your list.");
}

function clearList() {
  orderList = [];
  updateAfterChange("Your pre-order list is now empty.");
}

// Save, then redraw everything that depends on the list
function updateAfterChange(message) {
  saveOrderList();
  renderOrderList();
  updateAddButtons();
  updateNavCount();
  announce(message);
}

// Turns the list into text, e.g. "2 x Country Sourdough (Breads)"
function formatListAsText() {
  return orderList.map(function (item) {
    const product = findProduct(item.id);
    return item.qty + " x " + product.name + " (" + product.category + ")";
  }).join("\n");
}

/* ---------- Pre-order list display (products.html) ---------- */

function renderOrderList() {
  const listElement = document.getElementById("order-items");
  if (!listElement) {
    return; // Not on the products page
  }

  const emptyMessage = document.getElementById("order-empty");
  const actions = document.getElementById("order-actions");
  const totalElement = document.getElementById("order-total");

  listElement.innerHTML = "";

  orderList.forEach(function (item) {
    listElement.appendChild(createListRow(item));
  });

  const hasItems = orderList.length > 0;
  emptyMessage.hidden = hasItems;
  actions.hidden = !hasItems;
  totalElement.textContent = getTotalItems();
}

function createListRow(item) {
  const product = findProduct(item.id);
  const row = document.createElement("li");
  row.className = "order-item";

  const label = document.createElement("span");
  label.className = "order-item-name";
  label.innerHTML = "<strong></strong> <small></small>";
  label.querySelector("strong").textContent = product.name;
  label.querySelector("small").textContent = product.category;

  const controls = document.createElement("div");
  controls.className = "qty-controls";
  controls.appendChild(createSmallButton("−", "Decrease " + product.name, "decrease", item.id));

  const qty = document.createElement("span");
  qty.className = "qty";
  qty.textContent = item.qty;
  qty.setAttribute("aria-label", "Quantity " + item.qty);
  controls.appendChild(qty);

  controls.appendChild(createSmallButton("+", "Increase " + product.name, "increase", item.id));
  controls.appendChild(createSmallButton("Remove", "Remove " + product.name, "remove", item.id));

  row.appendChild(label);
  row.appendChild(controls);
  return row;
}

function createSmallButton(text, accessibleName, action, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "small-btn";
  button.textContent = text;
  button.setAttribute("aria-label", accessibleName);
  button.dataset.action = action;
  button.dataset.product = id;
  return button;
}

// "Add" buttons show whether the item is already in the list
function updateAddButtons() {
  const buttons = document.querySelectorAll(".add-btn");
  buttons.forEach(function (button) {
    const item = findListItem(button.dataset.product);
    if (item) {
      button.textContent = "✓ Added (" + item.qty + ") · add more";
      button.classList.add("is-added");
    } else {
      button.textContent = "+ Add to pre-order list";
      button.classList.remove("is-added");
    }
  });
}

// Screen readers hear a short message after each change
function announce(message) {
  const status = document.getElementById("order-status");
  if (status) {
    status.textContent = message;
  }
}

function setUpProductsPage() {
  const listElement = document.getElementById("order-items");
  if (!listElement) {
    return;
  }

  document.querySelectorAll(".add-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      addToList(button.dataset.product);
    });
  });

  // One listener handles every +, - and Remove button in the list
  listElement.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const id = button.dataset.product;
    if (button.dataset.action === "increase") {
      changeQuantity(id, 1);
    } else if (button.dataset.action === "decrease") {
      changeQuantity(id, -1);
    } else if (button.dataset.action === "remove") {
      removeFromList(id);
    }
  });

  document.getElementById("clear-list").addEventListener("click", clearList);

  renderOrderList();
  updateAddButtons();
}

/* ---------- Navigation counter (every page) ---------- */

function updateNavCount() {
  const link = document.querySelector('.site-nav a[href="contact.html"]');
  if (!link) {
    return;
  }
  let badge = link.querySelector(".nav-count");
  const total = getTotalItems();

  if (total === 0) {
    if (badge) {
      badge.remove();
    }
    return;
  }
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "nav-count";
    link.appendChild(badge);
  }
  badge.textContent = total;
  badge.setAttribute("aria-label", total + (total === 1 ? " item" : " items") + " in your pre-order list");
}

/* ---------- Contact form (contact.html) ---------- */

// Object of validation rules: each field id maps to a function that
// returns an error message, or an empty string when the value is valid.
const VALIDATION_RULES = {
  "name": function (value) {
    if (value === "") {
      return "Please enter your name so we know who the order is for.";
    }
    if (value.length < 2) {
      return "Your name must be at least 2 characters long.";
    }
    return "";
  },
  "email": function (value) {
    if (value === "") {
      return "Please enter your email address so we can confirm your order.";
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(value)) {
      return "Please enter a valid email address, like name@example.com.";
    }
    return "";
  },
  "pickup-date": function (value) {
    if (value === "") {
      return "Please choose a pickup date.";
    }
    const pickup = parseLocalDate(value);
    const requestType = getSelectedRequestType();
    const daysNeeded = requestType === "custom-cake" ? 7 : 2;
    const earliest = skipMonday(addDays(startOfToday(), daysNeeded));

    if (pickup < earliest) {
      return requestType === "custom-cake"
        ? "Custom and event cakes need at least one week. Please choose " + formatDate(earliest) + " or later."
        : "Pre-orders need at least two days. Please choose " + formatDate(earliest) + " or later.";
    }
    if (pickup.getDay() === 1) {
      return "We are closed on Mondays. Please choose another day.";
    }
    return "";
  },
  "item-details": function (value) {
    if (value === "") {
      return "Please tell us which items you would like or what your question is.";
    }
    if (value.length < 10) {
      return "Please add a little more detail (at least 10 characters).";
    }
    if (value.length > 1000) {
      return "Please keep item details under 1,000 characters.";
    }
    return "";
  },
  "allergy-notes": function (value) {
    if (value.length > 500) {
      return "Please keep allergy notes under 500 characters.";
    }
    return "";
  }
};

function parseLocalDate(value) {
  const parts = value.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// The bakery is closed on Mondays, so suggested dates move to Tuesday
function skipMonday(date) {
  return date.getDay() === 1 ? addDays(date, 1) : date;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function toInputDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

function getSelectedRequestType() {
  const checked = document.querySelector('input[name="request-type"]:checked');
  return checked ? checked.value : "";
}

// Shows or clears the message under one field. Returns true when valid.
function validateField(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + "-error");
  const message = VALIDATION_RULES[fieldId](field.value.trim());

  errorElement.textContent = message;
  if (message) {
    field.setAttribute("aria-invalid", "true");
  } else {
    field.removeAttribute("aria-invalid");
  }
  return message === "";
}

function validateForm() {
  let firstInvalidField = null;

  Object.keys(VALIDATION_RULES).forEach(function (fieldId) {
    const isValid = validateField(fieldId);
    if (!isValid && !firstInvalidField) {
      firstInvalidField = document.getElementById(fieldId);
    }
  });

  return firstInvalidField;
}

function handleSubmit(event) {
  event.preventDefault(); // Stop the browser from sending the form

  const firstInvalidField = validateForm();
  const summary = document.getElementById("form-summary");

  if (firstInvalidField) {
    summary.textContent = "Please fix the highlighted fields below. Everything you typed has been kept.";
    summary.className = "form-summary is-error";
    summary.hidden = false;
    firstInvalidField.focus();
    return;
  }

  // This class project has no server, so we show a confirmation instead of sending
  const name = document.getElementById("name").value.trim();
  const date = formatDate(parseLocalDate(document.getElementById("pickup-date").value));
  summary.textContent = "Thank you, " + name + "! Your request for pickup on " + date +
    " is ready to send. We'll email you a confirmation within one business day.";
  summary.className = "form-summary is-success";
  summary.hidden = false;
  summary.focus();

  clearList();
  event.target.reset();
  setPickupMin();
}

// After a field shows an error, re-check it while the user types so
// the message disappears as soon as the entry is fixed.
function setUpLiveValidation() {
  Object.keys(VALIDATION_RULES).forEach(function (fieldId) {
    const field = document.getElementById(fieldId);
    field.addEventListener("blur", function () {
      if (field.value.trim() !== "") {
        validateField(fieldId);
      }
    });
    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true") {
        validateField(fieldId);
      }
    });
  });

  // Changing the request type changes the earliest allowed pickup date
  document.querySelectorAll('input[name="request-type"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      if (document.getElementById("pickup-date").value) {
        validateField("pickup-date");
      }
    });
  });
}

function setPickupMin() {
  document.getElementById("pickup-date").min = toInputDate(addDays(startOfToday(), 2));
}

// Fill "Item details" with the list saved on the products page
function prefillFromOrderList() {
  const details = document.getElementById("item-details");
  const note = document.getElementById("prefill-note");
  if (orderList.length === 0 || details.value.trim() !== "") {
    return;
  }
  details.value = formatListAsText();
  note.hidden = false;
}

function setUpContactPage() {
  const form = document.getElementById("preorder-form");
  if (!form) {
    return;
  }
  form.noValidate = true; // JavaScript shows its own messages instead of browser pop-ups
  form.addEventListener("submit", handleSubmit);
  setPickupMin();
  setUpLiveValidation();
  prefillFromOrderList();
}

/* ---------- Start ---------- */

updateNavCount();
setUpProductsPage();
setUpContactPage();
