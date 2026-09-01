/* =========================================================================
   RAVERADAR, App logic (vanilla JS, no framework)
   Bilingual: French (default, /) + English (/en/). See lang.js.
   ========================================================================= */

/* ----------------------------- helpers --------------------------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(T("locale"), { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};
const priceLabel = (e) => (e.price === 0 ? T("dyn.free") : `${e.currency}${e.price}`);

/* ---- upcoming vs. past ----
   Same rule as the Next app (raveradar-next/lib/data.ts): a highlight promises "go to
   this one", so it may only carry events whose last day hasn't passed. Evaluated on each
   render against the browser's clock, so an open tab left overnight is right by morning. */
const TODAY = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const lastDay = (e) => e.endDate || e.date;                       // multi-day fests run to the end
const isPast  = (e, ref = TODAY()) => lastDay(e) < ref;
const upcomingEvents = (list = EVENTS, ref = TODAY()) =>
  list.filter(e => !isPast(e, ref)).sort((a, b) => a.date.localeCompare(b.date));

/* favorites in localStorage */
const FAV_KEY = "raveradar:favs";
const getFavs = () => JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
const isFav   = (id) => getFavs().includes(id);
const toggleFav = (id) => {
  const f = getFavs();
  const i = f.indexOf(id);
  if (i === -1) { f.push(id); toast(T("dyn.fav.added")); }
  else { f.splice(i, 1); toast(T("dyn.fav.removed")); }
  localStorage.setItem(FAV_KEY, JSON.stringify(f));
  $$(`.fav[data-fav="${id}"]`).forEach(b => b.classList.toggle("on", isFav(id)));
  return isFav(id);
};

/* toast */
let toastTimer;
function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ----------------------------- card template --------------------------- */
function cardHTML(e) {
  return `
  <article class="card" data-id="${e.id}" onclick="goEvent(${e.id})">
    <span class="card-genre-bar"></span>
    <div class="card-media">
      <div class="poster" style="background-image:${e.bg}"></div>
      <div class="card-top">
        <span class="tag type">${e.type}</span>
        <button class="fav ${isFav(e.id) ? "on" : ""}" data-fav="${e.id}"
          onclick="event.stopPropagation();toggleFav(${e.id})" aria-label="Save">♥</button>
      </div>
      <div class="card-body">
        <div class="card-date">${fmtDate(e.date)} · ${e.time}</div>
        <h3 class="card-title">${e.title}</h3>
        <div class="card-loc">📍 ${e.city}, ${countryLabel(e.country)}</div>
        <div class="card-foot">
          <div class="card-meta">${e.genres.slice(0,2).map(g => `<span class="gpill">${g}</span>`).join("")}</div>
          <div class="card-price">${priceLabel(e)}</div>
        </div>
      </div>
    </div>
  </article>`;
}

function rowHTML(e) {
  return `
  <article class="row-card" data-id="${e.id}" onclick="goEvent(${e.id})">
    <div class="thumb" style="background-image:${e.bg}"></div>
    <div>
      <div class="card-date">${fmtDate(e.date)} · ${e.time}</div>
      <h3>${e.title}</h3>
      <div class="card-loc">📍 ${e.venue}, ${e.city}, ${countryLabel(e.country)}</div>
      <div class="card-meta">${e.genres.map(g => `<span class="gpill">${g}</span>`).join("")}</div>
    </div>
    <div class="row-right">
      <div class="card-price" style="position:static">${priceLabel(e)}</div>
      <button class="fav ${isFav(e.id) ? "on" : ""}" data-fav="${e.id}"
        onclick="event.stopPropagation();toggleFav(${e.id})" style="margin-top:10px" aria-label="Save">♥</button>
    </div>
  </article>`;
}

function goEvent(id) { location.href = `${LP}/event/?id=${id}`; }

/* ----------------------------- i18n + chrome --------------------------- */
function applyI18n() {
  document.documentElement.lang = LANG;
  $$("[data-i18n]").forEach(el => { const v = T(el.dataset.i18n); if (v != null) el.textContent = v; });
  $$("[data-i18n-html]").forEach(el => { const v = T(el.dataset.i18nHtml); if (v != null) el.innerHTML = v; });
  $$("[data-i18n-ph]").forEach(el => { const v = T(el.dataset.i18nPh); if (v != null) el.placeholder = v; });
}

function prefixLinks() {
  if (LANG !== "en") return;
  $$('a[href^="/"]').forEach(a => {
    if (a.hasAttribute("data-lang-link")) return;
    const h = a.getAttribute("href");
    if (h.startsWith("/assets") || h.startsWith("/en")) return;
    a.setAttribute("href", h === "/" ? "/en/" : "/en" + h);
  });
}

function initLangSwitch() {
  const frPath = location.pathname.replace(/^\/en(\/|$)/, "/");
  const enPath = "/en" + (frPath === "/" ? "/" : frPath);
  const search = location.search;
  $$("[data-lang-link]").forEach(a => {
    const lang = a.dataset.langLink;
    a.setAttribute("href", (lang === "en" ? enPath : frPath) + search);
    a.classList.toggle("on", lang === LANG);
  });
}

function initChrome() {
  applyI18n();
  prefixLinks();
  initLangSwitch();

  const toggle = $(".nav-toggle");
  if (toggle) toggle.addEventListener("click", () => $(".nav-links").classList.toggle("open"));

  // mark active nav link (folder routes, language-aware)
  const path = location.pathname.replace(/^\/en/, "").replace(/index\.html$/, "") || "/";
  $$(".nav-links a").forEach(a => {
    const href = a.getAttribute("href").replace(/^\/en/, "") || "/";
    if (href !== "/" && path.startsWith(href)) a.classList.add("active");
  });

  // scroll reveal
  const io = new IntersectionObserver((ents) => {
    ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: .12 });
  $$("[data-reveal]").forEach(el => io.observe(el));
}

/* ----------------------------- HOME ------------------------------------ */
function initHome() {
  // `trending` is curation, not a date: pairing it with the date filter is what makes the
  // flag expire on its own the day after the event, with nothing to un-flag by hand.
  const live = upcomingEvents();
  const trend = live.filter(e => e.trending);
  const grid = $("#trending");
  if (grid) grid.innerHTML = trend.map(cardHTML).join("");

  const up = $("#upcoming");
  if (up) up.innerHTML = live.slice(0, 8).map(cardHTML).join("");

  // by-country browser
  const ctabs = $("#country-tabs"), cgrid = $("#country-events");
  if (ctabs && cgrid) {
    const byCountry = (c) => upcomingEvents()
      .filter(e => c === "all" || e.country === c).slice(0, 8);
    ctabs.innerHTML = `<span class="chip on" data-c="all">🌍 ${T("country.all")}</span>` +
      COUNTRIES.map(c => {
        const n = upcomingEvents().filter(e => e.country === c).length;
        return `<span class="chip" data-c="${c}">${COUNTRY_FLAG[c] || ""} ${countryLabel(c)} <b style="opacity:.55;font-weight:600">${n}</b></span>`;
      }).join("");
    const renderC = (c) => {
      const list = byCountry(c);
      cgrid.innerHTML = list.length ? list.map(cardHTML).join("")
        : `<p style="color:var(--grey)">${T("country.empty")}</p>`;
    };
    $$("#country-tabs .chip").forEach(ch => ch.addEventListener("click", () => {
      $$("#country-tabs .chip").forEach(x => x.classList.remove("on"));
      ch.classList.add("on"); renderC(ch.dataset.c);
    }));
    renderC("all");
  }

  // genre tiles
  const gt = $("#genre-tiles");
  if (gt) {
    gt.innerHTML = ALL_GENRES.map(g => {
      const k = GENRES[g];
      const n = upcomingEvents().filter(e => e.genres.includes(g)).length;
      return `<a class="genre" href="${LP}/explore/?genre=${encodeURIComponent(g)}">
        <span style="position:absolute;inset:0;background:linear-gradient(150deg,${k.c1},${k.c2});opacity:.85"></span>
        <div style="position:relative;z-index:2">
          <span>${g}</span><small>${genreDescL(g)}</small>
          <small style="margin-top:8px;font-family:var(--f-mono)">${n} ${T("dyn.events")}</small>
        </div></a>`;
    }).join("");
  }

  // hero quick-search submit
  const form = $("#hero-search");
  if (form) form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const p = new URLSearchParams();
    const q = $("#q-city").value.trim();
    const c = $("#q-country").value;
    const d = $("#q-date").value;
    const g = $("#q-genre").value;
    if (q) p.set("q", q);
    if (c) p.set("country", c);
    if (d) p.set("month", d);
    if (g) p.set("genre", g);
    location.href = `${LP}/explore/?` + p.toString();
  });

  // populate hero selects
  const cs = $("#q-country");
  if (cs) cs.innerHTML = `<option value="">${T("search.country.any")}</option>` +
    COUNTRIES.map(c => `<option value="${c}">${countryLabel(c)}</option>`).join("");
  const gs = $("#q-genre");
  if (gs) gs.innerHTML = `<option value="">${T("search.genre.any")}</option>` +
    ALL_GENRES.map(g => `<option>${g}</option>`).join("");

  // genre chips quick links
  const chips = $("#hero-chips");
  if (chips) chips.innerHTML = ["Techno","Hard Techno","Drum & Bass","Psytrance","Trance","House"]
    .map(g => `<a class="chip" href="${LP}/explore/?genre=${encodeURIComponent(g)}">${g}</a>`).join("");
}

/* ----------------------------- EXPLORE --------------------------------- */
let exState = { q: "", country: "", city: "", month: "", genres: new Set(), types: new Set(), maxPrice: 300, sort: "date", view: "grid" };

function initExplore() {
  const u = new URLSearchParams(location.search);
  exState.q = u.get("q") || "";
  exState.country = u.get("country") || "";
  exState.month = u.get("month") || "";
  if (u.get("genre")) exState.genres.add(u.get("genre"));

  const cf = $("#f-country");
  cf.innerHTML = `<option value="">${T("explore.country.all")}</option>` +
    COUNTRIES.map(c => `<option value="${c}" ${c===exState.country?"selected":""}>${countryLabel(c)}</option>`).join("");
  cf.addEventListener("change", () => { exState.country = cf.value; renderExplore(); });

  $("#f-search").value = exState.q;
  $("#f-search").addEventListener("input", (e) => { exState.q = e.target.value; renderExplore(); });

  $("#f-genres").innerHTML = ALL_GENRES.map(g => {
    const n = upcomingEvents().filter(e => e.genres.includes(g)).length;
    return `<label class="filter-opt"><input type="checkbox" value="${g}" ${exState.genres.has(g)?"checked":""}> ${g}<span class="count">${n}</span></label>`;
  }).join("");
  $$("#f-genres input").forEach(cb => cb.addEventListener("change", () => {
    cb.checked ? exState.genres.add(cb.value) : exState.genres.delete(cb.value);
    renderExplore();
  }));

  $("#f-types").innerHTML = TYPES.map(t => {
    const n = upcomingEvents().filter(e => e.type === t).length;
    return `<label class="filter-opt"><input type="checkbox" value="${t}"> ${t}<span class="count">${n}</span></label>`;
  }).join("");
  $$("#f-types input").forEach(cb => cb.addEventListener("change", () => {
    cb.checked ? exState.types.add(cb.value) : exState.types.delete(cb.value);
    renderExplore();
  }));

  const pr = $("#f-price");
  pr.addEventListener("input", () => { exState.maxPrice = +pr.value; $("#price-val").textContent = pr.value == 300 ? "€300+" : "€" + pr.value; renderExplore(); });

  $("#f-sort").addEventListener("change", (e) => { exState.sort = e.target.value; renderExplore(); });

  $$(".seg button").forEach(b => b.addEventListener("click", () => {
    $$(".seg button").forEach(x => x.classList.remove("on"));
    b.classList.add("on"); exState.view = b.dataset.view; renderExplore();
  }));

  $("#clear-filters").addEventListener("click", () => {
    exState = { q:"", country:"", city:"", month:"", genres:new Set(), types:new Set(), maxPrice:300, sort:"date", view: exState.view };
    initExplore();
  });

  renderExplore();
}

function filteredEvents() {
  // Picking a month is an explicit request, don't silently hide past dates inside it.
  let list = (exState.month ? EVENTS : upcomingEvents()).filter(e => {
    if (exState.country && e.country !== exState.country) return false;
    if (exState.month && !e.date.startsWith(exState.month)) return false;
    if (exState.maxPrice < 300 && e.price > exState.maxPrice) return false;
    if (exState.types.size && !exState.types.has(e.type)) return false;
    if (exState.genres.size && !e.genres.some(g => exState.genres.has(g))) return false;
    if (exState.q) {
      const q = exState.q.toLowerCase();
      const hay = (e.title + e.city + e.country + e.venue + e.genres.join(" ") + e.lineup.join(" ")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (exState.sort === "date") list.sort((a,b) => a.date.localeCompare(b.date));
  if (exState.sort === "price") list.sort((a,b) => a.price - b.price);
  if (exState.sort === "price-d") list.sort((a,b) => b.price - a.price);
  if (exState.sort === "az") list.sort((a,b) => a.title.localeCompare(b.title));
  return list;
}

function renderExplore() {
  const list = filteredEvents();
  $("#result-n").textContent = list.length;
  const out = $("#explore-results");
  if (!list.length) { out.innerHTML = `<p style="color:var(--grey);padding:40px 0">${T("explore.empty")}</p>`; out.className = ""; return; }
  if (exState.view === "list") { out.className = "grid"; out.innerHTML = list.map(rowHTML).join(""); }
  else { out.className = "grid grid-3"; out.innerHTML = list.map(cardHTML).join(""); }
}

/* ----------------------------- MAP ------------------------------------- */
/* Le fond de carte vient d'OpenFreeMap (Dark Matter, sans clé), CARTO ayant fermé
   ses tuiles publiques : elles répondent toujours 200, avec « API KEY REQUIRED »
   peint dessus. Tuiles vectorielles, donc MapLibre et non plus Leaflet. */
const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/dark";
const BASEMAP_ATTRIB = '<a href="https://openfreemap.org">OpenFreeMap</a> · © <a href="https://www.openmaptiles.org/">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
/* MapLibre rend des tuiles de 512 px : à échelle égale, son zoom vaut celui de
   Leaflet moins un. */
const mz = z => z - 1;

/* L'épingle vit dans une enveloppe : MapLibre écrit le transform de position en
   style inline sur l'élément du marqueur, et l'animation `pulse` de .map-pin
   l'emporterait dessus, empilant toutes les épingles à l'origine de la carte. */
function pinMarker(lngLat) {
  const wrap = document.createElement("div");
  const pin = document.createElement("div");
  pin.className = "map-pin";
  wrap.appendChild(pin);
  return new maplibregl.Marker({ element: wrap }).setLngLat(lngLat);
}

function initMap() {
  const map = new maplibregl.Map({
    container: "map", style: BASEMAP_STYLE, center: [8, 50.5], zoom: mz(5),
    attributionControl: { compact: true, customAttribution: BASEMAP_ATTRIB }
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

  const markers = {};
  EVENTS.forEach(e => {
    const m = pinMarker([e.lng, e.lat])
      .setPopup(new maplibregl.Popup({ offset: 14, closeButton: false, maxWidth: "260px" })
        .setHTML(`<div class="pop"><h4>${e.title}</h4><p>${fmtDate(e.date)} · ${e.city}, ${countryLabel(e.country)}</p>
      <a href="${LP}/event/?id=${e.id}">${T("map.viewevent")}</a></div>`))
      .addTo(map);
    markers[e.id] = m;
  });

  const ml = $("#map-list");
  if (ml) {
    ml.innerHTML = EVENTS.map(e => `
      <div class="mini" data-id="${e.id}">
        <div class="mthumb" style="background-image:${e.bg}"></div>
        <div><h4>${e.title}</h4><span>${e.city} · ${fmtDate(e.date)}</span></div>
      </div>`).join("");
    $$(".mini").forEach(el => el.addEventListener("click", () => {
      const id = +el.dataset.id, e = EVENTS.find(x => x.id === id);
      map.flyTo({ center: [e.lng, e.lat], zoom: mz(9), duration: 1100 });
      if (!markers[id].getPopup().isOpen()) markers[id].togglePopup();
    }));
  }

  $$("#map-filters .chip").forEach(c => c.addEventListener("click", () => {
    $$("#map-filters .chip").forEach(x => x.classList.remove("on"));
    c.classList.add("on");
    const g = c.dataset.g;
    Object.entries(markers).forEach(([id, m]) => {
      const e = EVENTS.find(x => x.id === +id);
      const show = g === "all" || e.genres.includes(g);
      show ? m.addTo(map) : m.remove();
    });
  }));
}

/* ----------------------------- EVENT PAGE ------------------------------ */
function initEvent() {
  const id = +new URLSearchParams(location.search).get("id") || 1;
  const e = EVENTS.find(x => x.id === id) || EVENTS[0];
  document.title = `${e.title}, RaveRadar`;

  $("#ev-bg").style.backgroundImage = e.bg;
  $("#ev-type").textContent = e.type;
  $("#ev-genres").innerHTML = e.genres.map(g => `<span class="tag type">${g}</span>`).join("");
  $("#ev-title").textContent = e.title;
  $("#ev-sub").innerHTML = `📍 ${e.venue} · ${e.city}, ${countryLabel(e.country)}`;
  $("#ev-date").textContent = `${fmtDate(e.date)} · ${e.time}`;
  $("#ev-desc").textContent = eventDescL(e);

  $("#ev-lineup").innerHTML = e.lineup.map((a, i) => `
    <div class="artist ${i===0?"headliner":""}">
      <div class="av">${a.trim()[0]}</div>
      <div><b>${a.trim()}</b><span>${i===0?T("event.headliner"):T("event.djset")}</span></div>
    </div>`).join("");

  const g = GENRES[e.genres[0]];
  $("#ev-gallery").innerHTML = Array.from({length:8}).map((_,i) =>
    `<div style="background-image:linear-gradient(${130+i*25}deg, ${g.c1}, ${g.c2})"></div>`).join("");

  $("#tk-price").textContent = priceLabel(e);
  $("#tk-date").textContent = fmtDate(e.date);
  $("#tk-venue").textContent = e.venue;
  $("#tk-city").textContent = `${e.city}, ${countryLabel(e.country)}`;

  const favBtn = $("#ev-fav");
  favBtn.classList.toggle("on", isFav(e.id));
  favBtn.dataset.fav = e.id;
  favBtn.addEventListener("click", () => toggleFav(e.id));

  if (window.maplibregl && $("#ev-map")) {
    const m = new maplibregl.Map({
      container: "ev-map", style: BASEMAP_STYLE, center: [e.lng, e.lat], zoom: mz(11),
      scrollZoom: false,
      attributionControl: { compact: true, customAttribution: BASEMAP_ATTRIB }
    });
    pinMarker([e.lng, e.lat]).addTo(m);
  }

  // "À voir aussi" on a finished listing must still point forward, never sideways into the archive.
  const rel = upcomingEvents().filter(x => x.id !== e.id && x.genres.some(g => e.genres.includes(g))).slice(0,4);
  if ($("#ev-related")) $("#ev-related").innerHTML = rel.map(cardHTML).join("");
}

/* ----------------------------- ORGANIZER ------------------------------- */
function initOrganizer() {
  let lineup = [];
  const renderLineup = () => {
    $("#org-lineup-list").innerHTML = lineup.map((a,i) =>
      `<span class="gpill" style="padding:8px 12px;display:inline-flex;gap:8px;align-items:center">${a}
        <b style="cursor:pointer;color:var(--magenta)" onclick="rmArtist(${i})">✕</b></span>`).join(" ");
  };
  const addArtist = () => {
    const v = $("#org-artist").value.trim();
    if (!v) return;
    lineup.push(v); $("#org-artist").value = ""; renderLineup();
  };
  window.rmArtist = (i) => { lineup.splice(i,1); renderLineup(); };
  $("#org-add").addEventListener("click", addArtist);
  $("#org-artist").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addArtist(); } });

  $("#org-genre").innerHTML = ALL_GENRES.map(g => `<option>${g}</option>`).join("");
  $("#org-type").innerHTML = TYPES.map(t => `<option>${t}</option>`).join("");

  $("#org-form").addEventListener("submit", (e) => {
    e.preventDefault();
    toast(T("org.toast"));
    $("#org-form").reset(); lineup = []; $("#org-lineup-list").innerHTML = "";
  });

  $("#org-title").addEventListener("input", (e) => {
    $("#preview-title").textContent = e.target.value || T("org.preview.title");
  });
  $("#org-genre").addEventListener("change", (e) => {
    const g = GENRES[e.target.value];
    $("#preview-poster").style.backgroundImage = `linear-gradient(150deg,${g.c1},${g.c2})`;
  });
}

/* ----------------------------- ACCOUNT --------------------------------- */
function initAccount() {
  $$(".tab").forEach(t => t.addEventListener("click", () => {
    $$(".tab").forEach(x => x.classList.remove("on"));
    $$(".tabpane").forEach(x => x.classList.remove("on"));
    t.classList.add("on");
    $("#pane-" + t.dataset.tab).classList.add("on");
  }));

  const favs = EVENTS.filter(e => isFav(e.id));
  const fav = $("#acc-favs");
  fav.innerHTML = favs.length ? favs.map(cardHTML).join("")
    : `<p style="color:var(--grey)">${T("acc.favs.empty")}</p>`;

  $("#acc-history").innerHTML = EVENTS.slice(8,12).map(rowHTML).join("");

  $$(".switch").forEach(s => s.addEventListener("click", () => {
    s.classList.toggle("on");
    toast(s.classList.contains("on") ? T("acc.toast.alerton") : T("acc.toast.alertoff"));
  }));
}

/* ----------------------------- GENRES HUB ------------------------------ */
function initGenresHub() {
  const gt = $("#genre-tiles");
  if (!gt) return;
  gt.innerHTML = ALL_GENRES.map(g => {
    const k = GENRES[g];
    const n = upcomingEvents().filter(e => e.genres.includes(g)).length;
    return `<a class="genre" href="${LP}/explore/?genre=${encodeURIComponent(g)}">
      <span style="position:absolute;inset:0;background:linear-gradient(150deg,${k.c1},${k.c2});opacity:.85"></span>
      <div style="position:relative;z-index:2">
        <span>${g}</span><small>${genreDescL(g)}</small>
        <small style="margin-top:8px;font-family:var(--f-mono)">${n} ${T("dyn.events")}</small>
      </div></a>`;
  }).join("");
}

/* ----------------------------- VILLES HUB ------------------------------ */
const FR_PLACES = [
  "Lyon","Paris","Rennes","Bordeaux","Nantes","Marseille","Toulouse",
  "Drôme","Lozère","Aude","Lot","Isère","Ain","Hérault","Hautes-Alpes","Tarn","Aveyron","Bretagne","Loire-Atlantique"
];
function initVillesHub() {
  const cc = $("#villes-countries");
  if (cc) cc.innerHTML = COUNTRIES.map(c => {
    const n = upcomingEvents().filter(e => e.country === c).length;
    return `<a class="chip" style="font-size:.95rem;padding:12px 18px" href="${LP}/explore/?country=${encodeURIComponent(c)}">
      ${COUNTRY_FLAG[c] || "🌍"} ${countryLabel(c)} <b style="opacity:.55;font-weight:600">${n}</b></a>`;
  }).join("");
  const ci = $("#villes-cities");
  if (ci) ci.innerHTML = FR_PLACES.map(label =>
    `<a class="chip" style="font-size:.95rem;padding:12px 18px" href="${LP}/explore/?q=${encodeURIComponent(label)}">📍 Rave party ${label}</a>`
  ).join("");
}

/* ----------------------------- boot ------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  initChrome();
  const page = document.body.dataset.page;
  ({ home: initHome, explore: initExplore, map: initMap, event: initEvent,
     organizer: initOrganizer, account: initAccount,
     genres: initGenresHub, villes: initVillesHub }[page] || (()=>{}))();
});
