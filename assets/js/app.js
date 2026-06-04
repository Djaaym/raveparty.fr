/* =========================================================================
   RAVERADAR — App logic (vanilla JS, no framework)
   ========================================================================= */

/* ----------------------------- helpers --------------------------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};
const fmtDay = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return { day: d.getDate(), mon: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase() };
};
const priceLabel = (e) => (e.price === 0 ? "FREE" : `${e.currency}${e.price}`);

/* favorites in localStorage */
const FAV_KEY = "raveradar:favs";
const getFavs = () => JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
const isFav   = (id) => getFavs().includes(id);
const toggleFav = (id) => {
  const f = getFavs();
  const i = f.indexOf(id);
  if (i === -1) { f.push(id); toast("Added to favourites ♥"); }
  else { f.splice(i, 1); toast("Removed from favourites"); }
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
      <div class="poster" style="background-image:${e.poster}"></div>
      <div class="card-top">
        <span class="tag type">${e.type}</span>
        <button class="fav ${isFav(e.id) ? "on" : ""}" data-fav="${e.id}"
          onclick="event.stopPropagation();toggleFav(${e.id})" aria-label="Save">♥</button>
      </div>
      <div class="card-body">
        <div class="card-date">${fmtDate(e.date)} · ${e.time}</div>
        <h3 class="card-title">${e.title}</h3>
        <div class="card-loc">📍 ${e.city}, ${e.country}</div>
        <div class="card-meta">${e.genres.slice(0,3).map(g => `<span class="gpill">${g}</span>`).join("")}</div>
      </div>
      <div class="card-price">${priceLabel(e)}</div>
    </div>
  </article>`;
}

function rowHTML(e) {
  return `
  <article class="row-card" data-id="${e.id}" onclick="goEvent(${e.id})">
    <div class="thumb" style="background-image:${e.poster}"></div>
    <div>
      <div class="card-date">${fmtDate(e.date)} · ${e.time}</div>
      <h3>${e.title}</h3>
      <div class="card-loc">📍 ${e.venue} — ${e.city}, ${e.country}</div>
      <div class="card-meta">${e.genres.map(g => `<span class="gpill">${g}</span>`).join("")}</div>
    </div>
    <div class="row-right">
      <div class="card-price" style="position:static">${priceLabel(e)}</div>
      <button class="fav ${isFav(e.id) ? "on" : ""}" data-fav="${e.id}"
        onclick="event.stopPropagation();toggleFav(${e.id})" style="margin-top:10px" aria-label="Save">♥</button>
    </div>
  </article>`;
}

function goEvent(id) { location.href = `/event/?id=${id}`; }

/* ----------------------------- nav + reveal ---------------------------- */
function initChrome() {
  const toggle = $(".nav-toggle");
  if (toggle) toggle.addEventListener("click", () => $(".nav-links").classList.toggle("open"));

  // mark active link (folder-based routes, e.g. /explore/)
  const path = location.pathname.replace(/index\.html$/, "");
  $$(".nav-links a").forEach(a => {
    const href = a.getAttribute("href");
    if (href && href !== "/" && path.startsWith(href)) a.classList.add("active");
  });

  // scroll reveal
  const io = new IntersectionObserver((ents) => {
    ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: .12 });
  $$("[data-reveal]").forEach(el => io.observe(el));
}

/* ----------------------------- HOME ------------------------------------ */
function initHome() {
  const trend = EVENTS.filter(e => e.trending);
  const grid = $("#trending");
  if (grid) grid.innerHTML = trend.map(cardHTML).join("");

  const upcoming = [...EVENTS].sort((a,b) => a.date.localeCompare(b.date)).slice(0, 8);
  const up = $("#upcoming");
  if (up) up.innerHTML = upcoming.map(cardHTML).join("");

  // genre tiles
  const gt = $("#genre-tiles");
  if (gt) {
    gt.innerHTML = ALL_GENRES.map(g => {
      const k = GENRES[g];
      const n = EVENTS.filter(e => e.genres.includes(g)).length;
      return `<a class="genre" href="/explore/?genre=${encodeURIComponent(g)}"
        style="--g:linear-gradient(150deg,${k.c1},${k.c2})">
        <span style="position:absolute;inset:0;background:linear-gradient(150deg,${k.c1},${k.c2});opacity:.85"></span>
        <div style="position:relative;z-index:2">
          <span>${g}</span><small>${GENRE_DESC[g] || ""}</small>
          <small style="margin-top:8px;font-family:var(--f-mono)">${n} events</small>
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
    if (d) p.set("date", d);
    if (g) p.set("genre", g);
    location.href = "/explore/?" + p.toString();
  });

  // populate hero selects
  const cs = $("#q-country");
  if (cs) cs.innerHTML = `<option value="">Anywhere</option>` + COUNTRIES.map(c => `<option>${c}</option>`).join("");
  const gs = $("#q-genre");
  if (gs) gs.innerHTML = `<option value="">Any genre</option>` + ALL_GENRES.map(g => `<option>${g}</option>`).join("");

  // genre chips quick links
  const chips = $("#hero-chips");
  if (chips) chips.innerHTML = ["Techno","Hard Techno","Drum & Bass","Psytrance","Free Party","House"]
    .map(g => `<a class="chip" href="/explore/?genre=${encodeURIComponent(g)}">${g}</a>`).join("");
}

/* ----------------------------- EXPLORE --------------------------------- */
let exState = { q: "", country: "", city: "", genres: new Set(), types: new Set(), maxPrice: 300, sort: "date", view: "grid" };

function initExplore() {
  // hydrate from URL
  const u = new URLSearchParams(location.search);
  exState.q = u.get("q") || "";
  exState.country = u.get("country") || "";
  if (u.get("genre")) exState.genres.add(u.get("genre"));

  // build filter UI
  const cf = $("#f-country");
  cf.innerHTML = `<option value="">All countries</option>` + COUNTRIES.map(c => `<option ${c===exState.country?"selected":""}>${c}</option>`).join("");
  cf.addEventListener("change", () => { exState.country = cf.value; renderExplore(); });

  $("#f-search").value = exState.q;
  $("#f-search").addEventListener("input", (e) => { exState.q = e.target.value; renderExplore(); });

  $("#f-genres").innerHTML = ALL_GENRES.map(g => {
    const n = EVENTS.filter(e => e.genres.includes(g)).length;
    return `<label class="filter-opt"><input type="checkbox" value="${g}" ${exState.genres.has(g)?"checked":""}> ${g}<span class="count">${n}</span></label>`;
  }).join("");
  $$("#f-genres input").forEach(cb => cb.addEventListener("change", () => {
    cb.checked ? exState.genres.add(cb.value) : exState.genres.delete(cb.value);
    renderExplore();
  }));

  $("#f-types").innerHTML = TYPES.map(t => {
    const n = EVENTS.filter(e => e.type === t).length;
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
    exState = { q:"", country:"", city:"", genres:new Set(), types:new Set(), maxPrice:300, sort:"date", view: exState.view };
    initExplore(); // rebuild
  });

  renderExplore();
}

function filteredEvents() {
  let list = EVENTS.filter(e => {
    if (exState.country && e.country !== exState.country) return false;
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
  if (!list.length) { out.innerHTML = `<p style="color:var(--grey);padding:40px 0">No events match your filters. Try widening your search.</p>`; out.className = ""; return; }
  if (exState.view === "list") {
    out.className = "grid";
    out.innerHTML = list.map(rowHTML).join("");
  } else {
    out.className = "grid grid-3";
    out.innerHTML = list.map(cardHTML).join("");
  }
}

/* ----------------------------- MAP ------------------------------------- */
function initMap() {
  const map = L.map("map", { zoomControl: true, scrollWheelZoom: true }).setView([50.5, 8], 5);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '© OpenStreetMap · © CARTO', maxZoom: 18, subdomains: "abcd"
  }).addTo(map);

  const markers = {};
  EVENTS.forEach(e => {
    const icon = L.divIcon({ className: "", html: `<div class="map-pin"></div>`, iconSize: [18,18] });
    const m = L.marker([e.lat, e.lng], { icon }).addTo(map);
    m.bindPopup(`<div class="pop"><h4>${e.title}</h4><p>${fmtDate(e.date)} · ${e.city}, ${e.country}</p>
      <a href="/event/?id=${e.id}">View event →</a></div>`);
    markers[e.id] = m;
  });

  // side list
  const ml = $("#map-list");
  if (ml) {
    ml.innerHTML = EVENTS.map(e => `
      <div class="mini" data-id="${e.id}">
        <div class="mthumb" style="background-image:${e.poster}"></div>
        <div><h4>${e.title}</h4><span>${e.city} · ${fmtDate(e.date)}</span></div>
      </div>`).join("");
    $$(".mini").forEach(el => el.addEventListener("click", () => {
      const id = +el.dataset.id, e = EVENTS.find(x => x.id === id);
      map.flyTo([e.lat, e.lng], 9, { duration: 1.1 });
      markers[id].openPopup();
    }));
  }

  // genre filter buttons on map
  $$("#map-filters .chip").forEach(c => c.addEventListener("click", () => {
    $$("#map-filters .chip").forEach(x => x.classList.remove("on"));
    c.classList.add("on");
    const g = c.dataset.g;
    Object.entries(markers).forEach(([id, m]) => {
      const e = EVENTS.find(x => x.id === +id);
      const show = g === "all" || e.genres.includes(g);
      show ? m.addTo(map) : map.removeLayer(m);
    });
  }));
}

/* ----------------------------- EVENT PAGE ------------------------------ */
function initEvent() {
  const id = +new URLSearchParams(location.search).get("id") || 1;
  const e = EVENTS.find(x => x.id === id) || EVENTS[0];
  document.title = `${e.title} — RaveRadar`;

  $("#ev-bg").style.backgroundImage = e.poster;
  $("#ev-type").textContent = e.type;
  $("#ev-genres").innerHTML = e.genres.map(g => `<span class="tag type">${g}</span>`).join("");
  $("#ev-title").textContent = e.title;
  $("#ev-sub").innerHTML = `📍 ${e.venue} · ${e.city}, ${e.country}`;
  $("#ev-date").textContent = `${fmtDate(e.date)} · ${e.time}`;
  $("#ev-desc").textContent = e.desc;

  $("#ev-lineup").innerHTML = e.lineup.map((a, i) => `
    <div class="artist ${i===0?"headliner":""}">
      <div class="av">${a.trim()[0]}</div>
      <div><b>${a.trim()}</b><span>${i===0?"Headliner":"Live / DJ set"}</span></div>
    </div>`).join("");

  // gallery (procedural tiles)
  const g = GENRES[e.genres[0]];
  $("#ev-gallery").innerHTML = Array.from({length:8}).map((_,i) =>
    `<div style="background-image:linear-gradient(${130+i*25}deg, ${g.c1}, ${g.c2})"></div>`).join("");

  // ticket box
  $("#tk-price").textContent = priceLabel(e);
  $("#tk-date").textContent = fmtDate(e.date);
  $("#tk-venue").textContent = e.venue;
  $("#tk-city").textContent = `${e.city}, ${e.country}`;

  const favBtn = $("#ev-fav");
  favBtn.classList.toggle("on", isFav(e.id));
  favBtn.dataset.fav = e.id;
  favBtn.addEventListener("click", () => toggleFav(e.id));

  // mini map
  if (window.L && $("#ev-map")) {
    const m = L.map("ev-map", { zoomControl: false, scrollWheelZoom: false }).setView([e.lat, e.lng], 11);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { subdomains:"abcd" }).addTo(m);
    L.marker([e.lat, e.lng], { icon: L.divIcon({ html:`<div class="map-pin"></div>`, iconSize:[18,18] }) }).addTo(m);
  }

  // related
  const rel = EVENTS.filter(x => x.id !== e.id && x.genres.some(g => e.genres.includes(g))).slice(0,4);
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

  // populate selects
  $("#org-genre").innerHTML = ALL_GENRES.map(g => `<option>${g}</option>`).join("");
  $("#org-type").innerHTML = TYPES.map(t => `<option>${t}</option>`).join("");

  $("#org-form").addEventListener("submit", (e) => {
    e.preventDefault();
    toast("🎉 Event submitted for review!");
    $("#org-form").reset(); lineup = []; $("#org-lineup-list").innerHTML = "";
  });

  // live preview of title
  $("#org-title").addEventListener("input", (e) => {
    $("#preview-title").textContent = e.target.value || "Your Event Title";
  });
  $("#org-genre").addEventListener("change", (e) => {
    const g = GENRES[e.target.value];
    $("#preview-poster").style.backgroundImage = `linear-gradient(150deg,${g.c1},${g.c2})`;
  });
}

/* ----------------------------- ACCOUNT --------------------------------- */
function initAccount() {
  // tabs
  $$(".tab").forEach(t => t.addEventListener("click", () => {
    $$(".tab").forEach(x => x.classList.remove("on"));
    $$(".tabpane").forEach(x => x.classList.remove("on"));
    t.classList.add("on");
    $("#pane-" + t.dataset.tab).classList.add("on");
  }));

  // favourites
  const favs = EVENTS.filter(e => isFav(e.id));
  const fav = $("#acc-favs");
  fav.innerHTML = favs.length ? favs.map(cardHTML).join("")
    : `<p style="color:var(--grey)">No favourites yet. Tap the ♥ on any event to save it here.</p>`;

  // history (mock: random past)
  $("#acc-history").innerHTML = EVENTS.slice(8,12).map(rowHTML).join("");

  // alert toggles
  $$(".switch").forEach(s => s.addEventListener("click", () => {
    s.classList.toggle("on");
    toast(s.classList.contains("on") ? "Alert enabled 🔔" : "Alert disabled");
  }));
}

/* ----------------------------- boot ------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  initChrome();
  const page = document.body.dataset.page;
  ({ home: initHome, explore: initExplore, map: initMap, event: initEvent,
     organizer: initOrganizer, account: initAccount }[page] || (()=>{}))();
});
