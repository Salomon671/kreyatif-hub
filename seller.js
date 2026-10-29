
(() => {
  const overlay = document.getElementById("shopOverlay");
  const form = document.getElementById("shopForm");
  const status = document.getElementById("shopStatus");
  const submit = document.getElementById("shopSubmit");
  if (!overlay || !form) return;
  let client = null;
  const setStatus = (message, type = "") => {
    status.textContent = message;
    status.className = "shop-status" + (type ? " " + type : "");
  };
  const open = async () => {
    if (!window.KREYATIF_SUPABASE_URL || !window.KREYATIF_SUPABASE_PUBLIC_KEY || !window.supabase?.createClient) {
      if (typeof notify === "function") notify("La connexion à Supabase n'est pas configurée.");
      return;
    }
    client ||= window.supabase.createClient(window.KREYATIF_SUPABASE_URL, window.KREYATIF_SUPABASE_PUBLIC_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) {
      document.getElementById("authOverlay").hidden = false;
      document.body.style.overflow = "hidden";
      document.querySelector('[data-auth-mode="signup"]')?.click();
      return;
    }
    const { data: existing, error } = await client.from("shops").select("id,name,slug,status").eq("owner_id", session.user.id).maybeSingle();
    if (!error && existing) {
      setStatus("Tu as déjà une boutique : " + existing.name + " (statut : " + existing.status + ").", "success");
      form.querySelector("button[type=submit]").hidden = true;
      form.querySelectorAll("input,textarea").forEach(el => el.disabled = true);
    } else {
      form.reset();
      form.querySelector("button[type=submit]").hidden = false;
      form.querySelectorAll("input,textarea").forEach(el => el.disabled = false);
      setStatus("");
    }
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  };
  const close = () => { overlay.hidden = true; document.body.style.overflow = ""; };
  ["startSellingBtn","emptyStartBtn","bannerStartBtn"].forEach(id => document.getElementById(id)?.addEventListener("click", event => {
    event.preventDefault();
    open().catch(err => setStatus(err.message || "Impossible d'ouvrir le formulaire.", "error"));
  }));
  document.getElementById("shopClose")?.addEventListener("click", close);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !overlay.hidden) close(); });
  document.getElementById("shopName")?.addEventListener("input", e => {
    const slug = e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    document.getElementById("shopSlug").value = slug;
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    client ||= window.supabase.createClient(window.KREYATIF_SUPABASE_URL, window.KREYATIF_SUPABASE_PUBLIC_KEY);
    const { data: { session } } = await client.auth.getSession();
    if (!session?.user) { setStatus("Connecte-toi avant de créer ta boutique.", "error"); return; }
    const name = document.getElementById("shopName").value.trim();
    const slug = document.getElementById("shopSlug").value.trim();
    const description = document.getElementById("shopDescription").value.trim();
    if (!name || !slug) { setStatus("Ajoute le nom de ta boutique.", "error"); return; }
    submit.disabled = true;
    submit.textContent = "Création...";
    setStatus("");
    try {
      const { data: duplicate, error: checkError } = await client.from("shops").select("id").eq("slug", slug).maybeSingle();
      if (checkError && checkError.code !== "PGRST116") throw checkError;
      if (duplicate) throw new Error("Ce lien de boutique est déjà utilisé. Choisis un autre nom.");
      const { error } = await client.from("shops").insert({
        owner_id: session.user.id,
        name, slug, description: description || null, status: "pending"
      });
      if (error) throw error;
      setStatus("Demande envoyée ! Ta boutique est en attente de validation avant publication.", "success");
      submit.hidden = true;
      form.querySelectorAll("input,textarea").forEach(el => el.disabled = true);
    } catch (err) {
      console.error("Shop creation:", err);
      setStatus(err.message || "Création impossible. Vérifie les règles RLS de la table shops.", "error");
    } finally {
      submit.disabled = false;
      submit.textContent = "Envoyer ma demande";
    }
  });
})();
