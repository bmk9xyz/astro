(() => {
  const script = document.currentScript;
  const siteToken = script?.dataset.site || script?.dataset.repository || "site_7eee1e17d3024b67ad1f115efdbb5db9";
  const apiOrigin = (script?.dataset.api || "http://localhost:8787").replace(/\/$/, "");
  const accent = /^#[0-9a-f]{3,8}$/i.test(script?.dataset.accent || "") ? script.dataset.accent : "#2563eb";
  const renderedAt = Date.now();
  const roots = Array.from(document.querySelectorAll("[data-git-cms-comments]"));
  if (!roots.length) return;
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
  const pageFor = (root) => root.dataset.page || window.location.pathname + window.location.search || "/";
  const normalizePage = (value) => {
    try {
      if (/^https?:\/\//i.test(value)) {
        const url = new URL(value);
        return (url.pathname || "/") + (url.search || "");
      }
    } catch {}
    return String(value || "/").startsWith("/") ? String(value || "/") : "/" + String(value || "/");
  };
  const render = (root, comments) => {
    const page = normalizePage(pageFor(root));
    const pageComments = comments.filter((comment) => normalizePage(comment.page) === page);
    root.innerHTML = `
      <section class="git-cms-comments" style="display:grid;gap:16px;border-top:1px solid #e2e8f0;padding-top:16px;">
        <div style="display:grid;gap:8px;">
          <h2 style="margin:0;font-size:20px;line-height:1.3;">Comments</h2>
          <div data-comments-list aria-live="polite" style="display:grid;gap:10px;">
            ${pageComments.length ? pageComments.map((comment) => `
              <article style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#fff;">
                <p style="margin:0 0 6px;font-weight:600;color:#0f172a;">${escapeHtml(comment.authorName)}</p>
                <p style="margin:0;color:#334155;white-space:pre-wrap;">${escapeHtml(comment.body)}</p>
              </article>
            `).join("") : `<p style="margin:0;color:#64748b;">No comments yet.</p>`}
          </div>
        </div>
        <form data-comments-form style="display:grid;gap:10px;">
          <input name="website" autocomplete="off" tabindex="-1" aria-hidden="true" style="position:absolute;left:-9999px;" />
          <input name="authorName" required maxlength="120" autocomplete="name" placeholder="Name" style="border:1px solid #cbd5e1;border-radius:8px;padding:10px;font:inherit;" />
          <input name="authorEmail" type="email" maxlength="200" autocomplete="email" placeholder="Email (optional)" style="border:1px solid #cbd5e1;border-radius:8px;padding:10px;font:inherit;" />
          <textarea name="body" required maxlength="5000" placeholder="Comment" style="min-height:96px;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font:inherit;"></textarea>
          <button type="submit" style="min-height:40px;border:0;border-radius:8px;background:${escapeHtml(accent)};color:#fff;font-weight:600;cursor:pointer;">Post comment</button>
          <p data-comments-message style="margin:0;color:#64748b;font-size:14px;"></p>
        </form>
      </section>`;
    const form = root.querySelector("[data-comments-form]");
    const message = root.querySelector("[data-comments-message]");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      if (String(formData.get("website") || "").trim()) return;
      message.textContent = "Sending...";
      try {
        const response = await fetch(`${apiOrigin}/api/repositories/public-comments/${encodeURIComponent(siteToken)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page,
            authorName: String(formData.get("authorName") || ""),
            authorEmail: String(formData.get("authorEmail") || ""),
            body: String(formData.get("body") || ""),
            website: String(formData.get("website") || ""),
            renderedAt
          })
        });
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Cannot post comment.");
        form.reset();
        message.textContent = "Comment sent. It will appear after approval.";
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : "Cannot post comment.";
      }
    });
  };
  const renderUnavailable = (root, message) => {
    root.innerHTML = `
      <section class="git-cms-comments" style="border-top:1px solid #e2e8f0;padding-top:16px;">
        <p style="margin:0;color:#64748b;font-size:14px;">${escapeHtml(message || "Comments are not available for this site.")}</p>
      </section>`;
  };
  const loadComments = (page) => fetch(`${apiOrigin}/api/repositories/public-comments/${encodeURIComponent(siteToken)}?page=${encodeURIComponent(page)}`, { cache: "no-cache" })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      return response.ok ? data : { comments: [], error: data.error || "Comments are not available for this site." };
    })
    .catch(() => ({ comments: [] }));
  roots.forEach((root) => {
    const page = normalizePage(pageFor(root));
    loadComments(page).then((data) => {
      if (data.error || data.enabled === false) renderUnavailable(root, data.error || "Comments are disabled for this site.");
      else render(root, Array.isArray(data.comments) ? data.comments : []);
    });
  });
})();
