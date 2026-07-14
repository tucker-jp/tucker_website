const appRoot = document.getElementById("studio-app");
const demoMode = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  && new URLSearchParams(window.location.search).get("demo") === "1";

const state = {
  user: null,
  view: "photos",
  static: { photos: [], projects: [] },
  studio: { photos: [], projects: [] },
  search: "",
  modal: null,
  toastTimer: null,
};

initialize();

async function initialize() {
  if (demoMode) {
    state.user = { id: "demo", email: "demo@local", name: "Demo" };
    await loadWorkspace(true);
    return;
  }
  if (!window.netlifyIdentity) return renderFailure("The sign-in service did not load. Refresh and try again.");
  window.netlifyIdentity.on("init", (user) => user ? startSession(user) : renderLogin());
  window.netlifyIdentity.on("login", (user) => { window.netlifyIdentity.close(); startSession(user); });
  window.netlifyIdentity.on("logout", renderLogin);
  window.netlifyIdentity.on("error", (error) => showToast(error.message || "Sign-in needs attention."));
  window.netlifyIdentity.init();
}

async function startSession(user) {
  state.user = user;
  appRoot.className = "loading-screen";
  appRoot.innerHTML = loadingMarkup("Loading Site Studio…");
  try {
    await loadWorkspace(false);
  } catch (error) {
    if (error.status === 401) renderLogin();
    else renderFailure(error.message || "Site Studio could not load.");
  }
}

async function loadWorkspace(isDemo = false) {
  const [staticPhotos, staticProjects, bootstrap] = await Promise.all([
    loadStaticCollection("photos"),
    loadStaticCollection("projects"),
    isDemo ? Promise.resolve({ photos: [], projects: [] }) : contentRequest("/bootstrap"),
  ]);
  state.static.photos = staticPhotos;
  state.static.projects = staticProjects;
  state.studio.photos = bootstrap.photos || [];
  state.studio.projects = bootstrap.projects || [];
  renderApp();
}

async function loadStaticCollection(kind) {
  const response = await fetch(`/content/${kind}/index.json`, { cache: "no-store" });
  if (!response.ok) return [];
  const files = await response.json();
  const entries = await Promise.all(files.map(async (filename) => {
    try {
      const itemResponse = await fetch(`/content/${kind}/${filename}`, { cache: "no-store" });
      if (!itemResponse.ok) return null;
      const text = await itemResponse.text();
      const parsed = window.siteUtils.parseFrontmatter(text);
      const id = filename.replace(/\.md$/i, "");
      const record = kind === "photos"
        ? staticPhoto(id, parsed.frontmatter)
        : staticProject(id, parsed.frontmatter, parsed.body);
      return { kind, record, etag: null, source: "legacy" };
    } catch {
      return null;
    }
  }));
  return entries.filter(Boolean);
}

function staticPhoto(id, data) {
  return {
    id, kind: "photos", source_slug: id, archived: false,
    title: data.title || "Untitled", date: data.date || "", photo: data.photo || "", photo_mobile: "",
    is_mine: parseBoolean(data.is_mine, true), caption: data.caption || "", location: data.location || "",
    description: data.description || "", creator: data.creator || "", source_url: data.source_url || "", rights: data.rights || "",
  };
}

function staticProject(id, data, body) {
  return {
    id, kind: "projects", source_slug: id, archived: false,
    title: data.title || "Untitled", status: data.status || "Active", year: Number(data.year) || new Date().getFullYear(),
    description: data.description || "", technologies: Array.isArray(data.technologies) ? data.technologies : [],
    link: data.link || "", github: data.github || "", cover_image: data.cover_image || "", cover_image_mobile: "", body: body || "",
  };
}

function mergedEntries(kind) {
  const entries = new Map(state.static[kind].map((entry) => [entry.record.id, entry]));
  for (const entry of state.studio[kind]) entries.set(entry.record.id, entry);
  return [...entries.values()].sort((left, right) => {
    if (left.record.archived !== right.record.archived) return left.record.archived ? 1 : -1;
    if (kind === "photos") return String(right.record.date || "").localeCompare(String(left.record.date || ""));
    return (Number(right.record.year) || 0) - (Number(left.record.year) || 0) || left.record.title.localeCompare(right.record.title);
  });
}

function visibleEntries() {
  const query = state.search.trim().toLowerCase();
  return mergedEntries(state.view).filter((entry) => !query || JSON.stringify(entry.record).toLowerCase().includes(query));
}

function renderLogin() {
  state.user = null;
  appRoot.className = "login-screen";
  appRoot.innerHTML = `
    <section class="login-card">
      <span class="brand-mark" aria-hidden="true">TP</span>
      <p class="eyebrow">Private workspace</p>
      <h1>Sign in</h1>
      <p>Manage the private Tracker and public site after authentication.</p>
      <form id="studio-login-form" class="login-form">
        <label for="login-email">Email</label><input id="login-email" name="email" type="email" autocomplete="username" required>
        <label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" required>
        <button id="login-button" class="primary-button" type="submit">Sign in</button>
      </form>
      <p id="login-message" class="login-message hidden" role="status"></p>
      <div class="login-links"><a href="/">Back to tuckerpippin.com</a></div>
      <p class="login-help">This is an invite-only account. There is no public registration.</p>
    </section>`;
  document.getElementById("studio-login-form").addEventListener("submit", loginWithPassword);
}

async function loginWithPassword(event) {
  event.preventDefault();
  const button = document.getElementById("login-button");
  const form = new FormData(event.currentTarget);
  button.disabled = true;
  button.textContent = "Signing in…";
  try {
    const user = await window.netlifyIdentity.gotrue.login(form.get("email"), form.get("password"), true);
    await startSession(user);
  } catch (error) {
    button.disabled = false;
    button.textContent = "Sign in";
    const message = document.getElementById("login-message");
    message.textContent = error.message || "Sign-in was not accepted.";
    message.className = "login-message error-notice";
  }
}

function renderFailure(message) {
  appRoot.className = "login-screen";
  appRoot.innerHTML = `<section class="login-card"><span class="brand-mark">TP</span><p class="eyebrow">Site Studio</p><h1>Something needs attention</h1><p>${escapeHTML(message)}</p><div class="login-actions"><button id="retry-button" class="primary-button">Try again</button><a class="secondary-button" href="/">Back to the website</a></div></section>`;
  document.getElementById("retry-button").addEventListener("click", initialize);
}

function renderApp() {
  const photos = mergedEntries("photos");
  const projects = mergedEntries("projects");
  appRoot.className = "studio-layout";
  appRoot.innerHTML = `
    <aside class="studio-sidebar">
      <div class="sidebar-brand"><p class="eyebrow">Private workspace</p><h1>Site Studio</h1><p>Publish deliberately. Keep the public site honest.</p></div>
      <nav class="nav-list" aria-label="Site Studio sections">
        ${studioNav("photos", "Photos", `${photos.filter((entry) => !entry.record.archived).length} published`, "▧")}
        ${studioNav("projects", "Projects", `${projects.filter((entry) => !entry.record.archived).length} published`, "◇")}
      </nav>
      <div class="studio-links">
        <a href="/tracker/">Open Tracker</a><a href="/">Public website</a><a href="/admin/">Legacy Decap fallback</a>
        <button id="studio-export" type="button">Export Studio data</button><button id="studio-logout" type="button">Sign out</button>
      </div>
    </aside>
    <main class="studio-main"><div class="studio-wrap">
      ${studioContent()}
    </div></main>
    <div id="modal" class="modal hidden" aria-hidden="true"></div><div id="toast" class="toast hidden"></div>`;
  bindAppEvents();
}

function studioContent() {
  const entries = mergedEntries(state.view);
  const active = entries.filter((entry) => !entry.record.archived);
  const legacy = active.filter((entry) => entry.source === "legacy").length;
  const mine = state.view === "photos" ? active.filter((entry) => entry.record.is_mine).length : null;
  const title = state.view === "photos" ? "Photos" : "Projects";
  const description = state.view === "photos"
    ? "Upload, credit, preview, and publish images without the Decap ceremony."
    : "Maintain the projects shown on your public portfolio.";
  return `
    <header class="studio-topbar"><div><p class="eyebrow">Public site</p><h2>${title}</h2><p>${description}</p></div><button id="studio-add" class="primary-button">+ Add ${state.view === "photos" ? "photo" : "project"}</button></header>
    <section class="studio-summary">
      ${studioStat("Published", active.length)}${studioStat("Legacy entries", legacy)}${studioStat(state.view === "photos" ? "My media" : "Studio entries", state.view === "photos" ? mine : active.length - legacy)}
    </section>
    <div class="studio-toolbar"><input id="studio-search" class="input" type="search" placeholder="Search ${title.toLowerCase()}" value="${escapeHTML(state.search)}"><span class="card-note">Changes publish immediately; Decap remains available for rollback.</span></div>
    <article class="content-card studio-table-card"><div id="studio-table-area">${tableMarkup()}</div></article>`;
}

function tableMarkup() {
  const entries = visibleEntries();
  if (!entries.length) return `<div class="studio-empty"><h3>Nothing found</h3><p>Add an entry or clear the search.</p><button class="primary-button" data-action="add">Add your first</button></div>`;
  return `<table class="studio-table"><thead><tr><th>Entry</th><th>${state.view === "photos" ? "Ownership" : "Status"}</th><th>Source</th><th>Updated</th></tr></thead><tbody>${entries.map(entryRow).join("")}</tbody></table>`;
}

function entryRow(entry) {
  const record = entry.record;
  const image = state.view === "photos" ? (record.photo_mobile || record.photo) : (record.cover_image_mobile || record.cover_image);
  const secondary = state.view === "photos" ? (record.caption || record.location || "No caption") : (record.description || "No description");
  const status = record.archived ? "Archived" : state.view === "photos" ? (record.is_mine ? "My media" : "Not mine") : record.status;
  const source = record.archived ? "archived" : entry.source === "legacy" ? "legacy" : "studio";
  return `<tr><td><div class="studio-entry">${image ? `<img class="studio-thumb" src="${escapeHTML(image)}" alt="">` : '<span class="studio-thumb"></span>'}<div><button data-action="edit" data-id="${escapeHTML(record.id)}">${escapeHTML(record.title)}</button><small>${escapeHTML(secondary)}</small></div></div></td><td>${escapeHTML(status)}</td><td><span class="source-chip ${source}">${source === "legacy" ? "Decap/Git" : titleCase(source)}</span></td><td>${escapeHTML(formatDate(record.updated_at || record.date || record.year))}</td></tr>`;
}

function bindAppEvents() {
  appRoot.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  document.getElementById("studio-add")?.addEventListener("click", () => openEditor());
  document.querySelector("[data-action='add']")?.addEventListener("click", () => openEditor());
  document.getElementById("studio-search")?.addEventListener("input", (event) => { state.search = event.target.value; document.getElementById("studio-table-area").innerHTML = tableMarkup(); bindTableEvents(); });
  bindTableEvents();
  document.getElementById("studio-export")?.addEventListener("click", exportStudio);
  document.getElementById("studio-logout")?.addEventListener("click", async () => { if (demoMode) return renderLogin(); await window.netlifyIdentity.logout(); });
}

function bindTableEvents() {
  document.querySelectorAll("[data-action='edit']").forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.id)));
}

function switchView(view) {
  state.view = view;
  state.search = "";
  renderApp();
}

function openEditor(recordId = null) {
  const entry = recordId ? mergedEntries(state.view).find((candidate) => candidate.record.id === recordId) : null;
  state.modal = { kind: state.view, entry, previewURL: "" };
  renderEditor();
}

function renderEditor() {
  const modal = document.getElementById("modal");
  const { kind, entry } = state.modal;
  const record = entry?.record || {};
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  modal.innerHTML = `
    <section class="modal-card studio-editor-card" role="dialog" aria-modal="true" aria-labelledby="studio-editor-title">
      <header class="modal-header"><div><h3 id="studio-editor-title">${entry ? (record.archived ? "Restore or edit" : "Edit") : "Add"} ${kind === "photos" ? "photo" : "project"}</h3><p>${entry?.source === "legacy" ? "Saving creates a reversible Studio override; the Git copy stays untouched." : "Published directly through your private workspace."}</p></div><button id="close-modal" class="close-button" type="button" aria-label="Close">×</button></header>
      <form id="studio-form" class="studio-form">
        ${kind === "photos" ? photoFields(record) : projectFields(record)}
        <div class="studio-notice">Images are converted to WebP, resized for desktop and mobile, and cached publicly. HEIC, JPEG, PNG, WebP, and TIFF are accepted up to 10 MB.</div>
        <footer class="studio-footer-actions">${entry ? '<button id="archive-entry" class="danger-button" type="button">Archive</button>' : '<span></span>'}<div><button id="cancel-entry" class="ghost-button" type="button">Cancel</button><button id="save-entry" class="primary-button" type="submit">Publish</button></div></footer>
      </form>
    </section>`;
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("cancel-entry").addEventListener("click", closeModal);
  document.getElementById("studio-form").addEventListener("submit", saveEntry);
  document.getElementById("archive-entry")?.addEventListener("click", archiveEntry);
  document.getElementById("image-file")?.addEventListener("change", previewUpload);
  document.getElementById("is-mine")?.addEventListener("change", toggleCreditFields);
  toggleCreditFields();
  modal.querySelector("input, textarea, select")?.focus();
}

function photoFields(record) {
  const image = record.photo_mobile || record.photo || "";
  return `<div class="studio-fields">
    <div class="field wide upload-zone">${image ? `<img id="upload-preview" class="upload-preview" src="${escapeHTML(image)}" alt="Current preview">` : '<div id="upload-preview" class="upload-preview"></div>'}<div><label for="image-file">Photo${record.photo ? " (optional when editing)" : ""}</label><input id="image-file" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/tiff,image/heic,image/heif,.heic,.heif" ${record.photo ? "" : "required"}><p>Studio keeps the visual presentation unchanged while generating web-sized copies automatically.</p></div></div>
    ${textField("title", "Title", record.title, true, "wide")}
    ${textField("date", "Date", toLocalDateTime(record.date), true, "", "datetime-local")}
    <div class="field"><label for="is-mine">Ownership</label><select id="is-mine" name="is_mine"><option value="true" ${record.is_mine !== false ? "selected" : ""}>My photo</option><option value="false" ${record.is_mine === false ? "selected" : ""}>Not mine</option></select></div>
    ${textField("caption", "Caption", record.caption, false, "wide")}
    ${textField("location", "Location", record.location)}
    ${textArea("description", "Description", record.description, "wide")}
    <div id="credit-fields" class="credit-fields wide studio-fields">
      ${textField("creator", "Creator / artist", record.creator)}${textField("rights", "Rights / credit", record.rights)}${textField("source_url", "Source link", record.source_url, false, "wide", "url")}
    </div>
  </div>`;
}

function projectFields(record) {
  const image = record.cover_image_mobile || record.cover_image || "";
  return `<div class="studio-fields">
    ${textField("title", "Title", record.title, true, "wide")}
    <div class="field"><label for="status">Status</label><select id="status" name="status">${["Active", "Completed", "Archived"].map((value) => `<option ${record.status === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
    ${textField("year", "Year", record.year || new Date().getFullYear(), true, "", "number")}
    ${textArea("description", "Short description", record.description, "wide", true)}
    ${textField("technologies", "Technologies (comma separated)", (record.technologies || []).join(", "), false, "wide")}
    ${textField("link", "Website", record.link, false, "", "url")}${textField("github", "GitHub", record.github, false, "", "url")}
    <div class="field wide upload-zone">${image ? `<img id="upload-preview" class="upload-preview" src="${escapeHTML(image)}" alt="Current preview">` : '<div id="upload-preview" class="upload-preview"></div>'}<div><label for="image-file">Cover image (optional)</label><input id="image-file" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/tiff,image/heic,image/heif,.heic,.heif"><p>Leave empty to keep the current cover or publish without one.</p></div></div>
    ${textArea("body", "Details (Markdown)", record.body, "wide details-field")}
  </div>`;
}

function textField(name, label, value = "", required = false, classes = "", type = "text") {
  return `<div class="field ${classes}"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${escapeHTML(value ?? "")}" ${required ? "required" : ""}></div>`;
}

function textArea(name, label, value = "", classes = "", required = false) {
  return `<div class="field ${classes}"><label for="${name}">${label}</label><textarea id="${name}" name="${name}" ${required ? "required" : ""}>${escapeHTML(value || "")}</textarea></div>`;
}

function toggleCreditFields() {
  const ownership = document.getElementById("is-mine");
  const fields = document.getElementById("credit-fields");
  if (!ownership || !fields) return;
  fields.classList.toggle("hidden", ownership.value !== "false");
}

function previewUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (state.modal.previewURL) URL.revokeObjectURL(state.modal.previewURL);
  state.modal.previewURL = URL.createObjectURL(file);
  const current = document.getElementById("upload-preview");
  if (current.tagName === "IMG") current.src = state.modal.previewURL;
  else {
    const image = document.createElement("img");
    image.id = "upload-preview";
    image.className = "upload-preview";
    image.src = state.modal.previewURL;
    current.replaceWith(image);
  }
}

async function saveEntry(event) {
  event.preventDefault();
  const button = document.getElementById("save-entry");
  button.disabled = true;
  button.textContent = "Publishing…";
  const form = new FormData(event.currentTarget);
  const { kind, entry } = state.modal;
  const previous = entry?.record || {};
  const record = kind === "photos" ? photoRecord(form, previous) : projectRecord(form, previous);
  const upload = new FormData();
  upload.set("record", JSON.stringify(record));
  const file = form.get("image");
  if (file && file.size) upload.set("image", file);
  try {
    if (demoMode) {
      const saved = { kind, record: { ...record, id: record.id || `demo-${Date.now()}`, archived: false, updated_at: new Date().toISOString() }, etag: "demo", source: "studio" };
      replaceStudioEntry(saved);
    } else {
      const path = entry ? `/items/${kind}/${encodeURIComponent(record.id)}` : `/items/${kind}`;
      const saved = await contentRequest(path, { method: entry ? "PUT" : "POST", body: upload, etag: entry?.etag || null });
      replaceStudioEntry(saved);
    }
    closeModal();
    renderApp();
    showToast(`${kind === "photos" ? "Photo" : "Project"} published.`);
  } catch (error) {
    button.disabled = false;
    button.textContent = "Publish";
    showToast(error.message || "Publish failed.");
  }
}

function photoRecord(form, previous) {
  return {
    ...previous, id: previous.id || undefined, archived: false, source_slug: previous.source_slug || previous.id || "",
    title: clean(form.get("title")), date: new Date(form.get("date")).toISOString(),
    photo: previous.photo || "", photo_mobile: previous.photo_mobile || "", is_mine: form.get("is_mine") === "true",
    caption: clean(form.get("caption")), location: clean(form.get("location")), description: clean(form.get("description")),
    creator: form.get("is_mine") === "false" ? clean(form.get("creator")) : "",
    rights: form.get("is_mine") === "false" ? clean(form.get("rights")) : "",
    source_url: form.get("is_mine") === "false" ? clean(form.get("source_url")) : "",
  };
}

function projectRecord(form, previous) {
  return {
    ...previous, id: previous.id || undefined, archived: false, source_slug: previous.source_slug || previous.id || "",
    title: clean(form.get("title")), status: clean(form.get("status")), year: Number(form.get("year")),
    description: clean(form.get("description")), technologies: clean(form.get("technologies")).split(",").map((value) => value.trim()).filter(Boolean),
    link: clean(form.get("link")), github: clean(form.get("github")), cover_image: previous.cover_image || "",
    cover_image_mobile: previous.cover_image_mobile || "", body: clean(form.get("body")),
  };
}

async function archiveEntry() {
  const { kind, entry } = state.modal;
  if (!entry || !window.confirm(`Archive “${entry.record.title}”? It will disappear from the public site but remain recoverable.`)) return;
  try {
    if (demoMode) replaceStudioEntry({ ...entry, source: "studio", record: { ...entry.record, archived: true }, etag: "demo" });
    else {
      const archived = await contentRequest(`/items/${kind}/${encodeURIComponent(entry.record.id)}`, {
        method: "DELETE", body: { record: entry.record }, etag: entry.etag || null,
      });
      replaceStudioEntry(archived);
    }
    closeModal();
    renderApp();
    showToast("Entry archived. Open it again to restore it.");
  } catch (error) {
    showToast(error.message || "Archive failed.");
  }
}

function replaceStudioEntry(entry) {
  const collection = state.studio[entry.kind];
  const index = collection.findIndex((candidate) => candidate.record.id === entry.record.id);
  if (index >= 0) collection[index] = entry;
  else collection.push(entry);
}

function closeModal() {
  if (state.modal?.previewURL) URL.revokeObjectURL(state.modal.previewURL);
  state.modal = null;
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = "";
}

async function exportStudio() {
  try {
    const data = demoMode ? { photos: state.studio.photos, projects: state.studio.projects } : await contentRequest("/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tucker-site-studio-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    showToast(error.message || "Export failed.");
  }
}

async function contentRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.user?.jwt) headers.set("Authorization", `Bearer ${await state.user.jwt()}`);
  if (options.etag) headers.set("If-Match", options.etag);
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }
  const response = await fetch(`/api/content${path}`, { method: options.method || "GET", headers, body, credentials: "same-origin" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function studioNav(view, label, subcopy, meta) {
  return `<button class="nav-button ${state.view === view ? "active" : ""}" type="button" data-view="${view}"><span class="nav-label"><strong>${label}</strong><small>${subcopy}</small></span><b class="nav-count">${meta}</b></button>`;
}

function studioStat(label, value) {
  return `<article class="studio-stat"><span class="card-note">${label}</span><strong>${value}</strong></article>`;
}

function loadingMarkup(message) {
  return `<div class="loading-card"><span class="brand-mark" aria-hidden="true">TP</span><p class="eyebrow">Private workspace</p><h1>${escapeHTML(message)}</h1><p>One moment.</p></div>`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.add("hidden"), 4200);
}

function clean(value) { return String(value || "").trim(); }
function parseBoolean(value, fallback) { if (value === undefined || value === null || value === "") return fallback; return !["false", "0", "no"].includes(String(value).toLowerCase()); }
function toLocalDateTime(value) { const date = value ? new Date(value) : new Date(); if (Number.isNaN(date.getTime())) return ""; const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return shifted.toISOString().slice(0, 16); }
function formatDate(value) { if (!value) return "—"; if (Number.isInteger(value) && value >= 2000 && value <= 2100) return String(value); const date = new Date(value); if (Number.isNaN(date.getTime())) return String(value); return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date); }
function titleCase(value) { return String(value || "").replace(/(^|[-_\s])\w/g, (match) => match.toUpperCase()).replace(/[-_]/g, " "); }
function escapeHTML(value) { return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]); }
