import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  child,
  get,
  getDatabase,
  off,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { emailNotificationConfig, firebaseConfig } from "./config.js?v=20260704-admin-simple";

const elements = {
  availableCount: document.querySelector("#availableCount"),
  availabilityNote: document.querySelector("#availabilityNote"),
  reservationForm: document.querySelector("#reservationForm"),
  reservationMessage: document.querySelector("#reservationMessage"),
  customerName: document.querySelector("#customerName"),
  customerPhone: document.querySelector("#customerPhone"),
  copyCount: document.querySelector("#copyCount"),
  reservationButton: document.querySelector("#reservationForm button[type='submit']"),
  adminDialog: document.querySelector("#adminDialog"),
  adminOpenButton: document.querySelector("#adminOpenButton"),
  adminCloseButton: document.querySelector("#adminCloseButton"),
  instructionsDialog: document.querySelector("#instructionsDialog"),
  instructionsOpenButton: document.querySelector("#instructionsOpenButton"),
  instructionsCloseButton: document.querySelector("#instructionsCloseButton"),
  instructionsLayout: document.querySelector("#instructionsLayout"),
  instructionsContent: document.querySelector("#instructionsContent"),
  instructionsIndex: document.querySelector("#instructionsIndex"),
  aboutDialog: document.querySelector("#aboutDialog"),
  aboutOpenButton: document.querySelector("#aboutOpenButton"),
  aboutCloseButton: document.querySelector("#aboutCloseButton"),
  databasePanel: document.querySelector("#databasePanel"),
  loginPanel: document.querySelector("#loginPanel"),
  loginForm: document.querySelector("#loginForm"),
  loginUser: document.querySelector("#loginUser"),
  loginPassword: document.querySelector("#loginPassword"),
  loginMessage: document.querySelector("#loginMessage"),
  adminWorkspace: document.querySelector("#adminWorkspace"),
  adminTotalBooks: document.querySelector("#adminTotalBooks"),
  adminReservedBooks: document.querySelector("#adminReservedBooks"),
  adminAvailableBooks: document.querySelector("#adminAvailableBooks"),
  batchForm: document.querySelector("#batchForm"),
  batchLabel: document.querySelector("#batchLabel"),
  batchCopies: document.querySelector("#batchCopies"),
  batchMessage: document.querySelector("#batchMessage"),
  credentialsForm: document.querySelector("#credentialsForm"),
  newAdminUser: document.querySelector("#newAdminUser"),
  newAdminPassword: document.querySelector("#newAdminPassword"),
  currentAdminNotifications: document.querySelector("#currentAdminNotifications"),
  credentialsMessage: document.querySelector("#credentialsMessage"),
  addAdminForm: document.querySelector("#addAdminForm"),
  additionalAdminUser: document.querySelector("#additionalAdminUser"),
  additionalAdminPassword: document.querySelector("#additionalAdminPassword"),
  additionalAdminNotifications: document.querySelector("#additionalAdminNotifications"),
  addAdminMessage: document.querySelector("#addAdminMessage"),
  notificationRecipientNote: document.querySelector("#notificationRecipientNote"),
  reservationRows: document.querySelector("#reservationRows"),
  batchList: document.querySelector("#batchList"),
  exportButton: document.querySelector("#exportButton"),
  logoutButton: document.querySelector("#logoutButton")
};

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.databaseURL &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

const firebaseApp = isConfigured ? initializeApp(firebaseConfig) : null;
const adminCreationApp = isConfigured ? initializeApp(firebaseConfig, "adminCreation") : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;
const adminCreationAuth = adminCreationApp ? getAuth(adminCreationApp) : null;
const database = firebaseApp ? getDatabase(firebaseApp) : null;

let currentUser = null;
let isAdmin = false;
let inventory = { totalCopies: 0, reservedCopies: 0, availableCopies: 0 };
let batches = [];
let reservations = [];
let notificationSettings = {
  adminUid: "",
  toEmail: emailNotificationConfig.toEmail || ""
};
let emailNotificationsReady = false;
let instructionsLoaded = false;

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value ?? Date.now()));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  })[character]);
}

function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function slugifyHeading(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "secao";
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  const headings = [];
  let listOpen = false;
  let orderedListOpen = false;
  let codeOpen = false;
  let skippedFirstHeading = false;
  const headingIds = new Map();

  const getHeadingId = (text) => {
    const baseId = slugifyHeading(text);
    const count = headingIds.get(baseId) ?? 0;
    headingIds.set(baseId, count + 1);
    return count ? `${baseId}-${count + 1}` : baseId;
  };

  const closeLists = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
    if (orderedListOpen) {
      html.push("</ol>");
      orderedListOpen = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      closeLists();
      html.push(codeOpen ? "</code></pre>" : "<pre><code>");
      codeOpen = !codeOpen;
      continue;
    }

    if (codeOpen) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!line.trim()) {
      closeLists();
      continue;
    }

    if (line.startsWith("# ")) {
      closeLists();
      if (!skippedFirstHeading) {
        skippedFirstHeading = true;
        continue;
      }
      const text = line.slice(2);
      const id = getHeadingId(text);
      headings.push({ id, text, level: 1 });
      html.push(`<h1 id="${id}">${renderInlineMarkdown(text)}</h1>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeLists();
      const text = line.slice(3);
      const id = getHeadingId(text);
      headings.push({ id, text, level: 2 });
      html.push(`<h2 id="${id}">${renderInlineMarkdown(text)}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      closeLists();
      const text = line.slice(4);
      const id = getHeadingId(text);
      headings.push({ id, text, level: 3 });
      html.push(`<h3 id="${id}">${renderInlineMarkdown(text)}</h3>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!listOpen) {
        closeLists();
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${renderInlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s(.+)$/);
    if (orderedMatch) {
      if (!orderedListOpen) {
        closeLists();
        html.push("<ol>");
        orderedListOpen = true;
      }
      html.push(`<li>${renderInlineMarkdown(orderedMatch[1])}</li>`);
      continue;
    }

    closeLists();
    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  }

  closeLists();
  if (codeOpen) {
    html.push("</code></pre>");
  }

  return { html: html.join(""), headings };
}

function renderInstructionsIndex(headings) {
  if (!headings.length) {
    elements.instructionsIndex.innerHTML = "";
    return;
  }

  elements.instructionsIndex.innerHTML = `
    <strong>Índice</strong>
    <div>
      ${headings
        .filter((heading) => heading.level === 2 || heading.level === 3)
        .map((heading) => `<a class="index-level-${heading.level}" href="#${heading.id}" data-target-id="${heading.id}">${escapeHtml(heading.text)}</a>`)
        .join("")}
    </div>
  `;
}

async function loadInstructions() {
  if (instructionsLoaded) {
    return;
  }

  try {
    const response = await fetch("README.md?v=20260704-phone-validation");
    if (!response.ok) {
      throw new Error(`README request failed with ${response.status}`);
    }
    const instructions = renderMarkdown(await response.text());
    elements.instructionsContent.innerHTML = instructions.html;
    renderInstructionsIndex(instructions.headings);
    instructionsLoaded = true;
  } catch {
    elements.instructionsContent.innerHTML = "<p>Não foi possível carregar as instruções. Abre o ficheiro README.md no repositório.</p>";
    elements.instructionsIndex.innerHTML = "";
  }
}

function toCsvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function normaliseStatus(status) {
  return status === "active" ? "ativa" : "cancelada";
}

function normalisePayment(paid) {
  return paid ? "paga" : "não paga";
}

function normalisePhoneKey(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits || phone.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 40) || "telefone";
}

function normalisePortugueseMobilePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return /^(91|92|93|96)\d{7}$/.test(digits) ? digits : "";
}

function getNotificationEmail() {
  return notificationSettings.toEmail || emailNotificationConfig.toEmail || "";
}

function initialiseEmailNotifications() {
  if (emailNotificationsReady) {
    return true;
  }

  if (!emailNotificationConfig?.publicKey || !emailNotificationConfig?.serviceId || !emailNotificationConfig?.templateId || !getNotificationEmail()) {
    return false;
  }

  const emailjsClient = globalThis.emailjs;
  if (!emailjsClient?.init || !emailjsClient?.send) {
    console.warn("EmailJS não está disponível para enviar notificações.");
    return false;
  }

  emailjsClient.init({ publicKey: emailNotificationConfig.publicKey });
  emailNotificationsReady = true;
  return true;
}

function sendReservationNotification({ name, phone, copies, reservationId, isUpdate = false }) {
  if (!initialiseEmailNotifications()) {
    return;
  }

  const notificationType = isUpdate ? "Reserva atualizada" : "Nova reserva";
  const copiesLabel = `${copies} exemplar${copies === 1 ? "" : "es"}`;
  const toEmail = getNotificationEmail();

  globalThis.emailjs.send(emailNotificationConfig.serviceId, emailNotificationConfig.templateId, {
    to_email: toEmail,
    participant_name: name,
    numbers_list: `${notificationType}: ${copiesLabel} de O Palácio das Pedras Negras. Telefone: ${phone}`,
    total_numbers: copies,
    raffle_url: globalThis.location.href,
    book_title: "O Palácio das Pedras Negras",
    customer_name: name,
    customer_phone: phone,
    reserved_copies: copies,
    reservation_type: notificationType,
    reservation_id: reservationId
  }).catch((error) => {
    console.error("Não foi possível enviar a notificação por email.", error);
  });
}

async function getOpenReservationByPhone(phoneKey) {
  try {
    const keys = [phoneKey];
    if (/^(91|92|93|96)\d{7}$/.test(phoneKey)) {
      keys.push(`351${phoneKey}`);
    }

    for (const key of keys) {
      const snapshot = await get(ref(database, `reservationPhoneOpen/${key}`));
      if (snapshot.exists()) {
        return { ...snapshot.val(), phoneKey: key };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function setOpenReservationByPhone(phoneKey, reservationId, copies) {
  try {
    await set(ref(database, `reservationPhoneOpen/${phoneKey}`), {
      reservationId,
      copies,
      updatedAt: serverTimestamp()
    });
  } catch {
    // Keep the reservation flow usable if the helper index is temporarily unavailable.
  }
}

async function removeOpenReservationByPhone(phoneKey, reservationId) {
  if (!phoneKey) {
    return;
  }

  try {
    const openReservation = await getOpenReservationByPhone(phoneKey);
    if (openReservation?.reservationId === reservationId) {
      await remove(ref(database, `reservationPhoneOpen/${phoneKey}`));
    }
  } catch {
    // Duplicate detection is a helper index; reservation state remains authoritative.
  }
}

async function reserveCopies(copies) {
  const inventoryRef = ref(database, "settings/inventory");
  let shouldReserveCopies = false;

  const transactionResult = await runTransaction(inventoryRef, (currentInventory) => {
    const data = currentInventory ?? { totalCopies: 0, reservedCopies: 0 };
    const totalCopies = Number(data.totalCopies ?? 0);
    const reservedCopies = Number(data.reservedCopies ?? 0);
    const availableCopies = totalCopies - reservedCopies;

    if (copies > availableCopies) {
      return;
    }

    shouldReserveCopies = true;
    return {
      ...data,
      totalCopies,
      reservedCopies: reservedCopies + copies,
      updatedAt: serverTimestamp()
    };
  });

  if (!transactionResult.committed || !shouldReserveCopies) {
    throw new Error("insufficient_inventory");
  }
}

async function releaseCopies(copies) {
  await runTransaction(ref(database, "settings/inventory"), (currentInventory) => {
    const data = currentInventory ?? { totalCopies: 0, reservedCopies: 0 };
    return {
      ...data,
      reservedCopies: Math.max(Number(data.reservedCopies ?? 0) - copies, 0),
      updatedAt: serverTimestamp()
    };
  });
}

function listFromSnapshot(snapshot) {
  const value = snapshot.val() ?? {};
  return Object.entries(value)
    .map(([id, item]) => ({ id, ...item }))
    .sort((first, second) => Number(second.createdAt ?? 0) - Number(first.createdAt ?? 0));
}

function renderPublicInventory() {
  elements.availableCount.textContent = inventory.availableCopies.toString();
  elements.copyCount.max = Math.max(inventory.availableCopies, 1).toString();
  elements.reservationButton.disabled = !isConfigured || inventory.availableCopies < 1;

  if (!isConfigured) {
    elements.availabilityNote.textContent = "Firebase ainda não configurado.";
    return;
  }

  if (inventory.totalCopies === 0) {
    elements.availabilityNote.textContent = "A administração ainda não abriu um lote para venda.";
  } else if (inventory.availableCopies === 0) {
    elements.availabilityNote.textContent = "Este lote está totalmente reservado.";
  } else {
    elements.availabilityNote.textContent = `${inventory.reservedCopies} reservados de ${inventory.totalCopies} nos lotes atuais.`;
  }
}

function renderAdminMode() {
  elements.databasePanel.hidden = isConfigured;
  elements.loginPanel.hidden = !isConfigured || Boolean(currentUser);
  elements.adminWorkspace.hidden = !isConfigured || !isAdmin;

  if (currentUser && !isAdmin) {
    setMessage(elements.loginMessage, "Este utilizador não tem permissões de administração.", true);
  }

  if (isAdmin) {
    renderAdminWorkspace();
  }
}

function renderAdminWorkspace() {
  elements.adminTotalBooks.textContent = inventory.totalCopies.toString();
  elements.adminReservedBooks.textContent = inventory.reservedCopies.toString();
  elements.adminAvailableBooks.textContent = inventory.availableCopies.toString();
  elements.newAdminUser.value = currentUser?.email ?? "";
  elements.currentAdminNotifications.checked = Boolean(currentUser?.email) && getNotificationEmail() === currentUser.email;
  elements.notificationRecipientNote.textContent = getNotificationEmail()
    ? `Notificações: ${getNotificationEmail()}`
    : "Notificações: nenhum administrador definido.";
  renderReservations();
  renderBatches();
}

function renderReservations() {
  if (reservations.length === 0) {
    elements.reservationRows.innerHTML = `<tr><td colspan="7">Ainda não existem reservas.</td></tr>`;
    return;
  }

  elements.reservationRows.innerHTML = reservations
    .map((reservation) => `
      <tr>
        <td>${escapeHtml(reservation.name)}</td>
        <td>${escapeHtml(reservation.phone)}</td>
        <td>${reservation.copies}</td>
        <td>${formatDate(reservation.createdAt)}</td>
        <td><span class="state-badge status-badge ${reservation.status === "active" ? "status-active" : "status-cancelled"}">${normaliseStatus(reservation.status)}</span></td>
        <td><span class="state-badge payment-badge ${reservation.paid ? "payment-paid" : "payment-unpaid"}">${normalisePayment(Boolean(reservation.paid))}</span></td>
        <td>
          <div class="reservation-actions">
            <button class="secondary-button" type="button" data-status-id="${reservation.id}">
              ${reservation.status === "active" ? "Cancelar" : "Repor"}
            </button>
            <button class="secondary-button" type="button" data-payment-id="${reservation.id}">
              ${reservation.paid ? "Não Pago" : "Pago"}
            </button>
          </div>
        </td>
      </tr>
    `)
    .join("");
}

function renderBatches() {
  if (batches.length === 0) {
    elements.batchList.innerHTML = `<p class="panel-note">Ainda não foram adicionados lotes para venda.</p>`;
    return;
  }

  elements.batchList.innerHTML = batches
    .map((batch) => `
      <div class="batch-item">
        <div>
          <strong>${escapeHtml(batch.label)}</strong><br />
          <span>${formatDate(batch.createdAt)}</span>
        </div>
        <div class="batch-actions">
          <strong>${batch.copies} exemplar${batch.copies === 1 ? "" : "es"}</strong>
          <button class="danger-button" type="button" data-batch-id="${batch.id}">Apagar</button>
        </div>
      </div>
    `)
    .join("");
}

async function checkAdmin(user) {
  if (!user) {
    return false;
  }

  const adminSnapshot = await get(child(ref(database), `admins/${user.uid}`));
  return adminSnapshot.exists();
}

async function ensureAdminProfile(user) {
  if (!user?.email) {
    return;
  }

  const adminRef = ref(database, `admins/${user.uid}`);
  const adminSnapshot = await get(adminRef);
  const adminData = adminSnapshot.val();

  if (adminData?.email === user.email) {
    return;
  }

  try {
    await update(adminRef, {
      email: user.email,
      updatedAt: serverTimestamp()
    });
  } catch {
    // Older database rules may still store admins as booleans until the new rules are published.
  }
}

async function setNotificationAdmin(user, email) {
  if (!user?.uid || !email) {
    throw new Error("missing_notification_admin");
  }

  await set(ref(database, "settings/notifications"), {
    adminUid: user.uid,
    toEmail: email,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser.uid
  });
}

async function ensureInventory() {
  const inventoryRef = ref(database, "settings/inventory");
  const snapshot = await get(inventoryRef);
  if (!snapshot.exists()) {
    await set(inventoryRef, {
      totalCopies: 0,
      reservedCopies: 0,
      updatedAt: serverTimestamp()
    });
  }
}

function startPublicListeners() {
  if (!isConfigured) {
    renderPublicInventory();
    return;
  }

  onValue(ref(database, "settings/inventory"), (snapshot) => {
    const data = snapshot.val() ?? {};
    const totalCopies = Number(data.totalCopies ?? 0);
    const reservedCopies = Number(data.reservedCopies ?? 0);
    inventory = {
      totalCopies,
      reservedCopies,
      availableCopies: Math.max(totalCopies - reservedCopies, 0)
    };
    renderPublicInventory();
    if (isAdmin) {
      renderAdminWorkspace();
    }
  }, () => {
    elements.availabilityNote.textContent = "Não foi possível carregar o inventário.";
  });

  onValue(ref(database, "settings/notifications"), (snapshot) => {
    const data = snapshot.val() ?? {};
    notificationSettings = {
      adminUid: data.adminUid || "",
      toEmail: data.toEmail || emailNotificationConfig.toEmail || ""
    };
    if (isAdmin) {
      renderAdminWorkspace();
    }
  }, () => {
    notificationSettings = {
      adminUid: "",
      toEmail: emailNotificationConfig.toEmail || ""
    };
  });
}

function startAdminListeners() {
  if (!isAdmin) {
    return;
  }

  onValue(ref(database, "batches"), (snapshot) => {
    batches = listFromSnapshot(snapshot);
    renderAdminWorkspace();
  }, () => {
    setMessage(elements.loginMessage, "Não foi possível carregar os lotes.", true);
  });

  onValue(ref(database, "reservations"), (snapshot) => {
    reservations = listFromSnapshot(snapshot);
    renderAdminWorkspace();
  }, () => {
    setMessage(elements.loginMessage, "Não foi possível carregar as reservas.", true);
  });
}

function stopAdminListeners() {
  if (!database) {
    return;
  }

  off(ref(database, "batches"));
  off(ref(database, "reservations"));
  batches = [];
  reservations = [];
}

elements.reservationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const copies = Number(elements.copyCount.value);
  const name = elements.customerName.value.trim();
  const phone = normalisePortugueseMobilePhone(elements.customerPhone.value);
  const phoneKey = normalisePhoneKey(phone);

  if (!isConfigured) {
    setMessage(elements.reservationMessage, "Configura primeiro o Firebase em config.js.", true);
    return;
  }

  if (!name || !Number.isInteger(copies) || copies < 1) {
    setMessage(elements.reservationMessage, "Introduz o nome, o telefone e um número de exemplares válido.", true);
    return;
  }

  if (!phone) {
    setMessage(elements.reservationMessage, "O telemóvel deve ter 9 dígitos e começar por 91, 92, 93 ou 96.", true);
    return;
  }

  if (inventory.availableCopies < 1 || copies > inventory.availableCopies) {
    setMessage(elements.reservationMessage, "Não há exemplares disponíveis neste momento.", true);
    return;
  }

  try {
    const openReservation = await getOpenReservationByPhone(phoneKey);

    if (openReservation?.reservationId) {
      const currentCopies = Number(openReservation.copies ?? 0);
      const nextCopies = currentCopies + copies;
      const shouldIncrement = confirm(`Já existe uma reserva não paga com este número de telefone. Queres acrescentar ${copies} exemplar${copies === 1 ? "" : "es"} a essa reserva, ficando com ${nextCopies} no total?`);

      if (!shouldIncrement) {
        setMessage(elements.reservationMessage, "A reserva não foi alterada.", true);
        return;
      }

      await reserveCopies(copies);

      try {
        await update(ref(database, `reservations/${openReservation.reservationId}`), {
          name: name.slice(0, 80),
          phone: phone.slice(0, 30),
          phoneKey,
          copies: nextCopies,
          updatedAt: serverTimestamp()
        });
        await setOpenReservationByPhone(phoneKey, openReservation.reservationId, nextCopies);
        if (openReservation.phoneKey && openReservation.phoneKey !== phoneKey) {
          await remove(ref(database, `reservationPhoneOpen/${openReservation.phoneKey}`)).catch(() => {});
        }
        sendReservationNotification({
          name,
          phone,
          copies: nextCopies,
          reservationId: openReservation.reservationId,
          isUpdate: true
        });
        elements.reservationForm.reset();
        setMessage(elements.reservationMessage, "Reserva atualizada. Os exemplares foram acrescentados à reserva existente.");
        return;
      } catch {
        await releaseCopies(copies);
        await removeOpenReservationByPhone(phoneKey, openReservation.reservationId);
      }
    }

    await reserveCopies(copies);

    try {
      const reservationRef = push(ref(database, "reservations"));
      await set(reservationRef, {
        name: name.slice(0, 80),
        phone: phone.slice(0, 30),
        phoneKey,
        copies,
        status: "active",
        paid: false,
        createdAt: serverTimestamp()
      });
      await setOpenReservationByPhone(phoneKey, reservationRef.key, copies);
      sendReservationNotification({ name, phone, copies, reservationId: reservationRef.key });
    } catch (reservationError) {
      await releaseCopies(copies);
      throw reservationError;
    }

    elements.reservationForm.reset();
    setMessage(elements.reservationMessage, "Reserva guardada. O teu exemplar ficou reservado neste lote.");
  } catch {
    setMessage(elements.reservationMessage, "Não foi possível guardar a reserva. Confirma a disponibilidade e tenta novamente.", true);
  }
});

elements.reservationForm.addEventListener("input", () => {
  setMessage(elements.reservationMessage, "");
});

elements.aboutOpenButton.addEventListener("click", () => {
  elements.aboutDialog.showModal();
});

elements.aboutCloseButton.addEventListener("click", () => {
  elements.aboutDialog.close();
});

elements.adminOpenButton.addEventListener("click", () => {
  renderAdminMode();
  elements.adminDialog.showModal();
});

elements.adminCloseButton.addEventListener("click", () => {
  elements.adminDialog.close();
});

elements.instructionsOpenButton.addEventListener("click", async () => {
  elements.instructionsDialog.showModal();
  await loadInstructions();
});

elements.instructionsCloseButton.addEventListener("click", () => {
  elements.instructionsDialog.close();
});

elements.instructionsIndex.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) {
    return;
  }

  event.preventDefault();
  const target = document.getElementById(link.dataset.targetId);
  if (!target) {
    return;
  }

  elements.instructionsContent.scrollTo({
    top: target.offsetTop - elements.instructionsContent.offsetTop - 18,
    behavior: "auto"
  });
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isConfigured) {
    setMessage(elements.loginMessage, "Configura primeiro o Firebase em config.js.", true);
    return;
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, elements.loginUser.value.trim(), elements.loginPassword.value);
    const adminAllowed = await checkAdmin(credential.user);

    if (!adminAllowed) {
      await signOut(auth);
      setMessage(elements.loginMessage, "Este utilizador não tem permissões de administração.", true);
      return;
    }

    elements.loginForm.reset();
    setMessage(elements.loginMessage, "");
  } catch {
    setMessage(elements.loginMessage, "O email ou a palavra-passe de administração está incorreto.", true);
  }
});

elements.batchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const copies = Number(elements.batchCopies.value);

  if (!Number.isInteger(copies) || copies < 1) {
    setMessage(elements.batchMessage, "Introduz pelo menos um exemplar para este lote.", true);
    return;
  }

  try {
    const inventoryRef = ref(database, "settings/inventory");
    const batchRef = push(ref(database, "batches"));
    const label = elements.batchLabel.value.trim() || `Lote ${batches.length + 1}`;

    const transactionResult = await runTransaction(inventoryRef, (currentInventory) => {
      const data = currentInventory ?? { totalCopies: 0, reservedCopies: 0 };
      return {
        ...data,
        totalCopies: Number(data.totalCopies ?? 0) + copies,
        reservedCopies: Number(data.reservedCopies ?? 0),
        updatedAt: serverTimestamp()
      };
    });

    if (!transactionResult.committed) {
      throw new Error("inventory_update_failed");
    }

    try {
      await set(batchRef, {
        label,
        copies,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid
      });
    } catch (batchError) {
      await runTransaction(inventoryRef, (currentInventory) => {
        const data = currentInventory ?? { totalCopies: 0, reservedCopies: 0 };
        return {
          ...data,
          totalCopies: Math.max(Number(data.totalCopies ?? 0) - copies, 0),
          reservedCopies: Number(data.reservedCopies ?? 0),
          updatedAt: serverTimestamp()
        };
      });
      throw batchError;
    }

    elements.batchForm.reset();
    setMessage(elements.batchMessage, "Lote para venda adicionado.");
  } catch {
    setMessage(elements.batchMessage, "Não foi possível adicionar o lote. Confirma se tens permissões de administração.", true);
  }
});

elements.credentialsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = elements.newAdminUser.value.trim();
  const password = elements.newAdminPassword.value;
  const shouldSetNotifications = elements.currentAdminNotifications.checked;

  if (email === currentUser.email && !password && (!shouldSetNotifications || notificationSettings.adminUid === currentUser.uid)) {
    setMessage(elements.credentialsMessage, "Não há alterações para guardar.", true);
    return;
  }

  try {
    if (email && email !== currentUser.email) {
      await updateEmail(currentUser, email);
    }

    await ensureAdminProfile(currentUser);

    if (shouldSetNotifications || notificationSettings.adminUid === currentUser.uid) {
      await setNotificationAdmin(currentUser, currentUser.email);
    }

    if (password) {
      await updatePassword(currentUser, password);
    }

    elements.newAdminPassword.value = "";
    setMessage(elements.credentialsMessage, "Acesso de administração atualizado.");
  } catch {
    setMessage(elements.credentialsMessage, "Não foi possível atualizar o acesso. Podes ter de terminar sessão e voltar a entrar antes de alterar credenciais.", true);
  }
});

elements.addAdminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = elements.additionalAdminUser.value.trim();
  const password = elements.additionalAdminPassword.value;
  const shouldSetNotifications = elements.additionalAdminNotifications.checked;

  if (!isAdmin || !adminCreationAuth) {
    setMessage(elements.addAdminMessage, "É necessário entrar como administrador para adicionar outro administrador.", true);
    return;
  }

  try {
    const credential = await createUserWithEmailAndPassword(adminCreationAuth, email, password);
    try {
      await set(ref(database, `admins/${credential.user.uid}`), {
        email: credential.user.email,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid
      });
      if (shouldSetNotifications) {
        await setNotificationAdmin(credential.user, credential.user.email);
      }
    } catch (permissionError) {
      await remove(ref(database, `admins/${credential.user.uid}`)).catch(() => {});
      await deleteUser(credential.user).catch(() => {});
      throw permissionError;
    }
    await signOut(adminCreationAuth);
    elements.addAdminForm.reset();
    setMessage(elements.addAdminMessage, shouldSetNotifications
      ? "Administrador adicionado e definido para receber notificações."
      : "Administrador adicionado. O destinatário das notificações foi mantido.");
  } catch (error) {
    await signOut(adminCreationAuth).catch(() => {});
    const message = error?.code === "auth/email-already-in-use"
      ? "Este email já existe no Firebase Authentication. Usa outro email ou adiciona o UID manualmente na consola Firebase."
      : "Não foi possível adicionar o administrador. Confirma o email, a palavra-passe e as permissões.";
    setMessage(elements.addAdminMessage, message, true);
  }
});

elements.reservationRows.addEventListener("click", async (event) => {
  const statusButton = event.target.closest("button[data-status-id]");
  const paymentButton = event.target.closest("button[data-payment-id]");

  if (paymentButton) {
    const reservation = reservations.find((item) => item.id === paymentButton.dataset.paymentId);
    if (!reservation) {
      return;
    }

    const nextPaid = !reservation.paid;

    try {
      await update(ref(database, `reservations/${reservation.id}`), {
        paid: nextPaid,
        paidAt: nextPaid ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      });

      const phoneKey = reservation.phoneKey ?? normalisePhoneKey(reservation.phone ?? "");
      if (nextPaid || reservation.status !== "active") {
        await removeOpenReservationByPhone(phoneKey, reservation.id);
      } else {
        await setOpenReservationByPhone(phoneKey, reservation.id, Number(reservation.copies ?? 0));
      }
    } catch {
      setMessage(elements.loginMessage, "Não foi possível atualizar o estado de pagamento.", true);
    }

    return;
  }

  const button = statusButton;
  if (!button) {
    return;
  }

  const reservation = reservations.find((item) => item.id === button.dataset.statusId);
  if (!reservation) {
    return;
  }

  const nextStatus = reservation.status === "active" ? "cancelled" : "active";
  const copyDelta = reservation.status === "active" ? -reservation.copies : reservation.copies;

  try {
    const inventoryRef = ref(database, "settings/inventory");
    const transactionResult = await runTransaction(inventoryRef, (currentInventory) => {
      const data = currentInventory ?? { totalCopies: 0, reservedCopies: 0 };
      const totalCopies = Number(data.totalCopies ?? 0);
      const nextReservedCopies = Number(data.reservedCopies ?? 0) + copyDelta;

      if (nextReservedCopies < 0 || nextReservedCopies > totalCopies) {
        return;
      }

      return {
        ...data,
        reservedCopies: nextReservedCopies,
        updatedAt: serverTimestamp()
      };
    });

    if (!transactionResult.committed) {
      setMessage(elements.loginMessage, "Não foi possível atualizar a reserva sem ultrapassar o stock disponível.", true);
      return;
    }

    try {
      await update(ref(database, `reservations/${reservation.id}`), { status: nextStatus });
      const phoneKey = reservation.phoneKey ?? normalisePhoneKey(reservation.phone ?? "");
      if (nextStatus === "active" && !reservation.paid) {
        await setOpenReservationByPhone(phoneKey, reservation.id, Number(reservation.copies ?? 0));
      } else {
        await removeOpenReservationByPhone(phoneKey, reservation.id);
      }
    } catch (reservationError) {
      await runTransaction(inventoryRef, (currentInventory) => {
        const data = currentInventory ?? { totalCopies: 0, reservedCopies: 0 };
        return {
          ...data,
          reservedCopies: Math.max(Number(data.reservedCopies ?? 0) - copyDelta, 0),
          updatedAt: serverTimestamp()
        };
      });
      throw reservationError;
    }
  } catch {
    setMessage(elements.loginMessage, "Não foi possível atualizar a reserva.", true);
  }
});

elements.batchList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-batch-id]");
  if (!button) {
    return;
  }

  const batch = batches.find((item) => item.id === button.dataset.batchId);
  if (!batch) {
    return;
  }

  if (!confirm(`Apagar o lote "${batch.label}" com ${batch.copies} exemplar${batch.copies === 1 ? "" : "es"}?`)) {
    return;
  }

  try {
    const inventoryRef = ref(database, "settings/inventory");
    const transactionResult = await runTransaction(inventoryRef, (currentInventory) => {
      const data = currentInventory ?? { totalCopies: 0, reservedCopies: 0 };
      const totalCopies = Number(data.totalCopies ?? 0);
      const reservedCopies = Number(data.reservedCopies ?? 0);
      const nextTotalCopies = totalCopies - Number(batch.copies ?? 0);

      if (nextTotalCopies < reservedCopies) {
        return;
      }

      return {
        ...data,
        totalCopies: Math.max(nextTotalCopies, 0),
        reservedCopies,
        updatedAt: serverTimestamp()
      };
    });

    if (!transactionResult.committed) {
      setMessage(elements.loginMessage, "Não é possível apagar este lote enquanto houver reservas ativas que dependem desses exemplares.", true);
      return;
    }

    try {
      await remove(ref(database, `batches/${batch.id}`));
      setMessage(elements.loginMessage, "Lote apagado.");
    } catch (deleteError) {
      await runTransaction(inventoryRef, (currentInventory) => {
        const data = currentInventory ?? { totalCopies: 0, reservedCopies: 0 };
        return {
          ...data,
          totalCopies: Number(data.totalCopies ?? 0) + Number(batch.copies ?? 0),
          updatedAt: serverTimestamp()
        };
      });
      throw deleteError;
    }
  } catch {
    setMessage(elements.loginMessage, "Não foi possível apagar o lote.", true);
  }
});

elements.exportButton.addEventListener("click", () => {
  const rows = [["Nome", "Telefone", "Exemplares", "Data", "Estado", "Pagamento"]].concat(
    reservations.map((reservation) => [
      reservation.name,
      reservation.phone,
      reservation.copies,
      formatDate(reservation.createdAt),
      normaliseStatus(reservation.status),
      normalisePayment(Boolean(reservation.paid))
    ])
  );
  const csv = rows.map((row) => row.map(toCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "reservas-livro.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});

elements.logoutButton.addEventListener("click", async () => {
  await signOut(auth);
});

async function init() {
  if (!isConfigured) {
    renderPublicInventory();
    renderAdminMode();
    return;
  }

  startPublicListeners();

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    isAdmin = await checkAdmin(user);

    if (isAdmin) {
      await ensureInventory();
      await ensureAdminProfile(user);
      startAdminListeners();
    } else {
      stopAdminListeners();
    }

    renderAdminMode();
  });
}

init();
