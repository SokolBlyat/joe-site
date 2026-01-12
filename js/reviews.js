const DATA_URL = "/data/reviews.json";

const els = {
    meta: document.getElementById("meta"),
    q: document.getElementById("q"),
    sort: document.getElementById("sort"),
    list: document.getElementById("list"),
    error: document.getElementById("error"),
};

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function parseDate(s) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

function sortReviews(items, mode) {
    const copy = [...items];
    if (mode === "rating") {
        copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (mode === "title") {
        copy.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    } else {
        // newest watched (fallback to created order)
        copy.sort((a, b) => {
            const da = parseDate(a.watchedOn)?.getTime() ?? 0;
            const db = parseDate(b.watchedOn)?.getTime() ?? 0;
            return db - da;
        });
    }
    return copy;
}

function matchesQuery(r, q) {
    if (!q) return true;
    const hay = [
        r.title,
        r.year,
        r.summary,
        ...(r.tags || [])
    ].join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
}

function render(items, meta) {
    els.meta.textContent = `Updated: ${meta.updated} • ${items.length} review(s)`;

    if (!items.length) {
        els.list.innerHTML = `<p class="muted">No reviews found.</p>`;
        return;
    }

    els.list.innerHTML = items.map(r => {
        const tags = (r.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
        const watched = r.watchedOn ? `<div class="muted">Watched: ${escapeHtml(r.watchedOn)}</div>` : "";
        return `
      <article class="card">
        <div class="card-head">
          <h2>${escapeHtml(r.title)} <span class="muted">(${escapeHtml(r.year ?? "")})</span></h2>
          <div class="rating">${escapeHtml(r.rating ?? "—")}/10</div>
        </div>
        ${watched}
        <p>${escapeHtml(r.summary ?? "")}</p>
        <div class="tags">${tags}</div>
      </article>
    `;
    }).join("");
}

async function main() {
    try {
        const res = await fetch(DATA_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load ${DATA_URL} (${res.status})`);
        const data = await res.json();

        const all = Array.isArray(data.reviews) ? data.reviews : [];
        const meta = { updated: data.updated ?? "unknown" };

        function refresh() {
            const q = els.q.value.trim();
            const filtered = all.filter(r => matchesQuery(r, q));
            const sorted = sortReviews(filtered, els.sort.value);
            render(sorted, meta);
        }

        els.q.addEventListener("input", refresh);
        els.sort.addEventListener("change", refresh);
        refresh();
    } catch (e) {
        els.error.hidden = false;
        els.error.textContent = String(e?.message ?? e);
    }
}

main();
