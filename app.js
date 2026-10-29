const toast = document.getElementById("toast");
let toastTimer;
function notify(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3400);
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
  const query = document.getElementById("searchInput").value.trim();
  if (!query) {
    document.getElementById("searchInput").focus();
    notify("Écris un mot-clé pour commencer ta recherche.");
    return;
  }
  const listings = document.getElementById("explorer");
  listings.scrollIntoView({ behavior: "smooth" });
  notify("La recherche de « " + query + " » sera disponible dès l'activation du catalogue.");
});

document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".category-card").forEach(item => {
      item.classList.remove("active");
      item.setAttribute("aria-pressed", "false");
    });
    card.classList.add("active");
    card.setAttribute("aria-pressed", "true");
    document.getElementById("searchInput").value = card.dataset.category || "";
    document.getElementById("explorer").scrollIntoView({ behavior: "smooth" });
    notify("Catégorie choisie : " + card.dataset.category + ". Le catalogue sera connecté à Supabase à l'étape suivante.");
  });
});

["loginBtn", "startSellingBtn", "emptyStartBtn", "bannerStartBtn"].forEach(id => {
  document.getElementById(id)?.addEventListener("click", () => {
    notify("L'inscription et la connexion seront activées à l'étape Supabase. Aucun compte n'a été créé pour l'instant.");
  });
});