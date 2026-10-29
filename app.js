const toast = document.getElementById("toast");
let toastTimer;
let supabaseClient = null;
let authMode = "signup";
let currentUser = null;

function notify(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3800);
}
function setAuthMessage(message, isError = false) {
  const node = document.getElementById("authMessage");
  if (node) {
    node.textContent = message;
    node.style.color = isError ? "#b42318" : "#6840c6";
  }
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
function openAuth(mode = "signup") {
  authMode = mode;
  const overlay = document.getElementById("authOverlay");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  updateAuthMode();
  setAuthMessage("");
}
function closeAuth() {
  document.getElementById("authOverlay").hidden = true;
  document.body.style.overflow = "";
}
function updateAuthMode() {
  const signup = authMode === "signup";
  document.getElementById("authTitle").textContent = signup ? "Rejoins Kreyatif Hub" : "Content de te revoir";
  document.getElementById("authNameLabel").hidden = !signup;
  document.getElementById("authPassword").autocomplete = signup ? "new-password" : "current-password";
  document.getElementById("authSubmit").textContent = signup ? "Créer mon compte" : "Me connecter";
  document.querySelectorAll("[data-auth-mode]").forEach(button => button.classList.toggle("active", button.dataset.authMode === authMode));
}
function showListingsMessage(title, message) {
  const container = document.querySelector(".empty-state");
  if (!container) return;
  container.innerHTML = '<div class="empty-illustration">✳</div><h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(message) + '</p>';
}
function renderListings(rows) {
  const section = document.querySelector(".listings-section");
  const oldGrid = document.getElementById("listingGrid");
  if (oldGrid) oldGrid.remove();
  const empty = section?.querySelector(".empty-state");
  if (!section) return;
  if (!rows.length) {
    if (empty) empty.hidden = false;
    showListingsMessage("La vitrine se prépare", "Aucune annonce publiée pour le moment. Les offres approuvées apparaîtront ici automatiquement.");
    return;
  }
  if (empty) empty.hidden = true;
  const grid = document.createElement("div");
  grid.id = "listingGrid";
  grid.className = "listing-grid";
  grid.innerHTML = rows.map(item => {
    const image = item.image_url ? '<img src="' + escapeHtml(item.image_url) + '" alt="' + escapeHtml(item.title || "Création") + '" loading="lazy">' : '<div class="listing-placeholder">✳</div>';
    const price = item.price !== null && item.price !== undefined && item.price !== "" ? '<span class="listing-price">' + escapeHtml(item.price) + '</span>' : '<span class="listing-price">Sur demande</span>';
    return '<article class="listing-card">' + image + '<div class="listing-card-body"><span class="listing-category">' + escapeHtml(item.category || item.listing_type || "Création") + '</span><h3>' + escapeHtml(item.title || "Offre créative") + '</h3><p>' + escapeHtml(item.description || "Découvre cette offre sur Kreyatif Hub.") + '</p><div class="listing-card-bottom">' + price + '<button class="btn btn-outline listing-contact" type="button" data-listing-title="' + escapeHtml(item.title || "cette offre") + '">En savoir plus</button></div></div></article>';
  }).join("");
  section.appendChild(grid);
  grid.querySelectorAll(".listing-contact").forEach(button => button.addEventListener("click", () => notify("La messagerie acheteur-vendeur sera ajoutée à la prochaine étape. Offre : " + button.dataset.listingTitle)));
}
async function loadListings() {
  if (!supabaseClient) {
    showListingsMessage("Configuration Supabase requise", "Le client Supabase n'a pas pu démarrer. Vérifie la configuration publique et les règles RLS.");
    return;
  }
  try {
    const { data, error } = await supabaseClient.from("listings").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(24);
    if (error) throw error;
    renderListings(data || []);
  } catch (error) {
    console.error("Kreyatif Hub listings:", error);
    showListingsMessage("Le catalogue arrive", "Impossible de charger les annonces pour le moment. Vérifie la table listings, la colonne status et sa politique RLS de lecture publique.");
  }
}
function updateUserUI(user) {
  currentUser = user || null;
  const loginButton = document.getElementById("loginBtn");
  if (loginButton) loginButton.textContent = currentUser ? "Déconnexion" : "Connexion";
  const sellButton = document.getElementById("startSellingBtn");
  if (sellButton) sellButton.textContent = currentUser ? "Ma boutique ↗" : "Vendre gratuitement ↗";
}

document.getElementById("year").textContent = new Date().getFullYear();
const menuToggle = document.getElementById("menuToggle");
const nav = document.querySelector(".main-nav");
menuToggle?.addEventListener("click", () => {
  const opened = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(opened));
  menuToggle.setAttribute("aria-label", opened ? "Fermer le menu" : "Ouvrir le menu");
});
nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => nav.classList.remove("open")));

document.getElementById("searchForm")?.addEventListener("submit", event => {
  event.preventDefault();
  const query = document.getElementById("searchInput").value.trim().toLocaleLowerCase("fr");
  if (!query) {
    document.getElementById("searchInput").focus();
    notify("Écris un mot-clé pour commencer ta recherche.");
    return;
  }
  const cards = [...document.querySelectorAll(".listing-card")];
  let count = 0;
  cards.forEach(card => {
    const matches = card.textContent.toLocaleLowerCase("fr").includes(query);
    card.hidden = !matches;
    if (matches) count++;
  });
  document.getElementById("explorer").scrollIntoView({ behavior: "smooth" });
  if (!cards.length) notify("Les annonces sont chargées depuis Supabase dès qu'elles sont publiées.");
  else notify(count + " résultat(s) pour « " + query + " ».");
});
document.querySelectorAll(".category-card").forEach(card => {
  card.setAttribute("aria-pressed", "false");
  card.addEventListener("click", () => {
    document.querySelectorAll(".category-card").forEach(item => {
      item.classList.remove("active");
      item.setAttribute("aria-pressed", "false");
    });
    card.classList.add("active");
    card.setAttribute("aria-pressed", "true");
    document.getElementById("searchInput").value = card.dataset.category || "";
    document.getElementById("searchForm").requestSubmit();
  });
});

document.getElementById("loginBtn")?.addEventListener("click", async () => {
  if (currentUser && supabaseClient) {
    const { error } = await supabaseClient.auth.signOut();
    if (error) notify("Déconnexion impossible : " + error.message);
    else notify("Tu es déconnecté.");
  } else openAuth("login");
});
["startSellingBtn", "emptyStartBtn", "bannerStartBtn"].forEach(id => {
  document.getElementById(id)?.addEventListener("click", () => {
    if (!currentUser) {
      openAuth("signup");
      return;
    }
    notify("Ton compte est connecté. La création de boutique sera activée dans la prochaine étape.");
  });
});
document.getElementById("authClose")?.addEventListener("click", closeAuth);
document.getElementById("authOverlay")?.addEventListener("click", event => {
  if (event.target.id === "authOverlay") closeAuth();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !document.getElementById("authOverlay").hidden) closeAuth();
});
document.querySelectorAll("[data-auth-mode]").forEach(button => button.addEventListener("click", () => {
  authMode = button.dataset.authMode;
  updateAuthMode();
  setAuthMessage("");
}));
document.getElementById("authForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!supabaseClient) {
    setAuthMessage("Supabase n'est pas configuré. Recharge la page ou vérifie la connexion.", true);
    return;
  }
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const displayName = document.getElementById("authName").value.trim();
  const submit = document.getElementById("authSubmit");
  submit.disabled = true;
  submit.textContent = "Patiente...";
  setAuthMessage("");
  try {
    if (authMode === "signup") {
      const { data, error } = await supabaseClient.auth.signUp({
        email, password,
        options: { data: { display_name: displayName || email.split("@")[0] } }
      });
      if (error) throw error;
      if (data.session) {
        closeAuth();
        notify("Compte créé et connecté. Bienvenue sur Kreyatif Hub !");
      } else {
        setAuthMessage("Inscription envoyée. Vérifie ta boîte e-mail pour confirmer ton compte avant de te connecter.");
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      closeAuth();
      notify("Connexion réussie. Bienvenue !");
    }
  } catch (error) {
    setAuthMessage(error.message || "Une erreur est survenue. Réessaie.", true);
  } finally {
    submit.disabled = false;
    updateAuthMode();
  }
});

(async function initSupabase() {
  try {
    if (!window.supabase?.createClient || !window.KREYATIF_SUPABASE_URL || !window.KREYATIF_SUPABASE_PUBLIC_KEY) {
      throw new Error("Client ou configuration Supabase manquant.");
    }
    supabaseClient = window.supabase.createClient(window.KREYATIF_SUPABASE_URL, window.KREYATIF_SUPABASE_PUBLIC_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data } = await supabaseClient.auth.getSession();
    updateUserUI(data.session?.user || null);
    supabaseClient.auth.onAuthStateChange((_event, session) => updateUserUI(session?.user || null));
    await loadListings();
  } catch (error) {
    console.error("Kreyatif Hub Supabase init:", error);
    showListingsMessage("Connexion à configurer", "Le site n'a pas pu initialiser Supabase. Vérifie que le client et la clé publique sont bien chargés.");
  }
})();