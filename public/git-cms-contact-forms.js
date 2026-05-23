(() => {
  const script = document.currentScript;
  const siteToken = script?.dataset.site || script?.dataset.repository || "site_7eee1e17d3024b67ad1f115efdbb5db9";
  const apiOrigin = (script?.dataset.api || "http://localhost:8787").replace(/\/$/, "");
  const accent = /^#[0-9a-f]{3,8}$/i.test(script?.dataset.accent || "") ? script.dataset.accent : "#2563eb";
  const renderedAt = Date.now();
  const roots = Array.from(document.querySelectorAll("[data-git-cms-contact-form]"));
  if (!roots.length) return;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
  const defaultForm = (formName) => `
    <form data-git-cms-contact-form="${escapeHtml(formName)}" style="display:grid;gap:10px;">
      <input name="website" autocomplete="off" tabindex="-1" aria-hidden="true" style="position:absolute;left:-9999px;" />
      <input name="name" required maxlength="160" autocomplete="name" placeholder="Name" style="border:1px solid #cbd5e1;border-radius:8px;padding:10px;font:inherit;" />
      <input name="email" required type="email" maxlength="200" autocomplete="email" placeholder="Email" style="border:1px solid #cbd5e1;border-radius:8px;padding:10px;font:inherit;" />
      <input name="phone" maxlength="80" autocomplete="tel" placeholder="Phone (optional)" style="border:1px solid #cbd5e1;border-radius:8px;padding:10px;font:inherit;" />
      <textarea name="message" required maxlength="5000" placeholder="Message" style="min-height:110px;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font:inherit;"></textarea>
      <button type="submit" style="min-height:40px;border:0;border-radius:8px;background:${escapeHtml(accent)};color:#fff;font-weight:600;cursor:pointer;">Send</button>
      <p data-contact-form-message style="margin:0;color:#64748b;font-size:14px;"></p>
    </form>`;
  const formNameFor = (form) => form.dataset.gitCmsContactForm || form.getAttribute("name") || "contact";
  const pageFor = () => window.location.pathname + window.location.search || "/";
  const wireForm = (form) => {
    if (form.dataset.gitCmsContactReady === "1") return;
    form.dataset.gitCmsContactReady = "1";
    let message = form.querySelector("[data-contact-form-message]");
    if (!message) {
      message = document.createElement("p");
      message.setAttribute("data-contact-form-message", "");
      message.style.cssText = "margin:0;color:#64748b;font-size:14px;";
      form.appendChild(message);
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      if (String(formData.get("website") || "").trim()) return;
      message.textContent = "Sending...";
      const fields = {};
      formData.forEach((value, key) => {
        if (key !== "website") fields[key] = String(value).slice(0, 5000);
      });
      try {
        const response = await fetch(`${apiOrigin}/api/repositories/public-contact-forms/${encodeURIComponent(siteToken)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formName: formNameFor(form),
            page: pageFor(),
            fields,
            renderedAt
          })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Cannot submit form.");
        form.reset();
        message.textContent = "Thank you. Your message has been sent.";
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : "Cannot submit form.";
      }
    });
  };
  roots.forEach((root) => {
    if (root instanceof HTMLFormElement) wireForm(root);
    else {
      const formName = root.dataset.gitCmsContactForm || "contact";
      root.innerHTML = defaultForm(formName);
      const form = root.querySelector("form");
      if (form) wireForm(form);
    }
  });
})();
