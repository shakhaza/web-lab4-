// ---------- Data ----------
const API_URL = "https://jsonplaceholder.typicode.com/users";
const NAME_LIMIT = 40;
const registrations = [];   // every successful registration is stored here
let selectedEvent = null;   // { title, date } of the chosen card

// ---------- DOM selection ----------
const themeBtn = document.querySelector("#theme-btn");
const eventCards = document.querySelectorAll(".event-card");
const selectedLabel = document.querySelector("#selected-label");

const form = document.querySelector("#reg-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const groupInput = document.querySelector("#group");
const eventInput = document.querySelector("#event");   // hidden input
const agreeInput = document.querySelector("#agree");
const nameCounter = document.querySelector("#name-counter");
const formStatus = document.querySelector("#form-status");

const confirmation = document.querySelector("#confirmation");
const regCount = document.querySelector("#reg-count");
const regList = document.querySelector("#reg-list");

const loadBtn = document.querySelector("#load-btn");
const guestStatus = document.querySelector("#guest-status");
const guestList = document.querySelector("#guest-list");

// ---------- Theme switcher ----------
function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  themeBtn.textContent = isDark ? "Light theme" : "Dark theme";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

themeBtn.addEventListener("click", function () {
  applyTheme(!document.body.classList.contains("dark"));
});

// ---------- Event selection ----------
function selectEvent(card) {
  // only one card may be selected: clear all, then mark the chosen one
  eventCards.forEach(function (other) {
    other.classList.remove("selected-event");
    other.querySelector(".select-btn").textContent = "Select";
  });

  card.classList.add("selected-event");
  card.querySelector(".select-btn").textContent = "Selected";

  selectedEvent = {
    title: card.querySelector("h3").textContent,
    date: card.querySelector(".event-date").textContent
  };
  eventInput.value = selectedEvent.title;
  selectedLabel.textContent = "Selected event: " + selectedEvent.title;
  validateField(eventInput);
}

function clearSelection() {
  eventCards.forEach(function (card) {
    card.classList.remove("selected-event");
    card.querySelector(".select-btn").textContent = "Select";
  });
  selectedEvent = null;
  selectedLabel.textContent = "No event selected yet.";
}

eventCards.forEach(function (card) {
  card.querySelector(".select-btn").addEventListener("click", function () {
    selectEvent(card);
  });
});

// ---------- Validation ----------
// Each validator returns an error message, or "" when the value is valid.
function validateName(value) {
  return value.trim().length >= 3 ? "" : "Enter your full name (at least 3 characters).";
}

function validateEmail(value) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(value.trim()) ? "" : "Enter a valid email, for example name@example.com.";
}

function validateGroup(value) {
  return value.trim() !== "" ? "" : "Enter your student group.";
}

function validateEvent(value) {
  return value !== "" ? "" : "Select an event from the cards above.";
}

function validateAgreement(isChecked) {
  return isChecked ? "" : "You must agree to the rules.";
}

// Pick the right rule for a field by its id
function getErrorMessage(input) {
  switch (input.id) {
    case "name": return validateName(input.value);
    case "email": return validateEmail(input.value);
    case "group": return validateGroup(input.value);
    case "event": return validateEvent(input.value);
    case "agree": return validateAgreement(input.checked);
    default: return "";
  }
}

// Show or clear the error for one field; returns true when the field is valid
function validateField(input) {
  const message = getErrorMessage(input);
  document.querySelector("#" + input.id + "-error").textContent = message;
  input.classList.toggle("error", message !== "");
  return message === "";
}

// ---------- Live feedback ----------
function updateCounter() {
  const length = nameInput.value.length;
  nameCounter.textContent = length + " / " + NAME_LIMIT + " characters";
  nameCounter.classList.toggle("warn", length >= NAME_LIMIT - 5);
}

nameInput.addEventListener("input", updateCounter);

// Once a field was marked invalid, re-check it on every keystroke
[nameInput, emailInput, groupInput].forEach(function (input) {
  input.addEventListener("input", function () {
    if (input.classList.contains("error")) {
      validateField(input);
    }
  });
});

agreeInput.addEventListener("change", function () {
  validateField(agreeInput);
});

// ---------- Registrations ----------
function updateRegCount() {
  regCount.textContent = registrations.length === 0
    ? "No registrations yet."
    : "Total registrations: " + registrations.length;
}

function addRegistration(registration) {
  registrations.push(registration);

  confirmation.hidden = false;
  confirmation.textContent = "Thank you, " + registration.name + "! You are registered for "
    + registration.event + " (" + registration.date + ").";

  // build the list item with DOM methods (textContent keeps user input safe)
  const item = document.createElement("li");
  const text = document.createElement("span");
  text.textContent = registration.name + " (" + registration.group + ") - " + registration.event;

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", function () {
    registrations.splice(registrations.indexOf(registration), 1);
    item.remove();
    if (registrations.length === 0) {
      confirmation.hidden = true;
    }
    updateRegCount();
  });

  item.append(text, deleteBtn);
  regList.append(item);
  updateRegCount();
}

form.addEventListener("submit", function (event) {
  event.preventDefault();   // stop the page from reloading

  // validate every field (not only the first invalid one) so all errors are shown
  const fields = [nameInput, emailInput, groupInput, eventInput, agreeInput];
  const results = fields.map(validateField);

  if (results.includes(false)) {
    formStatus.textContent = "Please correct the highlighted fields.";
    formStatus.classList.add("failed");
    const firstInvalid = fields.find(function (input) {
      return input.classList.contains("error");
    });
    if (firstInvalid && firstInvalid.type !== "hidden") {
      firstInvalid.focus();
    }
    return;
  }

  addRegistration({
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    group: groupInput.value.trim(),
    event: selectedEvent.title,
    date: selectedEvent.date
  });

  form.reset();
  clearSelection();
  updateCounter();
  formStatus.textContent = "Registration saved.";
  formStatus.classList.remove("failed");
});

// ---------- Guest directory (REST API) ----------
function setGuestStatus(message, isError) {
  guestStatus.textContent = message;
  guestStatus.classList.toggle("failed", isError);
}

function createGuestCard(guest) {
  const card = document.createElement("article");
  card.className = "guest-card";

  const name = document.createElement("h3");
  name.textContent = guest.name;
  const email = document.createElement("p");
  email.textContent = "Email: " + guest.email;
  const website = document.createElement("p");
  website.textContent = "Website: " + guest.website;

  card.append(name, email, website);
  return card;
}

async function loadGuests() {
  loadBtn.disabled = true;           // no second request while one is running
  guestList.replaceChildren();       // remove old cards so nothing is duplicated
  setGuestStatus("Loading guests...", false);

  try {
    const response = await fetch(API_URL, { method: "GET" });
    if (!response.ok) {
      throw new Error("Server answered with status " + response.status);
    }
    const users = await response.json();   // JSON text -> JavaScript array
    const guests = users.slice(0, 5);

    guests.forEach(function (guest) {
      guestList.append(createGuestCard(guest));
    });
    setGuestStatus("Loaded " + guests.length + " guests.", false);
  } catch (error) {
    setGuestStatus("Could not load guests (" + error.message + "). Please try again.", true);
  } finally {
    loadBtn.disabled = false;        // the page stays usable after an error
  }
}

loadBtn.addEventListener("click", loadGuests);

// ---------- Start ----------
applyTheme(localStorage.getItem("theme") === "dark");
updateCounter();
