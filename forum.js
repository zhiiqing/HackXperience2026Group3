const STORAGE_KEY = "forumPosts";

const CATEGORY_LABELS = {
  general: "General support",
  letters: "Letters Never Sent",
  vent: "Just venting",
  advice: "Asking for advice",
};

// Placeholder only - not real moderation, just so the demo has something to show.
const CRISIS_KEYWORDS = ["suicide", "kill myself", "end it all", "self harm", "self-harm"];

function seedPosts() {
  return [
    {
      id: crypto.randomUUID(),
      title: "First week of exams and I'm already drained",
      body: "Anyone else feel like the pressure just doesn't let up? Would love to hear how others cope.",
      category: "vent",
      anonymous: true,
      author: "Anonymous",
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      supportCount: 4,
    },
    {
      id: crypto.randomUUID(),
      title: "Letter to someone I never told",
      body: "I never got to say how much it hurt when you left without a word. I think I'm finally ready to let it go.",
      category: "letters",
      anonymous: true,
      author: "Anonymous",
      createdAt: Date.now() - 1000 * 60 * 60 * 20,
      supportCount: 11,
    },
  ];
}

function getPosts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedPosts();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw);
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function timeAgo(timestamp) {
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function mentionsCrisisLanguage(text) {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function toggleSupport(postId) {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return;
  post.supported = !post.supported;
  post.supportCount += post.supported ? 1 : -1;
  savePosts(posts);
  renderFeed();
}

function renderFeed() {
  const list = document.getElementById("post-list");
  if (!list) return;

  const posts = getPosts().sort((a, b) => b.createdAt - a.createdAt);

  if (posts.length === 0) {
    list.innerHTML = `<p class="loading-text">No posts yet — be the first to share.</p>`;
    return;
  }

  list.innerHTML = posts
    .map((post) => {
      const banner = mentionsCrisisLanguage(post.body)
        ? `<div class="support-banner">
             <strong>You're not alone here.</strong>
             If things feel like too much to carry, SOS is available 24 hours a day at
             1-767, or via WhatsApp CareText at 9151 1767. In an emergency, call 999.
           </div>`
        : "";

      return `
        <div class="post-card">
          <div class="post-meta">
            <span class="post-author">${post.author}</span>
            <span>&middot;</span>
            <span>${timeAgo(post.createdAt)}</span>
            <span class="tag">${CATEGORY_LABELS[post.category] || "General"}</span>
          </div>
          ${post.title ? `<h3 class="post-title">${escapeHtml(post.title)}</h3>` : ""}
          <p class="post-body">${escapeHtml(post.body)}</p>
          ${banner}
          <div class="post-actions">
            <button class="support-btn ${post.supported ? "supported" : ""}" data-id="${post.id}">
              ${post.supported ? "Supported" : "Send support"} (${post.supportCount})
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll(".support-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleSupport(btn.dataset.id));
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function handlePostForm() {
  const form = document.getElementById("post-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = document.getElementById("category").value;
    const title = document.getElementById("title").value.trim();
    const body = document.getElementById("body").value.trim();
    const anonymous = document.getElementById("anonymous").checked;

    if (!body) return;

    const posts = getPosts();
    posts.push({
      id: crypto.randomUUID(),
      title,
      body,
      category,
      anonymous,
      author: anonymous ? "Anonymous" : "You",
      createdAt: Date.now(),
      supportCount: 0,
      supported: false,
    });
    savePosts(posts);

    window.location.href = "forum.html";
  });
}

renderFeed();
handlePostForm();
