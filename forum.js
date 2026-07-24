const STORAGE_KEY = "forumPosts";

const CATEGORY_LABELS = {
  general: "General support",
  letters: "Letters Never Sent",
  vent: "Just venting",
  advice: "Asking for advice",
};

const CATEGORY_COLORS = {
  general: "bg-blue-100 text-blue-700",
  letters: "bg-purple-100 text-purple-700",
  vent: "bg-orange-100 text-orange-700",
  advice: "bg-green-100 text-green-700",
};

const CRISIS_KEYWORDS = ["suicide", "kill myself", "end it all", "self harm", "self-harm"];

function seedPosts() {
  return [
    {
      id: crypto.randomUUID(),
      title: "First week of exams and I'm already drained",
      body: "Anyone else feel like the pressure just doesn't let up? Would love to hear how others cope.",
      category: "vent",
      author: "Anonymous",
      createdAt: Date.now() - 1000 * 60 * 60 * 2,
      supportCount: 4,
    },
    {
      id: crypto.randomUUID(),
      title: "Letter to someone I never told",
      body: "I never got to say how much it hurt when you left without a word. I think I'm finally ready to let it go.",
      category: "letters",
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
  const mins = Math.floor((Date.now() - timestamp) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function mentionsCrisisLanguage(text) {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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
    list.innerHTML = `<p class="text-gray-500 text-center">No posts yet — be the first to share.</p>`;
    return;
  }

  list.innerHTML = posts
    .map((post) => {
      const banner = mentionsCrisisLanguage(post.body)
        ? `<div class="mt-3 bg-indigo-50 border-l-4 border-indigo-400 rounded-lg p-3 text-sm text-gray-700">
             <strong class="block mb-1">You're not alone here.</strong>
             If things feel like too much to carry, SOS is available 24 hours a day at
             1-767, or via WhatsApp CareText at 9151 1767. In an emergency, call 999.
           </div>`
        : "";

      const colorClass = CATEGORY_COLORS[post.category] || "bg-gray-100 text-gray-700";

      return `
        <div class="message bg-white rounded-2xl shadow-lg p-5">
          <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span class="font-semibold text-gray-700">${escapeHtml(post.author)}</span>
            <span>&middot;</span>
            <span>${timeAgo(post.createdAt)}</span>
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${colorClass}">
              ${CATEGORY_LABELS[post.category] || "General"}
            </span>
          </div>
          ${post.title ? `<h3 class="font-bold text-gray-800 mb-1">${escapeHtml(post.title)}</h3>` : ""}
          <p class="text-gray-600 whitespace-pre-wrap">${escapeHtml(post.body)}</p>
          ${banner}
          <div class="mt-4">
            <button data-id="${post.id}"
              class="support-btn text-sm px-4 py-2 rounded-full border ${
                post.supported
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-indigo-400 text-indigo-600 hover:bg-indigo-50"
              }">
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
