const appRoot = document.getElementById("tracker-app");
const demoMode = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  && new URLSearchParams(window.location.search).get("demo") === "1";

const state = {
  user: null,
  schema: [],
  items: [],
  devices: [],
  view: "home",
  category: null,
  search: "",
  status: "all",
  modal: null,
  toastTimer: null,
  demoItems: [],
  demoDevices: [],
};

const DEMO_SCHEMA = [
  category("clips", "Clips", "clip", "title", "status", ["inbox", "reading", "kept", "done"], [
    field("title", "Title", "text", true), field("url", "URL", "url"), field("excerpt", "Selected text", "textarea"),
    field("status", "Status", "select", false, ["inbox", "reading", "kept", "done"]), field("tags", "Tags", "tags"), field("notes", "Notes", "textarea"),
  ]),
  category("todos", "To-dos", "todo", "title", "status", ["open", "doing", "done"], [
    field("title", "Title", "text", true), field("body", "Details", "textarea"), field("status", "Status", "select", false, ["open", "doing", "done"]),
    field("due_on", "Due date", "date"), field("tags", "Tags", "tags"), field("notes", "Notes", "textarea"),
  ]),
  category("books", "Books", "book", "title", "status", ["want", "reading", "read"], [
    field("title", "Title", "text", true), field("author", "Author"), field("status", "Status", "select", false, ["want", "reading", "read"]),
    field("rating", "Rating", "number"), field("tags", "Tags", "tags"), field("notes", "Notes", "textarea"), field("started_on", "Started", "date"), field("finished_on", "Finished", "date"),
  ]),
  category("movies", "Movies", "movie", "title", "status", ["want", "watched"], [
    field("title", "Title", "text", true), field("director", "Director"), field("year", "Year", "number"), field("status", "Status", "select", false, ["want", "watched"]),
    field("rating", "Rating", "number"), field("tags", "Tags", "tags"), field("notes", "Notes", "textarea"), field("watched_on", "Watched", "date"),
  ]),
  category("restaurants", "Restaurants", "restaurant", "name", "status", ["want", "visited"], [
    field("name", "Name", "text", true), field("location", "Location"), field("cuisine", "Cuisine"), field("status", "Status", "select", false, ["want", "visited"]),
    field("rating", "Rating", "number"), field("tags", "Tags", "tags"), field("notes", "Notes", "textarea"), field("visited_on", "Visited", "date"),
  ]),
  category("ideas", "Ideas", "idea", "title", "status", ["open", "parked", "done"], [
    field("title", "Title", "text", true), field("body", "Body", "textarea"), field("status", "Status", "select", false, ["open", "parked", "done"]),
    field("tags", "Tags", "tags"), field("notes", "Notes", "textarea"),
  ]),
  category("quotes", "Quotes", "quote", "quote", null, [], [
    field("quote", "Quote", "textarea", true), field("speaker", "Speaker"), field("source", "Source"), field("tags", "Tags", "tags"), field("notes", "Notes", "textarea"),
  ]),
];

const DEMO_RECORDS = [
  demoSummary("clips", { id: "demo-clip", type: "clip", title: "A useful article worth returning to", url: "https://example.com/article", excerpt: "A small selection captured from the page.", status: "inbox", tags: ["reading"], created_at: "2026-07-09T12:00:00.000Z", updated_at: "2026-07-09T12:00:00.000Z", archived: false }),
  demoSummary("todos", { id: "demo-todo", type: "todo", title: "Plan the next Tracker category", status: "open", due_on: "2026-07-15", created_at: "2026-07-08T12:00:00.000Z", updated_at: "2026-07-08T12:00:00.000Z", archived: false }),
  demoSummary("books", { id: "demo-book", type: "book", title: "The Design of Everyday Things", author: "Don Norman", status: "reading", rating: 5, tags: ["design", "technology"], created_at: "2026-07-07T12:00:00.000Z", updated_at: "2026-07-07T12:00:00.000Z", archived: false }),
  demoSummary("quotes", { id: "demo-quote", type: "quote", quote: "A good tool disappears into the work.", speaker: "Tracker demo", created_at: "2026-07-06T12:00:00.000Z", updated_at: "2026-07-06T12:00:00.000Z", archived: false }),
];

initialize();

async function initialize() {
  registerServiceWorker();
  if (demoMode) {
    state.demoItems = structuredClone(DEMO_RECORDS);
    await startSession({ id: "demo-user", email: "demo@local", name: "Demo" });
    return;
  }

  if (!window.netlifyIdentity) {
    renderFailure("The sign-in service did not load. Refresh the page and try again.");
    return;
  }

  window.netlifyIdentity.on("init", (user) => user ? startSession(user) : renderLogin());
  window.netlifyIdentity.on("login", (user) => {
    window.netlifyIdentity.close();
    startSession(user);
  });
  window.netlifyIdentity.on("logout", renderLogin);
  window.netlifyIdentity.on("error", (error) => showToast(error.message || "Sign-in needs attention."));
  window.netlifyIdentity.init();
}

async function startSession(user) {
  state.user = user;
  appRoot.className = "loading-screen";
  appRoot.innerHTML = loadingMarkup("Loading your Tracker…");
  try {
    const bootstrap = await apiRequest("/bootstrap");
    state.user = bootstrap.user || user;
    state.schema = bootstrap.schema || DEMO_SCHEMA;
    state.items = bootstrap.items || [];
    state.devices = bootstrap.devices || [];
    state.category ||= state.schema[0]?.key || null;
    renderApp();
  } catch (error) {
    if (error.status === 401) renderLogin();
    else renderFailure(error.message || "Tracker could not load.");
  }
}

function renderLogin() {
  state.user = null;
  appRoot.className = "login-screen";
  appRoot.innerHTML = `
    <section class="login-card">
      <span class="brand-mark" aria-hidden="true">TP</span>
      <p class="eyebrow">Private workspace</p>
      <h1>Sign in</h1>
      <p>Open your private Tracker and Site Studio after authentication.</p>
      <form id="tracker-login-form" class="login-form">
        <label for="login-email">Email</label>
        <input id="login-email" name="email" type="email" autocomplete="username" required>
        <label for="login-password">Password</label>
        <input id="login-password" name="password" type="password" autocomplete="current-password" required>
        <button id="login-button" class="primary-button" type="submit">Sign in</button>
      </form>
      <p id="login-message" class="login-message hidden" role="status"></p>
      <div class="login-links">
        <button id="password-reset-button" class="text-button" type="button">Email me a password-reset link</button>
        <a href="/">Back to tuckerpippin.com</a>
      </div>
      <p class="login-help">This is an invite-only account. There is no public registration.</p>
    </section>
  `;
  document.getElementById("tracker-login-form").addEventListener("submit", loginWithPassword);
  document.getElementById("password-reset-button").addEventListener("click", requestPasswordReset);
}

async function loginWithPassword(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const button = document.getElementById("login-button");
  button.disabled = true;
  button.textContent = "Signing in…";
  updateLoginMessage("");
  try {
    const user = await window.netlifyIdentity.gotrue.login(form.get("email"), form.get("password"), true);
    await startSession(user);
  } catch (error) {
    button.disabled = false;
    button.textContent = "Sign in";
    updateLoginMessage(error.message || "Sign-in was not accepted.", true);
  }
}

async function requestPasswordReset() {
  const email = document.getElementById("login-email").value.trim();
  if (!email) {
    updateLoginMessage("Enter your email first, then request the reset link.", true);
    document.getElementById("login-email").focus();
    return;
  }
  const button = document.getElementById("password-reset-button");
  button.disabled = true;
  try {
    await window.netlifyIdentity.gotrue.requestPasswordRecovery(email);
    updateLoginMessage("Password-reset instructions are on the way if that account exists.");
  } catch (error) {
    updateLoginMessage(error.message || "The reset email could not be requested.", true);
  } finally {
    button.disabled = false;
  }
}

function updateLoginMessage(message, isError = false) {
  const element = document.getElementById("login-message");
  if (!element) return;
  element.textContent = message;
  element.className = `login-message${message ? "" : " hidden"}${isError ? " error-notice" : ""}`;
}

function renderFailure(message) {
  appRoot.className = "login-screen";
  appRoot.innerHTML = `
    <section class="login-card">
      <span class="brand-mark" aria-hidden="true">TP</span>
      <p class="eyebrow">Tracker</p>
      <h1>Something needs attention</h1>
      <p>${escapeHTML(message)}</p>
      <div class="login-actions">
        <button id="retry-button" class="primary-button" type="button">Try again</button>
        <a class="secondary-button" href="/">Back to the website</a>
      </div>
    </section>
  `;
  document.getElementById("retry-button").addEventListener("click", initialize);
}

function renderApp() {
  appRoot.className = "app-layout";
  appRoot.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <p class="eyebrow">Private library</p>
        <h1>Tracker</h1>
        <p>Capture quickly. Keep what matters. Find it again.</p>
      </div>
      <nav class="nav-list" aria-label="Tracker sections">
        ${navButton("home", "Home", "Overview", "•")}
        ${state.schema.map((definition) => navButton(definition.key, definition.label, categorySubcopy(definition.key), itemCount(definition.key))).join("")}
        ${navButton("settings", "Settings", "Devices and backup", "⚙")}
      </nav>
      <div class="sidebar-footer">
        <a href="/studio/">Site Studio</a>
        <a href="/">← Public website</a>
        <button id="logout-button" class="text-button" type="button">Sign out</button>
      </div>
    </aside>
    <main class="main-panel">
      <div id="main-content" class="content-wrap">${mainContent()}</div>
    </main>
    <div id="modal" class="modal hidden" aria-hidden="true"></div>
    <div id="toast" class="toast hidden"></div>
  `;
  bindAppEvents();
}

function mainContent() {
  if (state.view === "home") return homeMarkup();
  if (state.view === "settings") return settingsMarkup();
  return categoryMarkup();
}

function homeMarkup() {
  const recent = visibleItems().slice(0, 6);
  const openTodos = categoryItems("todos").filter((item) => item.record.status !== "done").length;
  const inboxClips = categoryItems("clips").filter((item) => item.record.status === "inbox").length;
  return `
    ${topbar("Overview", "Home", "Everything you have captured, without the sync ceremony.", true)}
    <section class="stats-grid">
      ${statCard("Records", visibleItems().length)}
      ${statCard("Clips in inbox", inboxClips)}
      ${statCard("Open to-dos", openTodos)}
    </section>
    <section class="home-grid">
      <article class="content-card">
        <h3>Recently captured</h3>
        <p class="card-note">The latest additions across every category.</p>
        <div class="recent-list">
          ${recent.length ? recent.map(recentItemMarkup).join("") : emptyInline("Nothing has been captured yet.")}
        </div>
      </article>
      <article class="content-card">
        <h3>Capture from anywhere</h3>
        <p class="card-note">The web app is ready first. Device tokens connect Shortcuts and browser extensions without giving them read access.</p>
        <button class="secondary-button" type="button" data-view="settings">Manage devices</button>
        <div class="notice">Your existing Git-backed Tracker remains the recovery copy until migration is verified.</div>
      </article>
      <article class="content-card">
        <h3>Site Studio</h3>
        <p class="card-note">Publish photos and projects with the same private login. Ownership filters and the public design stay intact.</p>
        <a class="secondary-button" href="/studio/">Manage the public site</a>
      </article>
    </section>
  `;
}

function categoryMarkup() {
  const definition = currentDefinition();
  return `
    ${topbar(definition.type, definition.label, categoryDescription(definition.key), true)}
    <section class="toolbar">
      <input id="search-input" class="input" type="search" placeholder="Search ${escapeHTML(definition.label.toLowerCase())}" value="${escapeHTML(state.search)}">
      ${definition.statusField ? `
        <select id="status-filter" class="select" aria-label="Filter by status">
          <option value="all">All statuses</option>
          ${definition.statusOptions.map((status) => `<option value="${escapeHTML(status)}" ${state.status === status ? "selected" : ""}>${escapeHTML(titleCase(status))}</option>`).join("")}
        </select>
      ` : "<span></span>"}
    </section>
    <article class="content-card table-card">
      <div id="record-table-area">${recordTableMarkup()}</div>
    </article>
  `;
}

function settingsMarkup() {
  return `
    ${topbar("Workspace", "Settings", "Connect personal devices and keep a portable copy of your library.", false)}
    <section class="home-grid" style="margin-top: 28px">
      <article class="content-card">
        <h3>Capture devices</h3>
        <p class="card-note">Each token can only add records. It cannot browse, edit, export, or delete your Tracker.</p>
        <div class="device-list">
          ${state.devices.length ? state.devices.map(deviceMarkup).join("") : emptyInline("No capture devices are connected yet.")}
        </div>
        <button id="new-device-button" class="primary-button" type="button" style="margin-top: 18px">Connect a device</button>
      </article>
      <article class="content-card">
        <h3>Portable backup</h3>
        <p class="card-note">Download all records as JSON at any time. The existing private Git repository remains untouched during migration.</p>
        <button id="export-button" class="secondary-button" type="button">Download JSON export</button>
        <div class="notice">Archived records are included in exports so an accidental deletion can be recovered.</div>
      </article>
    </section>
  `;
}

function topbar(kicker, title, description, includeAdd) {
  return `
    <header class="topbar">
      <div class="topbar-copy">
        <p class="eyebrow">${escapeHTML(kicker)}</p>
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(description)}</p>
      </div>
      <div class="topbar-actions">
        ${includeAdd ? '<button id="add-button" class="primary-button" type="button">+ Add</button>' : ""}
      </div>
    </header>
  `;
}

function recordTableMarkup() {
  const items = filteredCategoryItems();
  if (!items.length) {
    return `
      <div class="empty-state">
        <h3>Nothing here yet</h3>
        <p>Add a record or change the current filters.</p>
        <button class="primary-button" type="button" data-action="add">Add your first</button>
      </div>
    `;
  }
  return `
    <table class="record-table">
      <thead><tr><th>Record</th><th>Status</th><th>Updated</th></tr></thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td>
              <button class="record-title-button" type="button" data-action="edit" data-category="${escapeHTML(item.category)}" data-id="${escapeHTML(item.record.id)}">${escapeHTML(item.title)}</button>
              <span class="record-subtitle">${escapeHTML(item.subtitle || secondaryText(item))}</span>
            </td>
            <td>${item.record.status ? `<span class="status-chip">${escapeHTML(titleCase(item.record.status))}</span>` : "—"}</td>
            <td>${escapeHTML(formatDate(item.record.updated_at))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function bindAppEvents() {
  appRoot.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  appRoot.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
  document.getElementById("logout-button")?.addEventListener("click", async () => {
    if (demoMode) return renderLogin();
    await window.netlifyIdentity.logout();
  });
  document.getElementById("add-button")?.addEventListener("click", () => openEditor());
  document.querySelector("[data-action='add']")?.addEventListener("click", () => openEditor());
  document.getElementById("search-input")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    refreshRecordTable();
  });
  document.getElementById("status-filter")?.addEventListener("change", (event) => {
    state.status = event.target.value;
    refreshRecordTable();
  });
  bindRecordButtons();
  appRoot.querySelectorAll("[data-recent-id]").forEach((button) => {
    button.addEventListener("click", () => openEditor(button.dataset.recentCategory, button.dataset.recentId));
  });
  document.getElementById("new-device-button")?.addEventListener("click", openDeviceDialog);
  document.getElementById("export-button")?.addEventListener("click", downloadExport);
  appRoot.querySelectorAll("[data-revoke-device]").forEach((button) => {
    button.addEventListener("click", () => revokeDevice(button.dataset.revokeDevice));
  });
}

function bindRecordButtons() {
  document.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => openEditor(button.dataset.category, button.dataset.id));
  });
}

function switchView(view) {
  state.view = view;
  if (state.schema.some((definition) => definition.key === view)) {
    state.category = view;
    state.search = "";
    state.status = "all";
  }
  renderApp();
}

function openEditor(categoryKey = null, recordId = null) {
  const resolvedCategory = categoryKey || (state.view !== "home" && state.view !== "settings" ? state.view : state.category) || state.schema[0].key;
  const item = recordId ? state.items.find((candidate) => candidate.category === resolvedCategory && candidate.record.id === recordId) : null;
  state.modal = { category: resolvedCategory, item };
  renderEditor();
}

function renderEditor() {
  const modal = document.getElementById("modal");
  const definition = definitionFor(state.modal.category);
  const item = state.modal.item;
  const record = item?.record || {};
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  modal.innerHTML = `
    <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <header class="modal-header">
        <div>
          <h3 id="editor-title">${item ? "Edit" : "Add to"} ${escapeHTML(definition.label)}</h3>
          <p>${item ? "Changes are checked against the version you opened." : "Saved directly to your private Tracker."}</p>
        </div>
        <button id="close-modal" class="close-button" type="button" aria-label="Close">×</button>
      </header>
      <form id="record-form" class="record-form">
        ${!item ? `
          <div class="field wide" style="margin-bottom: 18px">
            <label for="editor-category">Type</label>
            <select id="editor-category" name="_category">
              ${state.schema.map((candidate) => `<option value="${escapeHTML(candidate.key)}" ${candidate.key === definition.key ? "selected" : ""}>${escapeHTML(candidate.label)}</option>`).join("")}
            </select>
          </div>
        ` : ""}
        <div class="fields-grid">
          ${definition.fields.map((fieldDefinition) => editorField(fieldDefinition, record[fieldDefinition.name])).join("")}
        </div>
        <footer class="modal-footer">
          ${item ? '<button id="archive-button" class="danger-button" type="button">Archive</button>' : ""}
          <div class="modal-actions">
            <button id="cancel-button" class="ghost-button" type="button">Cancel</button>
            <button id="save-button" class="primary-button" type="submit">Save</button>
          </div>
        </footer>
      </form>
    </section>
  `;
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("cancel-button").addEventListener("click", closeModal);
  document.getElementById("editor-category")?.addEventListener("change", (event) => {
    state.modal.category = event.target.value;
    renderEditor();
  });
  document.getElementById("record-form").addEventListener("submit", saveEditor);
  document.getElementById("archive-button")?.addEventListener("click", archiveCurrentItem);
  modal.querySelector("input, textarea, select")?.focus();
}

async function saveEditor(event) {
  event.preventDefault();
  const definition = definitionFor(state.modal.category);
  const form = new FormData(event.currentTarget);
  const record = state.modal.item ? { ...state.modal.item.record } : {};
  for (const fieldDefinition of definition.fields) {
    const value = form.get(fieldDefinition.name);
    if (fieldDefinition.kind === "tags") record[fieldDefinition.name] = String(value || "").split(",").map((part) => part.trim()).filter(Boolean);
    else if (fieldDefinition.kind === "number") record[fieldDefinition.name] = value === "" ? null : Number(value);
    else record[fieldDefinition.name] = String(value || "").trim();
  }
  const button = document.getElementById("save-button");
  button.disabled = true;
  button.textContent = "Saving…";
  try {
    const item = state.modal.item;
    const response = item
      ? await apiRequest(`/items/${encodeURIComponent(state.modal.category)}/${encodeURIComponent(item.record.id)}`, { method: "PUT", body: { record, etag: item.etag }, etag: item.etag })
      : await apiRequest("/items", { method: "POST", body: { category: state.modal.category, record } });
    upsertItem(toSummary(response.category, response.record, response.etag));
    closeModal();
    renderApp();
    showToast(item ? "Record updated." : "Record captured.");
  } catch (error) {
    button.disabled = false;
    button.textContent = "Save";
    showToast(error.message || "Could not save the record.");
  }
}

async function archiveCurrentItem() {
  const item = state.modal.item;
  if (!item || !window.confirm("Archive this record? It will remain in your JSON export.")) return;
  try {
    const response = await apiRequest(`/items/${encodeURIComponent(item.category)}/${encodeURIComponent(item.record.id)}`, { method: "DELETE", etag: item.etag });
    upsertItem(toSummary(response.category, response.record, response.etag));
    closeModal();
    renderApp();
    showToast("Record archived.");
  } catch (error) {
    showToast(error.message || "Could not archive the record.");
  }
}

function openDeviceDialog() {
  const modal = document.getElementById("modal");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  modal.innerHTML = `
    <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="device-title">
      <header class="modal-header">
        <div><h3 id="device-title">Connect a capture device</h3><p>Create an insert-only token for one Shortcut or browser extension.</p></div>
        <button id="close-modal" class="close-button" type="button" aria-label="Close">×</button>
      </header>
      <form id="device-form" class="record-form">
        <div class="field wide"><label for="device-name">Device name</label><input id="device-name" name="name" required placeholder="Tucker’s iPhone Shortcut"></div>
        <div class="notice">The token is shown once. Store it only in the personal device that will use it.</div>
        <footer class="modal-footer"><div class="modal-actions"><button id="cancel-button" class="ghost-button" type="button">Cancel</button><button class="primary-button" type="submit">Create token</button></div></footer>
      </form>
    </section>
  `;
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("cancel-button").addEventListener("click", closeModal);
  document.getElementById("device-form").addEventListener("submit", createDevice);
  document.getElementById("device-name").focus();
}

async function createDevice(event) {
  event.preventDefault();
  const name = new FormData(event.currentTarget).get("name");
  try {
    const response = await apiRequest("/devices", { method: "POST", body: { name } });
    state.devices = [...state.devices, response.device];
    showToken(response.token);
  } catch (error) {
    showToast(error.message || "Could not create the token.");
  }
}

function showToken(token) {
  const modal = document.getElementById("modal");
  modal.innerHTML = `
    <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="token-title">
      <header class="modal-header"><div><h3 id="token-title">Copy this token now</h3><p>It cannot be displayed again after this window closes.</p></div></header>
      <div class="record-form">
        <div id="token-value" class="token-box">${escapeHTML(token)}</div>
        <div class="notice">This token can create captures only. You can revoke it from Settings at any time.</div>
        <footer class="modal-footer"><div class="modal-actions"><button id="copy-token" class="secondary-button" type="button">Copy token</button><button id="done-token" class="primary-button" type="button">Done</button></div></footer>
      </div>
    </section>
  `;
  document.getElementById("copy-token").addEventListener("click", async () => {
    await navigator.clipboard.writeText(token);
    showToast("Token copied.");
  });
  document.getElementById("done-token").addEventListener("click", () => { closeModal(); renderApp(); });
}

async function revokeDevice(id) {
  if (!window.confirm("Revoke this device token? Captures from that device will stop immediately.")) return;
  try {
    const response = await apiRequest(`/devices/${encodeURIComponent(id)}`, { method: "DELETE" });
    state.devices = state.devices.map((device) => device.id === id ? response.device : device);
    renderApp();
    showToast("Device token revoked.");
  } catch (error) {
    showToast(error.message || "Could not revoke the token.");
  }
}

async function downloadExport() {
  try {
    const data = await apiRequest("/export");
    const blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tucker-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Tracker export downloaded.");
  } catch (error) {
    showToast(error.message || "Could not create the export.");
  }
}

async function apiRequest(path, options = {}) {
  if (demoMode) return demoRequest(path, options);
  const user = window.netlifyIdentity.currentUser();
  if (!user) throw apiError("Sign in to open Tracker.", 401);
  const token = await user.jwt();
  const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };
  if (options.body) headers["Content-Type"] = "application/json";
  if (options.etag) headers["If-Match"] = options.etag;
  const response = await fetch(`/api/tracker${path}`, {
    method: options.method || "GET",
    headers,
    credentials: "same-origin",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw apiError(data.error || `Tracker request failed (${response.status}).`, response.status);
  return data;
}

async function demoRequest(path, options = {}) {
  const method = options.method || "GET";
  if (path === "/bootstrap") return { user: state.user, schema: DEMO_SCHEMA, items: structuredClone(state.demoItems), devices: structuredClone(state.demoDevices) };
  if (path === "/items" && method === "POST") {
    const categoryKey = options.body.category;
    const record = demoNormalize(categoryKey, options.body.record, null);
    const summary = demoSummary(categoryKey, record);
    state.demoItems.push(summary);
    return { category: categoryKey, record, etag: summary.etag };
  }
  const itemMatch = /^\/items\/([^/]+)\/([^/]+)$/.exec(path);
  if (itemMatch) {
    const categoryKey = decodeURIComponent(itemMatch[1]);
    const recordId = decodeURIComponent(itemMatch[2]);
    const index = state.demoItems.findIndex((item) => item.category === categoryKey && item.record.id === recordId);
    if (index < 0) throw apiError("Record not found.", 404);
    const existing = state.demoItems[index];
    const record = method === "DELETE"
      ? { ...existing.record, archived: true, updated_at: new Date().toISOString() }
      : demoNormalize(categoryKey, options.body.record, existing.record);
    const summary = demoSummary(categoryKey, record);
    state.demoItems[index] = summary;
    return { category: categoryKey, record, etag: summary.etag };
  }
  if (path === "/devices" && method === "POST") {
    const device = { id: crypto.randomUUID(), name: options.body.name, scope: "capture:create", created_at: new Date().toISOString(), last_used_at: null, revoked_at: null };
    state.demoDevices.push(device);
    return { device, token: `tkt.${device.id}.demo-token-not-for-production` };
  }
  const deviceMatch = /^\/devices\/([^/]+)$/.exec(path);
  if (deviceMatch && method === "DELETE") {
    const id = decodeURIComponent(deviceMatch[1]);
    const device = state.demoDevices.find((candidate) => candidate.id === id);
    device.revoked_at = new Date().toISOString();
    return { device };
  }
  if (path === "/export") return { exported_at: new Date().toISOString(), version: 1, items: state.demoItems };
  throw apiError("Demo route not found.", 404);
}

function refreshRecordTable() {
  const area = document.getElementById("record-table-area");
  if (!area) return;
  area.innerHTML = recordTableMarkup();
  bindRecordButtons();
  area.querySelector("[data-action='add']")?.addEventListener("click", () => openEditor());
}

function closeModal() {
  state.modal = null;
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = "";
}

function upsertItem(summary) {
  state.items = state.items.filter((item) => !(item.category === summary.category && item.record.id === summary.record.id));
  if (!summary.record.archived) state.items.push(summary);
}

function visibleItems() {
  return state.items
    .filter((item) => !item.record.archived)
    .sort((left, right) => String(right.record.updated_at || "").localeCompare(String(left.record.updated_at || "")));
}

function categoryItems(categoryKey) {
  return visibleItems().filter((item) => item.category === categoryKey);
}

function filteredCategoryItems() {
  const query = state.search.trim().toLowerCase();
  return categoryItems(state.category).filter((item) => {
    if (state.status !== "all" && item.record.status !== state.status) return false;
    if (!query) return true;
    return Object.values(item.record).some((value) => (Array.isArray(value) ? value.join(" ") : String(value ?? "")).toLowerCase().includes(query));
  });
}

function currentDefinition() { return definitionFor(state.category); }
function definitionFor(key) { return state.schema.find((definition) => definition.key === key) || state.schema[0]; }
function itemCount(key) { return categoryItems(key).length; }

function toSummary(categoryKey, record, etag) {
  const definition = definitionFor(categoryKey);
  return { category: categoryKey, record, etag, title: String(record[definition.primaryField] || "Untitled"), subtitle: secondaryText({ category: categoryKey, record }) };
}

function demoSummary(categoryKey, record) {
  const definition = DEMO_SCHEMA.find((candidate) => candidate.key === categoryKey);
  return { category: categoryKey, record, etag: `demo-${record.updated_at}`, title: String(record[definition.primaryField] || "Untitled"), subtitle: secondaryText({ category: categoryKey, record }) };
}

function demoNormalize(categoryKey, payload, existing) {
  const now = new Date().toISOString();
  return {
    ...(existing || {}),
    ...payload,
    id: existing?.id || payload.id || crypto.randomUUID(),
    type: definitionFor(categoryKey).type,
    created_at: existing?.created_at || now,
    updated_at: now,
    archived: Boolean(payload.archived),
  };
}

function navButton(view, label, subcopy, count) {
  return `<button class="nav-button ${state.view === view ? "active" : ""}" type="button" data-view="${escapeHTML(view)}"><span class="nav-label"><strong>${escapeHTML(label)}</strong><small>${escapeHTML(subcopy)}</small></span><span class="nav-count">${escapeHTML(String(count))}</span></button>`;
}

function statCard(label, value) { return `<article class="stat-card"><span>${escapeHTML(label)}</span><strong>${escapeHTML(String(value))}</strong></article>`; }

function recentItemMarkup(item) {
  return `<div class="recent-item"><button type="button" data-recent-id="${escapeHTML(item.record.id)}" data-recent-category="${escapeHTML(item.category)}"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.subtitle || secondaryText(item))}</small></button><span class="category-pill">${escapeHTML(definitionFor(item.category).label)}</span></div>`;
}

function deviceMarkup(device) {
  const status = device.revoked_at ? "Revoked" : device.last_used_at ? `Last used ${formatDate(device.last_used_at)}` : "Not used yet";
  return `<div class="device-item"><div><strong>${escapeHTML(device.name)}</strong><small>${escapeHTML(status)}</small></div>${device.revoked_at ? '<span class="status-chip">Revoked</span>' : `<button class="danger-button" type="button" data-revoke-device="${escapeHTML(device.id)}">Revoke</button>`}</div>`;
}

function editorField(definition, value) {
  const wide = ["textarea", "tags", "url"].includes(definition.kind) ? "wide" : "";
  const required = definition.required ? "required" : "";
  const renderedValue = definition.kind === "tags" && Array.isArray(value) ? value.join(", ") : value ?? "";
  let control;
  if (definition.kind === "textarea") control = `<textarea id="field-${definition.name}" name="${definition.name}" ${required}>${escapeHTML(renderedValue)}</textarea>`;
  else if (definition.kind === "select") control = `<select id="field-${definition.name}" name="${definition.name}"><option value="">Choose…</option>${definition.options.map((option) => `<option value="${escapeHTML(option)}" ${renderedValue === option ? "selected" : ""}>${escapeHTML(titleCase(option))}</option>`).join("")}</select>`;
  else control = `<input id="field-${definition.name}" name="${definition.name}" type="${definition.kind === "tags" ? "text" : definition.kind}" value="${escapeHTML(renderedValue)}" ${required} ${definition.kind === "tags" ? 'placeholder="Comma-separated"' : ""}>`;
  return `<div class="field ${wide}"><label for="field-${definition.name}">${escapeHTML(definition.label)}${definition.required ? " *" : ""}</label>${control}</div>`;
}

function secondaryText(item) {
  const record = item.record;
  if (item.category === "clips") return record.url || record.excerpt || "";
  if (item.category === "todos") return record.due_on || record.status || record.body || "";
  if (item.category === "books") return record.author || record.status || "";
  if (item.category === "movies") return record.director || record.year || record.status || "";
  if (item.category === "restaurants") return record.location || record.cuisine || record.status || "";
  if (item.category === "ideas") return record.body || record.status || "";
  if (item.category === "quotes") return record.speaker || record.source || "";
  return "";
}

function categoryDescription(key) {
  return {
    clips: "Save pages, links, and selected text from any personal device.",
    todos: "Small commitments kept beside the ideas and sources that prompted them.",
    books: "What you want to read, what you are reading, and what stayed with you.",
    movies: "A quiet watchlist and a record of what you have seen.",
    restaurants: "Places worth trying and meals worth remembering.",
    ideas: "Thoughts before they disappear, with room to develop them later.",
    quotes: "Lines worth keeping and occasionally bringing back into view.",
  }[key] || "Your private records.";
}

function categorySubcopy(key) {
  return { clips: "Pages and selections", todos: "Open loops", books: "Reading", movies: "Watchlist", restaurants: "Places", ideas: "Thoughts", quotes: "Lines worth keeping" }[key] || "Records";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function titleCase(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function emptyInline(message) { return `<p class="card-note">${escapeHTML(message)}</p>`; }
function loadingMarkup(message) { return `<div class="loading-card"><span class="brand-mark" aria-hidden="true">TP</span><p class="eyebrow">Tucker Tracker</p><h1>${escapeHTML(message)}</h1><p>Checking your private workspace.</p></div>`; }

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function apiError(message, status) { const error = new Error(message); error.status = status; return error; }
function escapeHTML(value) { return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]); }
function field(name, label, kind = "text", required = false, options = []) { return { name, label, kind, required, options }; }
function category(key, label, type, primaryField, statusField, statusOptions, fields) { return { key, label, type, primaryField, statusField, statusOptions, fields }; }

function registerServiceWorker() {
  if ("serviceWorker" in navigator && !demoMode) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/tracker/sw.js").catch(() => {}));
  }
}
