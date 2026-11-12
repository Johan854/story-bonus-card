{ // bloc isolé : aucune variable ne fuit vers les autres cartes
/*
 * Story Bonus Card (FR)
 * Carte Home Assistant des sphères vocales :
 *  - Histoires bonus : 1 A+ gagné dans Pronote = 1 histoire où l'enfant invente tout ;
 *  - Révisions avec Sire Gaspard, ciblées sur les points faibles Pronote.
 * Sur la sphère (à voix haute) ou au clavier, directement dans la carte.
 * Style verre, thème clair/sombre automatique, éditeur visuel, textes en français.
 */

const CARD_VERSION = "1.0.0";

/* === NUANCE COMMUNE v2 (cartes Johan854) ===
 * Bloc identique dans toutes les cartes. Options : nuance, nuance_perso, intensite.
 * nuance "theme" (par défaut) : suit la variable carte-nuance du thème Home Assistant ;
 * si elle n'existe pas, la carte garde ses couleurs d'origine. Intensité : 0 = neutre, 1 = normal, 2 = très coloré. */
const GV_NUANCES = [["braise", "Braise (rouge)", "#e0524f"], ["ocean", "Océan (bleu)", "#2f8fd8"], ["lagon", "Lagon (turquoise)", "#1fb5a8"], ["foret", "Forêt (vert)", "#3fae5a"], ["lavande", "Lavande (violet)", "#8a63d8"], ["framboise", "Framboise (rose)", "#e05597"], ["ambre", "Ambre (orange)", "#e8902c"], ["ardoise", "Ardoise (neutre)", "#7d8595"]];
const GV_DEFAULTS = { nuance: "theme", intensite: 1 };
const gvAccent = (c) => {
  const p = c && c.nuance_perso;
  if (c && c.nuance === "perso") {
    if (Array.isArray(p) && p.length === 3) return "#" + p.map((v) => Math.max(0, Math.min(255, Math.round(+v || 0))).toString(16).padStart(2, "0")).join("");
    if (typeof p === "string" && /^#?[0-9a-f]{6}$/i.test(p.trim())) return "#" + p.trim().replace("#", "");
  }
  const n = GV_NUANCES.find((x) => x[0] === (c && c.nuance));
  return n ? n[2] : "var(--carte-nuance)";
};
/* Variables posées sur <ha-card> : --g-bg-x (fond dégradé teinté) et --acc-ui-x (couleur d'accent).
 * Sans nuance (thème sans carte-nuance), elles sont invalides : chaque carte retombe alors sur ses couleurs d'origine. */
const gvStyle = (c, dark) => {
  const i = Number(c && c.intensite), ai = Number.isFinite(i) ? Math.max(0, Math.min(2, i)) : 1;
  const m = (pct, base) => `color-mix(in srgb,var(--acc-ui) ${+(pct * ai).toFixed(1)}%,${base})`;
  const bg = dark ? `linear-gradient(160deg,${m(5, "#1b1e32")} 0%,${m(11, "#1f1b2c")} 55%,${m(22, "#1c1620")} 100%)`
    : `linear-gradient(160deg,${m(2, "#f8f9fd")} 0%,${m(5, "#eef1f8")} 55%,${m(11, "#f8f8fa")} 100%)`;
  return `--acc-ui:${gvAccent(c)};--g-bg-x:${bg};--acc-ui-x:color-mix(in srgb,var(--acc-ui) ${dark ? "80%,#fff" : "82%,#000"})`;
};
const GV_FIELDS = [
  { name: "nuance", selector: { select: { mode: "dropdown", options: [{ value: "theme", label: "Selon le thème (couleurs d'origine)" }, ...GV_NUANCES.map((n) => ({ value: n[0], label: n[1] })), { value: "perso", label: "Personnalisée" }] } } },
  { name: "nuance_perso", selector: { color_rgb: {} } },
  { name: "intensite", selector: { number: { min: 0, max: 2, step: 0.1, mode: "slider" } } }];
const GV_LABELS = { nuance: "Nuance de couleur", nuance_perso: "Couleur personnalisée (nuance « Personnalisée »)", intensite: "Intensité de la nuance" };
/* === FIN NUANCE COMMUNE === */

const DEFAULTS = {
  counter: "",            // compteur d'histoires bonus (ex. counter.logan_histoires_bonus)
  script: "",             // script qui lance l'histoire (ex. script.logan_histoire_bonus)
  satellite: "",          // sphère / satellite qui raconte (ex. assist_satellite.sphere_logan_assist_satellite)
  agent: "",              // agent de conversation pour le mode clavier (ex. conversation.prof_6e)
  age: 11,                // âge de l'enfant (mode clavier)
  pronote: "",            // n'importe quel capteur Pronote de l'enfant (facultatif, pour les derniers A+)
  name: "",               // prénom affiché
  image: "",              // personnage ou photo (ex. /local/image/pixel.png)
  title: "Histoires bonus",
  level: "A+",            // compétence qui rapporte une histoire
  max_recent: 3,          // derniers A+ affichés
  confirm: true,          // demander une confirmation avant de lancer
  revisions: true,        // onglet Révisions avec Sire Gaspard
  revision_script: "",    // script de révisions sur la sphère (ex. script.logan_revisions)
  revision_image: "https://github.com/Johan854/sphere-ai-images/raw/main/images/Gaspard/240x240/idle.png", // image de Sire Gaspard
  niveau: "6e",           // niveau scolaire
  revision_days: 30,      // points faibles Pronote sur N jours
  default_tab: "histoires",
  theme: "auto", nuance: "theme", intensite: 1,
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const NOACC = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const SUBJECTS = {
  "FRANCAIS": "Français", "MATHEMATIQUES": "Maths", "EDUCATION MUSICALE": "Musique", "ARTS PLASTIQUES": "Arts plastiques",
  "ED.PHYSIQUE & SPORT.": "EPS", "EDUCATION PHYSIQUE ET SPORTIVE": "EPS", "HISTOIRE-GEOGRAPHIE": "Histoire-géo", "HISTOIRE GEOGRAPHIE": "Histoire-géo",
  "HISTOIRE & GEOGRAPHIE": "Histoire-géo", "ENS. MORAL & CIVIQUE": "EMC", "ENS.INTEG.SC.&TECHNO": "Sciences", "SCIENCES ET TECHNOLOGIE": "Sciences",
  "SCIENCES VIE & TERRE": "SVT", "PHYSIQUE-CHIMIE": "Physique-chimie", "TECHNOLOGIE": "Techno", "ANGLAIS LV1": "Anglais", "ESPAGNOL LV2": "Espagnol",
  "ALLEMAND LV2": "Allemand", "LATIN": "Latin",
};
const subj = (s) => {
  const k = NOACC(s); if (SUBJECTS[k]) return SUBJECTS[k];
  const t = String(s || "").trim().toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1);
};
const toDate = (v) => {
  if (!v) return null; if (v instanceof Date) return v;
  const s = String(v); const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + "T12:00:00") : new Date(s.replace(" ", "T"));
  return isNaN(d) ? null : d;
};
const STORY_PROMPT = (name, age) => `Consigne (ne la répète pas) : mode histoire, histoire bonus pour ${name || "l'enfant"}, ${age} ans, gagnée grâce à un A+ à l'école. `
  + "C'est lui qui invente tout : le héros, ses pouvoirs, le monde, les règles et les méchants. "
  + "Commence par lui poser 3 questions courtes, une à la fois, pour construire l'univers (héros, monde, objectif). "
  + "Ensuite raconte l'histoire en au moins 5 étapes courtes (un paragraphe chacune), en reprenant fidèlement ses idées. "
  + "À la fin de chaque étape, propose 2 ou 3 choix numérotés et termine par une question. Après le 5e choix, termine par une fin épique et joyeuse. "
  + "Pas de violence gratuite ni de passage effrayant. Il écrit au clavier : réponds par écrit, phrases simples, sans titres ni listes à puces sauf pour les choix. "
  + "Commence maintenant par te présenter en une phrase puis pose la première question.";
const REV_SUBJECTS = [
  ["faibles", "Mes points faibles", "mdi:target"], ["francais", "Français", "mdi:alphabetical-variant"], ["maths", "Maths", "mdi:calculator-variant"],
  ["anglais", "Anglais", "mdi:translate"], ["sciences", "Sciences", "mdi:flask-outline"], ["histoire", "Histoire-géo", "mdi:earth"],
];
const REV_PROMPT = (name, niveau, mat, weak) => `Consigne (ne la répète pas) : mode révisions, niveau ${niveau}, pour ${name || "l'écuyer"}. Matière choisie : ${mat}. `
  + (weak ? `D'après Pronote, il doit retravailler : ${weak}. ` + (mat === "Mes points faibles" ? "Base toute la quête sur ces points. " : "Dans la matière choisie, commence par les points de cette liste qui la concernent. ")
    : (mat === "Mes points faibles" ? "Pronote ne signale aucun point faible récent : félicite-le, puis fais une quête de révisions variée. " : ""))
  + "Il écrit au clavier : réponds par écrit, phrases courtes. Annonce la quête en une phrase puis pose la première question.";
const SUFFIXES = ["class", "evaluations", "grades", "homework", "current_period", "overall_average", "averages", "server_status"];

class StoryBonusCard extends HTMLElement {
  static getConfigElement() { return document.createElement("story-bonus-card-editor"); }
  static getStubConfig(hass) {
    const k = hass ? Object.keys(hass.states) : [];
    return {
      counter: k.find((e) => /^counter\..*bonus/.test(e)) || "",
      script: k.find((e) => /^script\..*bonus/.test(e)) || "",
      pronote: k.find((e) => /^sensor\.pronote_.+_class$/.test(e)) || "",
    };
  }

  constructor() { super(); this.attachShadow({ mode: "open" }); this._sig = ""; this._confirm = false; this._sent = 0; this._chat = null; this._draft = ""; this._tab = null; this._mat = null; }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = { ...DEFAULTS, ...config }; this._sig = "";
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass; if (!this._config) return;
    const c = this._config, ev = this._pre() && hass.states[this._pre() + "evaluations"];
    const st = (e) => (e && hass.states[e] ? hass.states[e].last_updated + hass.states[e].state : "");
    const sig = [st(c.counter), st(c.script), ev ? ev.last_updated : "", this._isDark() ? "d" : "l"].join("|");
    if (sig !== this._sig) { this._sig = sig; if (!this._chat) this._render(); }
  }

  getCardSize() { return this._chat ? 9 : 5; }

  _pre() {
    const e = String((this._config && this._config.pronote) || "");
    if (!e.startsWith("sensor.pronote_")) return "";
    for (const s of SUFFIXES) if (e.endsWith("_" + s)) return e.slice(0, -s.length);
    return e.replace(/[^_]+$/, "");
  }

  _isDark() {
    const t = this._config && this._config.theme;
    if (t === "dark") return true; if (t === "light") return false;
    const dm = this._hass && this._hass.themes && this._hass.themes.darkMode;
    if (typeof dm === "boolean") return dm;
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  _wins() {
    const p = this._pre(); const s = p && this._hass.states[p + "evaluations"];
    const list = s && s.attributes && Array.isArray(s.attributes.evaluations) ? s.attributes.evaluations : [];
    const lvl = String(this._config.level || "A+").toUpperCase(), out = [];
    list.forEach((e) => (Array.isArray(e.acquisitions) ? e.acquisitions : []).forEach((a) => {
      if (String(a.abbreviation || "").toUpperCase() === lvl) out.push({ date: toDate(e.date), subject: subj(e.subject), name: a.name || e.name || "" });
    }));
    out.sort((a, b) => (b.date || 0) - (a.date || 0));
    return out;
  }

  _weak() {
    const p = this._pre(); const s = p && this._hass.states[p + "evaluations"];
    const list = s && s.attributes && Array.isArray(s.attributes.evaluations) ? s.attributes.evaluations : [];
    const lim = Date.now() - (Number(this._config.revision_days) || 30) * 86400000, out = [], seen = new Set();
    list.forEach((e) => {
      const d = toDate(e.date); if (d && d.getTime() < lim) return;
      (Array.isArray(e.acquisitions) ? e.acquisitions : []).forEach((a) => {
        const ab = String(a.abbreviation || "").toUpperCase(), lv = String(a.level || "");
        if (!(/fragile|insuffisante/i.test(lv) || ["C", "D", "E"].includes(ab))) return;
        const k = e.subject + "|" + a.name; if (seen.has(k)) return; seen.add(k);
        out.push({ date: d, subject: subj(e.subject), name: a.name || e.name || "", abbr: ab, bad: /insuffisante/i.test(lv) || ab === "E" || ab === "D" });
      });
    });
    out.sort((a, b) => (b.date || 0) - (a.date || 0));
    return out;
  }

  _revise(mode) {
    const c = this._config, weak = this._weak();
    const m = REV_SUBJECTS.find((x) => x[0] === this._curMat(weak)) || REV_SUBJECTS[2];
    const weakTxt = weak.slice(0, 8).map((w) => `${w.subject} : ${w.name}`).join(" ; ");
    this._confirm = false;
    if (mode === "clavier") {
      this._chat = { id: null, msgs: [], busy: false, mode: "rev" }; this._render();
      this._ask(REV_PROMPT(c.name, c.niveau, m[1], weakTxt), true);
      return;
    }
    const service = c.revision_script.includes(".") ? c.revision_script.split(".")[1] : c.revision_script;
    this._hass.callService("script", service, { satellite: c.satellite, matiere: m[1] });
    this._sent = Date.now(); this._render(); setTimeout(() => this._render(), 4200);
  }

  _curMat(weak) { return this._mat || (weak.length ? "faibles" : "maths"); }

  _launch(mode) {
    const c = this._config;
    if (!c.script || !this._hass) return;
    const service = c.script.includes(".") ? c.script.split(".")[1] : c.script;
    if (mode === "clavier") {
      // Le script décompte l'histoire sans rien lancer sur la sphère
      this._hass.callService("script", service, { clavier: true });
      this._confirm = false;
      this._chat = { id: null, msgs: [], busy: false, mode: "story" };
      this._render();
      this._ask(STORY_PROMPT(c.name, Number(c.age) || 11), true);
      return;
    }
    this._hass.callService("script", service, c.satellite ? { satellite: c.satellite } : {});
    this._confirm = false; this._sent = Date.now(); this._render();
    setTimeout(() => this._render(), 4200);
  }

  async _ask(text, hidden) {
    const ch = this._chat, c = this._config;
    if (!ch || ch.busy || !text.trim()) return;
    if (!hidden) ch.msgs.push({ me: true, t: text.trim() });
    ch.busy = true; this._draft = ""; this._render();
    try {
      const r = await this._hass.callWS({ type: "conversation/process", text, agent_id: c.agent, conversation_id: ch.id || undefined, language: "fr" });
      ch.id = r.conversation_id || ch.id;
      const sp = r.response && r.response.speech && r.response.speech.plain && r.response.speech.plain.speech;
      ch.msgs.push({ me: false, t: sp || "…" });
    } catch (e) {
      ch.msgs.push({ me: false, err: true, t: "Oups, je n'arrive pas à joindre le conteur (" + ((e && e.message) || e) + ")." });
    }
    ch.busy = false; this._render();
  }

  _chatHtml() {
    const ch = this._chat;
    const msgs = ch.msgs.map((m) => `<div class="m ${m.me ? "me" : "ai"} ${m.err ? "err" : ""}">${esc(m.t)}</div>`).join("");
    const last = [...ch.msgs].reverse().find((m) => !m.me);
    // Choix numérotés proposés par le conteur → boutons rapides
    const nums = last && !ch.busy ? [...String(last.t).matchAll(/(?:^|\n)\s*([1-3])[.)]\s*/g)].map((x) => x[1]) : [];
    const chips = nums.length >= 2 ? `<div class="chips2">${[...new Set(nums)].map((n) => `<button data-choice="${n}">Choix ${n}</button>`).join("")}</div>` : "";
    return `<div class="chat">
      <div class="msgs">${msgs}${ch.busy ? `<div class="typing"><span></span><span></span><span></span></div>` : ""}</div>
      ${chips}
      <div class="inp"><input type="text" placeholder="Écris ta réponse…" ${ch.busy ? "disabled" : ""} enterkeyhint="send"><button class="send" data-act="send" ${ch.busy ? "disabled" : ""}><ha-icon icon="mdi:send"></ha-icon></button></div>
      ${ch.mode === "rev" ? `<div class="ends"><button class="end" data-act="fini" ${ch.busy ? "disabled" : ""}>J'ai fini (bilan)</button><button class="end" data-act="end">Fermer</button></div>`
        : `<button class="end" data-act="end">Terminer l'histoire</button>`}
    </div>`;
  }

  _render() {
    const c = this._config, h = this._hass; if (!c || !h) return;
    const dark = this._isDark();
    const cs = c.counter && h.states[c.counter];
    const n = cs ? Math.max(0, parseInt(cs.state, 10) || 0) : 0;
    const wins = this._wins();
    const total = wins.length;
    const lang = (h.locale && h.locale.language) || "fr";
    const fmt = (d) => (d ? new Intl.DateTimeFormat(lang, { day: "numeric", month: "short" }).format(d) : "");
    const name = c.name || "";
    const imgOk = /^(\/|https?:\/\/)/.test(String(c.image || ""));
    const sent = Date.now() - this._sent < 4000;
    const shown = Math.min(n, 12);
    const stars = Array.from({ length: shown }, (_, i) => `<span class="st" style="--d:${(i * 0.37) % 2.2}s">★</span>`).join("") + (n > shown ? `<span class="plus">+${n - shown}</span>` : "");
    const recent = wins.slice(0, Math.max(0, Number(c.max_recent) || 0));
    const missing = !cs ? `<div class="warn"><ha-icon icon="mdi:alert-outline"></ha-icon>Compteur introuvable : ${esc(c.counter || "à choisir dans l'éditeur")}</div>` : "";

    const canKey = !!c.agent, canVoice = !!c.satellite;
    const tab = c.revisions ? (this._tab || (c.default_tab === "revisions" ? "revisions" : "histoires")) : "histoires";
    const rev = tab === "revisions";
    const weak = c.revisions ? this._weak() : [];
    const mat = this._curMat(weak);
    const revImgOk = /^(\/|https?:\/\/)/.test(String(c.revision_image || ""));
    const canRevVoice = canVoice && !!c.revision_script;
    let revBtn;
    if (this._chat) revBtn = "";
    else if (sent) revBtn = `<button class="go sent" disabled><ha-icon icon="mdi:check-circle"></ha-icon>Sire Gaspard t'attend sur la sphère !</button>`;
    else if (!canKey && !canRevVoice) revBtn = `<div class="warn"><ha-icon icon="mdi:alert-outline"></ha-icon>Renseigne l'agent (clavier) ou le script de révisions (sphère) dans l'éditeur.</div>`;
    else revBtn = `<div class="conf">${canRevVoice ? `<button class="go blue" data-act="rvoice"><ha-icon icon="mdi:speaker-wireless"></ha-icon>Sur la sphère</button>` : ""}${canKey ? `<button class="go blue" data-act="rkey"><ha-icon icon="mdi:keyboard-outline"></ha-icon>Au clavier</button>` : ""}</div>`;
    const revHtml = `
        <div class="hero rev" ${this._chat ? 'style="display:none"' : ""}>
          <div class="gav">${revImgOk ? `<img src="${esc(c.revision_image)}" alt="">` : `<ha-icon icon="mdi:shield-sword"></ha-icon>`}</div>
          <div class="ht"><div class="t">Hardi, écuyer !</div><small>Sire Gaspard t'attend pour une quête de révisions. Chaque bonne réponse fait reculer le dragon des Fautes.</small></div>
        </div>
        ${this._chat ? "" : `<div class="mats">${REV_SUBJECTS.filter((x) => x[0] !== "faibles" || this._pre()).map((x) => `<button class="mat ${x[0] === mat ? "on" : ""}" data-mat="${x[0]}"><ha-icon icon="${x[2]}"></ha-icon>${esc(x[1])}${x[0] === "faibles" && weak.length ? `<em>${weak.length}</em>` : ""}</button>`).join("")}</div>`}
        ${revBtn}
        ${!this._chat && this._pre() ? (weak.length ? `<div class="sec">À revoir d'après Pronote</div><div class="list">${weak.slice(0, 4).map((w) => `
          <div class="win"><i class="${w.bad ? "bad" : "mid"}">${esc(w.abbr || "?")}</i><div class="wt"><b>${esc(w.subject)}</b><small>${esc(w.name)}</small></div><span class="wd">${esc(fmt(w.date))}</span></div>`).join("")}</div>`
          : `<div class="okmsg"><ha-icon icon="mdi:shield-check"></ha-icon>Aucun point faible ces ${Number(c.revision_days) || 30} derniers jours. Bravo !</div>`) : ""}`;
    let btn;
    if (this._chat) btn = "";
    else if (sent) btn = `<button class="go sent" disabled><ha-icon icon="mdi:check-circle"></ha-icon>C'est parti, écoute la sphère !</button>`;
    else if (n <= 0) btn = `<button class="go off" disabled><ha-icon icon="mdi:lock-outline"></ha-icon>Gagne un ${esc(c.level)} pour débloquer une histoire</button>`;
    else if (this._confirm) btn = `<div class="conf">${canVoice ? `<button class="go" data-act="voice"><ha-icon icon="mdi:speaker-wireless"></ha-icon>Sur la sphère</button>` : ""}${canKey ? `<button class="go" data-act="key"><ha-icon icon="mdi:keyboard-outline"></ha-icon>Au clavier</button>` : ""}<button class="no" data-act="no">Annuler</button></div>`;
    else btn = `<button class="go" data-act="go"><ha-icon icon="mdi:auto-fix"></ha-icon>Lancer une histoire bonus</button>`;

    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing:border-box; }
        ha-card.dark { --sb-text:#f4f6fb; --sb-muted:#a9afc0; --sb-bg:var(--g-bg-x,linear-gradient(160deg,#1b1e32 0%,#231f45 55%,#2a1f3a 100%));
          --sb-border:rgba(255,255,255,.14); --sb-shadow:0 .6em 2em rgba(0,0,0,.35); --sb-glass:rgba(255,255,255,.07); --sb-glass-b:rgba(255,255,255,.13);
          --sb-fill:rgba(255,255,255,.09); --sb-acc:var(--acc-ui-x,#ffcf40); --sb-gold:#ffd43b; --sb-ok:#3ddc84; --sb-bad:#ff6b6b; }
        ha-card.light { --sb-text:#1c2030; --sb-muted:#5d6477; --sb-bg:var(--g-bg-x,linear-gradient(160deg,#fbfaf4 0%,#f6f1e2 55%,#f1ecfa 100%));
          --sb-border:rgba(20,24,40,.12); --sb-shadow:0 .4em 1.4em rgba(20,24,40,.12); --sb-glass:rgba(255,255,255,.72); --sb-glass-b:rgba(20,24,40,.1);
          --sb-fill:rgba(20,24,40,.06); --sb-acc:var(--acc-ui-x,#c98a00); --sb-gold:#f2b705; --sb-ok:#1a9d55; --sb-bad:#d23c3c; }
        ha-card { display:flex; flex-direction:column; gap:12px; padding:16px; color:var(--sb-text); border-radius:24px; border:1px solid var(--sb-border);
          background:var(--sb-bg); box-shadow:var(--sb-shadow); overflow:hidden; position:relative; }
        ha-icon { --mdc-icon-size:1.1em; flex:none; }
        button { font:inherit; color:inherit; cursor:pointer; border:0; background:none; padding:0; -webkit-tap-highlight-color:transparent; }
        .head { display:flex; align-items:center; gap:12px; }
        .av { width:48px; height:48px; border-radius:50%; flex:none; display:grid; place-items:center; overflow:hidden; background:var(--sb-fill); border:2px solid var(--sb-gold); color:var(--sb-gold); }
        .av img { width:100%; height:100%; object-fit:cover; } .av ha-icon { --mdc-icon-size:26px; }
        .hn { flex:1; min-width:0; } .hn b { font-size:1.15em; font-weight:700; display:block; } .hn small { color:var(--sb-muted); font-size:.8em; }
        .chip { display:inline-flex; align-items:center; gap:4px; padding:.3em .7em; border-radius:2em; font-size:.78em; font-weight:650; background:var(--sb-glass); border:1px solid var(--sb-glass-b); color:var(--sb-acc); white-space:nowrap; }
        .hero { display:flex; align-items:center; gap:14px; padding:14px; border-radius:18px; background:var(--sb-glass); border:1px solid var(--sb-glass-b);
          -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); position:relative; overflow:hidden; }
        .hero::before { content:""; position:absolute; inset:-40%; background:radial-gradient(circle at 25% 50%, color-mix(in srgb,var(--sb-gold) ${n > 0 ? 22 : 6}%,transparent), transparent 55%); pointer-events:none; }
        .big { position:relative; width:86px; height:86px; flex:none; display:grid; place-items:center; }
        .big .s { position:absolute; inset:0; color:var(--sb-gold); font-size:86px; line-height:86px; text-align:center; filter:drop-shadow(0 0 ${n > 0 ? 10 : 0}px color-mix(in srgb,var(--sb-gold) 60%,transparent)); ${n > 0 ? "animation:pulse 2.6s ease-in-out infinite;" : "opacity:.25;"} }
        .big b { position:relative; font-size:1.9em; font-weight:900; color:${dark ? "#2a1f3a" : "#5a3d00"}; margin-top:6px; }
        @keyframes pulse { 0%,100% { transform:scale(1) rotate(0deg); } 50% { transform:scale(1.07) rotate(-4deg); } }
        .ht { position:relative; flex:1; min-width:0; display:flex; flex-direction:column; gap:6px; }
        .ht .t { font-size:1.05em; font-weight:700; } .ht .t em { font-style:normal; color:var(--sb-acc); }
        .row { display:flex; flex-wrap:wrap; gap:2px; align-items:center; min-height:1.2em; }
        .st { color:var(--sb-gold); font-size:1.05em; animation:tw 2.2s ease-in-out infinite; animation-delay:var(--d); }
        @keyframes tw { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.45; transform:scale(.8); } }
        .plus { font-size:.8em; font-weight:800; color:var(--sb-acc); margin-left:4px; }
        .ht small { color:var(--sb-muted); font-size:.78em; }
        .go { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:.85em 1em; border-radius:16px; font-weight:750; font-size:.95em;
          background:linear-gradient(135deg, var(--sb-gold), color-mix(in srgb,var(--sb-gold) 70%,#ff8a3d)); color:#3a2600; box-shadow:0 .3em 1em color-mix(in srgb,var(--sb-gold) 35%,transparent); transition:transform .12s; }
        .go:active { transform:scale(.98); }
        .go.off { background:var(--sb-fill); color:var(--sb-muted); box-shadow:none; cursor:default; font-weight:600; }
        .go.sent { background:color-mix(in srgb,var(--sb-ok) 22%,transparent); color:var(--sb-ok); box-shadow:none; }
        .conf { display:flex; gap:8px; } .conf .go { flex:1; } .no { padding:0 1.1em; border-radius:16px; background:var(--sb-fill); color:var(--sb-muted); font-weight:650; }
        .sec { font-size:.78em; font-weight:700; color:var(--sb-muted); text-transform:uppercase; letter-spacing:.06em; margin:2px 2px -4px; }
        .list { display:flex; flex-direction:column; gap:6px; }
        .win { display:flex; align-items:center; gap:10px; padding:.55em .75em; border-radius:14px; background:var(--sb-glass); border:1px solid var(--sb-glass-b); }
        .win i { font-style:normal; font-weight:800; font-size:.78em; color:#fff; background:#1f9d55; border-radius:7px; padding:.15em .45em; flex:none; }
        .win .wt { flex:1; min-width:0; display:flex; flex-direction:column; } .win .wt b { font-size:.88em; }
        .win .wt small { color:var(--sb-muted); font-size:.75em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .win .wd { color:var(--sb-muted); font-size:.75em; white-space:nowrap; } .win .gift { color:var(--sb-gold); --mdc-icon-size:1.15em; }
        .tabs { display:flex; gap:4px; padding:4px; border-radius:14px; background:var(--sb-fill); }
        .tab { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:.5em .7em; border-radius:10px; font-size:.85em; font-weight:650; color:var(--sb-muted); }
        .tab.on { background:var(--sb-glass); color:var(--sb-text); border:1px solid var(--sb-glass-b); box-shadow:0 1px 4px rgba(0,0,0,.12); }
        .tab.on ha-icon { color:var(--sb-gold); }
        .tab em { font-style:normal; font-size:.75em; min-width:1.5em; padding:0 .35em; border-radius:1em; background:var(--sb-gold); color:#3a2600; line-height:1.5em; text-align:center; }
        .tab em.w { background:#f0a020; color:#fff; }
        .hero.rev::before { background:radial-gradient(circle at 20% 50%, color-mix(in srgb,#5fa8ff 22%,transparent), transparent 55%); }
        .gav { position:relative; width:76px; height:76px; flex:none; border-radius:50%; display:grid; place-items:center; overflow:hidden; background:color-mix(in srgb,#5fa8ff 18%,transparent); border:2px solid #5fa8ff; color:#5fa8ff; }
        .gav img { width:100%; height:100%; object-fit:cover; } .gav ha-icon { --mdc-icon-size:40px; }
        .mats { display:flex; flex-wrap:wrap; gap:6px; }
        .mat { display:inline-flex; align-items:center; gap:5px; padding:.45em .8em; border-radius:2em; font-size:.82em; font-weight:650; background:var(--sb-glass); border:1px solid var(--sb-glass-b); color:var(--sb-muted); }
        .mat.on { color:#fff; background:linear-gradient(135deg,#3d8bff,#6a5cff); border-color:transparent; }
        .mat em { font-style:normal; font-size:.78em; min-width:1.4em; border-radius:1em; background:#f0a020; color:#fff; text-align:center; line-height:1.4em; }
        .go.blue { background:linear-gradient(135deg,#3d8bff,#6a5cff); color:#fff; box-shadow:0 .3em 1em rgba(61,139,255,.35); }
        .win i.mid { background:#f0a020; } .win i.bad { background:#e0524f; }
        .okmsg { display:flex; align-items:center; gap:8px; font-size:.85em; color:var(--sb-ok); padding:.4em .2em; }
        .ends { display:flex; justify-content:center; gap:18px; }
        .chat { display:flex; flex-direction:column; gap:8px; }
        .msgs { display:flex; flex-direction:column; gap:8px; max-height:420px; overflow-y:auto; padding:2px; scrollbar-width:thin; }
        .m { max-width:86%; padding:.6em .8em; border-radius:16px; font-size:.9em; line-height:1.4; white-space:pre-wrap; word-wrap:break-word; }
        .m.ai { align-self:flex-start; background:var(--sb-glass); border:1px solid var(--sb-glass-b); border-bottom-left-radius:5px; }
        .m.me { align-self:flex-end; background:linear-gradient(135deg, var(--sb-gold), color-mix(in srgb,var(--sb-gold) 70%,#ff8a3d)); color:#3a2600; border-bottom-right-radius:5px; font-weight:600; }
        .m.err { color:var(--sb-bad); }
        .typing { align-self:flex-start; display:flex; gap:4px; padding:.7em .9em; border-radius:16px; background:var(--sb-glass); border:1px solid var(--sb-glass-b); }
        .typing span { width:7px; height:7px; border-radius:50%; background:var(--sb-gold); animation:tw 1s infinite; } .typing span:nth-child(2) { animation-delay:.2s; } .typing span:nth-child(3) { animation-delay:.4s; }
        .inp { display:flex; gap:8px; }
        .inp input { flex:1; min-width:0; font:inherit; font-size:.95em; color:var(--sb-text); background:var(--sb-glass); border:1px solid var(--sb-glass-b); border-radius:14px; padding:.7em .9em; outline:none; }
        .inp input:focus { border-color:var(--sb-gold); }
        .send { width:3em; border-radius:14px; display:grid; place-items:center; background:linear-gradient(135deg, var(--sb-gold), color-mix(in srgb,var(--sb-gold) 70%,#ff8a3d)); color:#3a2600; }
        .send:disabled { opacity:.5; }
        .chips2 { display:flex; gap:6px; flex-wrap:wrap; } .chips2 button { padding:.35em .8em; border-radius:2em; font-size:.8em; font-weight:700; background:var(--sb-fill); color:var(--sb-acc); }
        .end { align-self:center; font-size:.8em; color:var(--sb-muted); text-decoration:underline; }
        .warn { display:flex; gap:6px; align-items:center; color:var(--sb-bad); font-size:.82em; }
      </style>
      <ha-card class="${dark ? "dark" : "light"}" style="${gvStyle(c, dark)}">
        <div class="head">
          <div class="av">${imgOk ? `<img src="${esc(c.image)}" alt="">` : `<ha-icon icon="mdi:book-open-page-variant"></ha-icon>`}</div>
          <div class="hn"><b>${rev ? "Révisions" : esc(c.title)}</b><small>${name ? esc(name) + " · " : ""}${rev ? "avec Sire Gaspard · " + esc(c.niveau) : "1 " + esc(c.level) + " = 1 histoire"}</small></div>
          ${this._pre() && !rev ? `<span class="chip"><ha-icon icon="mdi:star-check"></ha-icon>${total} ${esc(c.level)}</span>` : ""}
        </div>
        ${c.revisions && !this._chat ? `<div class="tabs"><button class="tab ${!rev ? "on" : ""}" data-tab="histoires"><ha-icon icon="mdi:star-shooting"></ha-icon>Histoires${n > 0 ? `<em>${n}</em>` : ""}</button><button class="tab ${rev ? "on" : ""}" data-tab="revisions"><ha-icon icon="mdi:sword"></ha-icon>Révisions${weak.length ? `<em class="w">${weak.length}</em>` : ""}</button></div>` : ""}
        ${rev ? revHtml : `${missing}
        <div class="hero" ${this._chat ? 'style="display:none"' : ""}>
          <div class="big"><span class="s">★</span><b>${n}</b></div>
          <div class="ht">
            <div class="t">${n > 0 ? `<em>${n}</em> histoire${n > 1 ? "s" : ""} à raconter !` : "Pas d'histoire en réserve"}</div>
            <div class="row">${stars || `<small>Chaque ${esc(c.level)} te fait gagner une étoile.</small>`}</div>
            <small>${n > 0 ? "Tu inventes le héros, le monde et l'aventure." : "Prochaine histoire au prochain " + esc(c.level) + " !"}</small>
          </div>
        </div>
        ${btn}
        ${!this._chat && recent.length ? `<div class="sec">Derniers ${esc(c.level)} gagnés</div><div class="list">${recent.map((w) => `
          <div class="win"><i>${esc(c.level)}</i><div class="wt"><b>${esc(w.subject)}</b><small>${esc(w.name)}</small></div><span class="wd">${esc(fmt(w.date))}</span><ha-icon class="gift" icon="mdi:star-plus"></ha-icon></div>`).join("")}</div>` : ""}`}
        ${this._chat ? this._chatHtml() : ""}
      </ha-card>`;

    const r = this.shadowRoot;
    const on = (sel, f) => { const el = r.querySelector(sel); if (el) el.addEventListener("click", f); };
    on('[data-act="go"]', () => {
      if (c.confirm || (canKey && canVoice)) { this._confirm = true; this._render(); }
      else this._launch(canKey ? "clavier" : "voice");
    });
    on('[data-act="yes"]', () => this._launch());
    on('[data-act="voice"]', () => this._launch("voice"));
    on('[data-act="key"]', () => this._launch("clavier"));
    r.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { this._tab = b.dataset.tab; this._confirm = false; this._render(); }));
    r.querySelectorAll("[data-mat]").forEach((b) => b.addEventListener("click", () => { this._mat = b.dataset.mat; this._render(); }));
    on('[data-act="rvoice"]', () => this._revise("voice"));
    on('[data-act="rkey"]', () => this._revise("clavier"));
    on('[data-act="fini"]', () => this._ask("j'ai fini"));
    on('[data-act="end"]', () => { this._chat = null; this._draft = ""; this._sig = ""; this._render(); });
    r.querySelectorAll("[data-choice]").forEach((b) => b.addEventListener("click", () => this._ask(b.dataset.choice)));
    const inp = r.querySelector(".inp input");
    if (inp) {
      inp.value = this._draft;
      inp.addEventListener("input", () => { this._draft = inp.value; });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this._ask(inp.value); } });
      if (!this._chat.busy) setTimeout(() => inp.focus(), 0);
    }
    on('[data-act="send"]', () => { const i = r.querySelector(".inp input"); if (i) this._ask(i.value); });
    const ms = r.querySelector(".msgs"); if (ms) ms.scrollTop = ms.scrollHeight;
    on('[data-act="no"]', () => { this._confirm = false; this._render(); });
  }
}

/* ---------- Éditeur visuel ---------- */
const LABELS = { ...GV_LABELS,
  counter: "Compteur d'histoires bonus", revisions: "Onglet Révisions (Sire Gaspard)", revision_script: "Script de révisions sur la sphère",
  revision_image: "Image de Sire Gaspard", niveau: "Niveau scolaire", revision_days: "Points faibles Pronote sur (jours)", default_tab: "Onglet à l'ouverture", agent: "Conteur pour le mode clavier (agent de conversation)", age: "Âge de l'enfant", script: "Script qui lance l'histoire", satellite: "Sphère / satellite qui raconte",
  pronote: "Capteur Pronote de l'enfant (facultatif, pour les derniers A+)", name: "Prénom affiché", image: "Personnage ou photo (ex. /local/image/pixel.png)",
  title: "Titre", level: "Compétence qui rapporte une histoire", max_recent: "Derniers A+ affichés", confirm: "Demander une confirmation", theme: "Thème",
};

class StoryBonusCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...DEFAULTS, ...config }; if (!this._form) this._build(); else this._form.data = this._config; }
  set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }
  _build() {
    this._form = document.createElement("ha-form");
    this._form.hass = this._hass; this._form.data = this._config;
    this._form.computeLabel = (s) => LABELS[s.name] || s.name;
    this._form.schema = [
      { name: "counter", selector: { entity: { domain: ["counter", "input_number", "sensor"] } } },
      { name: "script", selector: { entity: { domain: "script" } } },
      { name: "satellite", selector: { entity: { domain: "assist_satellite" } } },
      { type: "grid", name: "", schema: [
        { name: "agent", selector: { entity: { domain: "conversation" } } },
        { name: "age", selector: { number: { min: 4, max: 18, mode: "box" } } }] },
      { name: "pronote", selector: { entity: { domain: "sensor", integration: "pronote" } } },
      { type: "grid", name: "", schema: [{ name: "name", selector: { text: {} } }, { name: "title", selector: { text: {} } }] },
      { name: "image", selector: { text: {} } },
      { type: "grid", name: "", schema: [
        { name: "level", selector: { select: { mode: "dropdown", options: ["A+", "A", "B", "C"] } } },
        { name: "max_recent", selector: { number: { min: 0, max: 10, mode: "box" } } }] },
      { name: "confirm", selector: { boolean: {} } },
      { name: "revisions", selector: { boolean: {} } },
      { name: "revision_script", selector: { entity: { domain: "script" } } },
      { name: "revision_image", selector: { text: {} } },
      { type: "grid", name: "", schema: [
        { name: "niveau", selector: { select: { mode: "dropdown", options: ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e"] } } },
        { name: "revision_days", selector: { number: { min: 7, max: 120, mode: "box" } } }] },
      { name: "default_tab", selector: { select: { mode: "dropdown", options: [{ value: "histoires", label: "Histoires" }, { value: "revisions", label: "Révisions" }] } } },
      { name: "theme", selector: { select: { mode: "dropdown", options: [{ value: "auto", label: "Automatique (thème de Home Assistant)" }, { value: "light", label: "Clair" }, { value: "dark", label: "Sombre" }] } } },
      ...GV_FIELDS,
    ];
    this._form.addEventListener("value-changed", (ev) => {
      this._config = { ...this._config, ...ev.detail.value };
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    });
    this.appendChild(this._form);
  }
}

customElements.define("story-bonus-card", StoryBonusCard);
customElements.define("story-bonus-card-editor", StoryBonusCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "story-bonus-card",
  name: "Story Bonus Card (FR)",
  description: "Histoires bonus gagnées grâce aux A+ de Pronote et révisions avec Sire Gaspard, sur la sphère ou au clavier.",
  preview: true,
});

console.info(
  `%c STORY-BONUS-CARD %c v${CARD_VERSION} `,
  "color:#3a2600;background:#ffd43b;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px",
  "color:#c98a00;background:#fff;font-weight:700;border-radius:0 3px 3px 0;padding:2px 4px"
);
}
