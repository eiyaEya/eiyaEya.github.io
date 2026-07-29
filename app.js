const DATA_URL = "data/site.json";
const LIKE_KEY = "ruiquan-site-likes";

const app = document.querySelector("#app");
const navItems = [...document.querySelectorAll(".nav-item")];

let siteData;
let activeChannel = "推荐";
let activeQuery = "";

init();

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    siteData = await response.json();
    window.addEventListener("hashchange", renderRoute);
    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    renderRoute();
  } catch (error) {
    app.innerHTML = `
      <section class="error-state">
        <strong>页面数据暂时无法加载</strong>
        <span>${escapeHtml(error.message)}</span>
      </section>
    `;
  }
}

function renderRoute() {
  const route = (location.hash || "#home").replace("#", "");
  const normalized = ["home", "projects", "blog", "contact"].includes(route) ? route : "home";
  navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.route === normalized));

  const views = {
    home: renderHome,
    projects: renderProjects,
    blog: renderBlog,
    contact: renderContact,
  };

  app.innerHTML = views[normalized]();
}

function renderHome() {
  const { profile } = siteData;
  return `
    <section class="view xhs-home">
      <div class="search-panel">
        <label class="search-box" aria-label="搜索 ruiquan.studio 内容">
          <span aria-hidden="true">⌕</span>
          <input id="homeSearch" type="search" value="${escapeHtml(activeQuery)}" placeholder="搜索项目 / 随笔 / 动态" />
        </label>
        <a class="publish-button" href="#contact" aria-label="联系">+</a>
      </div>

      <section class="profile-strip">
        <div class="avatar-wrap">
          <img class="avatar" src="${profile.avatar}" alt="${escapeHtml(profile.name)}" />
          <span class="avatar-badge" aria-hidden="true">✓</span>
        </div>
        <div class="profile-copy">
          <h1>${escapeHtml(profile.name)}</h1>
          <p>${escapeHtml(profile.bio)}</p>
          <div class="tag-row">
            ${profile.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
      </section>

      <div class="metric-strip">
        ${profile.metrics
          .map(
            (metric) => `
              <div class="metric">
                <strong>${escapeHtml(metric.value)}</strong>
                <span>${escapeHtml(metric.label)}</span>
              </div>
            `,
          )
          .join("")}
      </div>

      <nav class="channel-tabs" aria-label="内容频道">
        ${channels()
          .map(
            (channel) => `
              <button class="channel-tab ${channel === activeChannel ? "is-active" : ""}" data-channel="${channel}" type="button">
                ${escapeHtml(channel)}
              </button>
            `,
          )
          .join("")}
      </nav>

      <div id="homeFeed">
        ${renderHomeFeed()}
      </div>
    </section>
  `;
}

function renderHomeFeed() {
  const notes = filteredNotes();
  if (!notes.length) {
    return `
      <section class="empty-feed">
        <strong>没有找到相关内容</strong>
        <span>换个关键词或频道试试。</span>
      </section>
    `;
  }
  return `
    <div class="feed-masonry">
      ${notes.map((note) => renderNoteCard(note)).join("")}
    </div>
  `;
}

function renderProjects() {
  const projectNotes = siteData.projects.map(projectToNote);
  return `
    <section class="view">
      ${renderPageIntro("Project", "项目也按笔记方式展示：状态、标签、下载入口和成果说明。")}
      <div class="note-list-grid">
        ${projectNotes.map((note) => renderWideNote(note)).join("")}
      </div>
    </section>
  `;
}

function renderBlog() {
  const blogNotes = siteData.blog.map(blogToNote);
  return `
    <section class="view">
      ${renderPageIntro("Blog", "生活、工作和阶段性复盘，点开像看一篇笔记。")}
      <div class="note-list-grid">
        ${blogNotes.map((note) => renderWideNote(note)).join("")}
      </div>
    </section>
  `;
}

function renderContact() {
  const qrImage = siteData.site.qrImage || "assets/site-qr.png";
  const displayUrl = siteData.site.displayUrl || siteData.site.url;
  return `
    <section class="view">
      ${renderPageIntro("Contact", "合作、交流和简历访问入口。")}
      <div class="contact-grid">
        ${siteData.contact
          .map(
            (item) => `
              <a class="contact-card" href="${item.href}" target="_blank" rel="noreferrer">
                <span class="contact-main">
                  <strong>${escapeHtml(item.label)}</strong>
                  <span>${escapeHtml(item.value)}</span>
                </span>
                <span class="contact-chip">${escapeHtml(item.action)}</span>
              </a>
            `,
          )
          .join("")}
      </div>
      <div class="notice-card">
        <p>网站地址：<a href="${siteData.site.url}" target="_blank" rel="noreferrer">${escapeHtml(displayUrl)}</a></p>
      </div>
      <article class="project-card qr-card">
        <img src="${qrImage}" alt="个人网站二维码" />
        <div class="content-pad">
          <h2 class="card-title">简历二维码</h2>
          <p class="card-copy">扫码进入手机端个人主页。</p>
          <div class="action-row">
            <a class="primary-button" href="${qrImage}" download>下载二维码</a>
            <a class="secondary-button" href="${issueUrl("访客留言", "你好，我想和你交流")}" target="_blank" rel="noreferrer">给我留言</a>
          </div>
        </div>
      </article>
    </section>
  `;
}

function renderPageIntro(title, copy) {
  return `
    <header class="page-intro">
      <div>
        <span class="page-eyebrow">ruiquan.studio</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(copy)}</p>
      </div>
    </header>
  `;
}

function renderNoteCard(note) {
  return `
    <article class="note-card xhs-note" data-open-note="${note.key}" tabindex="0">
      <img src="${note.image}" alt="${escapeHtml(note.title)}" />
      <div class="note-body">
        <div class="note-chip-row">
          <span class="mini-chip">${escapeHtml(note.category)}</span>
          ${note.type === "project" ? `<span class="mini-chip ${note.openSource ? "is-open" : "is-private"}">${note.openSource ? "开源" : "未开源"}</span>` : ""}
        </div>
        <h3 class="note-title">${escapeHtml(note.title)}</h3>
        <div class="note-meta">
          <span class="author-mini">
            <img src="${siteData.profile.avatar}" alt="" />
            ruiquan
          </span>
          <button class="like-button" data-like-id="${note.likeId}" type="button" aria-label="点赞">
            <span aria-hidden="true">♡</span>
            <span>${likeCount(note.likeId, note.likes)}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderWideNote(note) {
  return `
    <article class="wide-note" data-open-note="${note.key}" tabindex="0">
      <img src="${note.image}" alt="${escapeHtml(note.title)}" />
      <div class="wide-note-body">
        <div class="card-kicker">
          <span>${escapeHtml(note.date)}</span>
          <span>${escapeHtml(note.category)}</span>
        </div>
        <h2 class="card-title">${escapeHtml(note.title)}</h2>
        <p class="card-copy">${escapeHtml(note.summary)}</p>
        <div class="tag-row">
          ${note.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="note-actions">
          <button class="like-button" data-like-id="${note.likeId}" type="button">
            <span aria-hidden="true">♡</span>
            <span>${likeCount(note.likeId, note.likes)}</span>
          </button>
          <button class="secondary-button" data-open-note="${note.key}" type="button">查看详情</button>
        </div>
      </div>
    </article>
  `;
}

function handleInput(event) {
  if (event.target.id !== "homeSearch") return;
  activeQuery = event.target.value.trim();
  const feed = document.querySelector("#homeFeed");
  if (feed) feed.innerHTML = renderHomeFeed();
}

function handleClick(event) {
  const likeButton = event.target.closest("[data-like-id]");
  if (likeButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleLike(likeButton);
    return;
  }

  const channelButton = event.target.closest("[data-channel]");
  if (channelButton) {
    activeChannel = channelButton.dataset.channel;
    document.querySelectorAll("[data-channel]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.channel === activeChannel);
    });
    const feed = document.querySelector("#homeFeed");
    if (feed) feed.innerHTML = renderHomeFeed();
    return;
  }

  const closeButton = event.target.closest("[data-close-detail]");
  if (closeButton) {
    closeDetail();
    return;
  }

  const openTarget = event.target.closest("[data-open-note]");
  if (openTarget) {
    openDetail(openTarget.dataset.openNote);
  }
}

function toggleLike(button) {
  const id = button.dataset.likeId;
  const likes = readLikes();
  likes[id] = !likes[id];
  localStorage.setItem(LIKE_KEY, JSON.stringify(likes));
  button.classList.toggle("is-liked", likes[id]);
  const countNode = button.querySelector("span:last-child");
  const current = Number(countNode.textContent);
  countNode.textContent = String(Math.max(0, current + (likes[id] ? 1 : -1)));
}

function openDetail(key) {
  const note = allNotes().find((item) => item.key === key);
  if (!note) return;
  closeDetail();

  const overlay = document.createElement("div");
  overlay.className = "detail-overlay";
  overlay.innerHTML = `
    <section class="detail-sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(note.title)}">
      <button class="detail-close" data-close-detail type="button" aria-label="关闭">×</button>
      <div class="detail-media">
        <img src="${note.image}" alt="${escapeHtml(note.title)}" />
      </div>
      <div class="detail-content">
        <header class="detail-author">
          <span class="author-mini is-large">
            <img src="${siteData.profile.avatar}" alt="" />
            <span>
              <strong>ruiquan</strong>
              <small>${escapeHtml(note.date)} · ${escapeHtml(note.category)}</small>
            </span>
          </span>
          <a class="follow-button" href="#contact" data-close-detail>联系</a>
        </header>
        <h2>${escapeHtml(note.title)}</h2>
        <p>${escapeHtml(note.summary)}</p>
        <div class="tag-row">
          ${note.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        ${renderDetailActions(note)}
        <section class="comment-preview">
          <div class="comment-head">
            <strong>访客互动</strong>
            <span>GitHub Issues</span>
          </div>
          <p>为了不暴露后台，评论会跳转到 GitHub 留言页。你可以公开留言，我登录 GitHub 后回复。</p>
          <a class="primary-button" href="${issueUrl(note.type === "project" ? "项目交流" : "笔记评论", note.title)}" target="_blank" rel="noreferrer">去评论</a>
        </section>
      </div>
      <footer class="detail-toolbar">
        <button class="like-button" data-like-id="${note.likeId}" type="button">
          <span aria-hidden="true">♡</span>
          <span>${likeCount(note.likeId, note.likes)}</span>
        </button>
        <a class="toolbar-link" href="${issueUrl("访客留言", note.title)}" target="_blank" rel="noreferrer">评论</a>
        <a class="toolbar-link" href="#contact" data-close-detail>联系</a>
      </footer>
    </section>
  `;
  document.body.appendChild(overlay);
  document.body.classList.add("is-detail-open");
}

function renderDetailActions(note) {
  if (note.type !== "project") return "";
  return `
    <div class="action-row">
      ${
        note.sourceUrl
          ? `<a class="secondary-button" href="${note.sourceUrl}" target="_blank" rel="noreferrer">源码</a>`
          : `<span class="ghost-button button-disabled">源码未公开</span>`
      }
      ${
        note.downloadUrl
          ? `<a class="primary-button" href="${note.downloadUrl}" target="_blank" rel="noreferrer">下载</a>`
          : `<span class="ghost-button button-disabled">下载整理中</span>`
      }
    </div>
  `;
}

function closeDetail() {
  document.querySelector(".detail-overlay")?.remove();
  document.body.classList.remove("is-detail-open");
}

function channels() {
  return ["推荐", "项目", "随笔", "生活", "技术", "联系"];
}

function filteredNotes() {
  const query = activeQuery.toLowerCase();
  return allNotes().filter((note) => {
    const channelMatch =
      activeChannel === "推荐" ||
      (activeChannel === "项目" && note.type === "project") ||
      (activeChannel === "随笔" && note.type === "blog") ||
      (activeChannel === "生活" && `${note.title} ${note.summary} ${note.category}`.includes("生活")) ||
      (activeChannel === "技术" && `${note.title} ${note.summary} ${note.tags.join(" ")}`.toLowerCase().match(/github|html|css|pages|技术|项目|前端/)) ||
      (activeChannel === "联系" && note.type === "contact");
    const searchMatch =
      !query ||
      `${note.title} ${note.summary} ${note.category} ${note.tags.join(" ")}`.toLowerCase().includes(query);
    return channelMatch && searchMatch;
  });
}

function allNotes() {
  return [
    ...siteData.feed.map(feedToNote),
    ...siteData.projects.map(projectToNote),
    ...siteData.blog.map(blogToNote),
    contactToNote(),
  ];
}

function feedToNote(note) {
  return {
    key: `feed-${note.id}`,
    type: "feed",
    title: note.title,
    summary: note.title,
    date: note.date,
    likes: note.likes,
    likeId: `feed-${note.id}`,
    image: note.image,
    category: "动态",
    tags: ["动态", "studio"],
  };
}

function projectToNote(project, index) {
  return {
    key: `project-${index}`,
    type: "project",
    title: project.title,
    summary: project.summary,
    date: project.period,
    likes: 10 + index * 4,
    likeId: `project-${index}`,
    image: project.image,
    category: "项目",
    tags: project.tags,
    openSource: project.openSource,
    sourceUrl: project.sourceUrl,
    downloadUrl: project.downloadUrl,
  };
}

function blogToNote(post) {
  return {
    key: `blog-${post.id}`,
    type: "blog",
    title: post.title,
    summary: post.excerpt,
    date: post.date,
    likes: post.likes,
    likeId: `blog-${post.id}`,
    image: post.image,
    category: post.category,
    tags: [post.category, "Blog"],
  };
}

function contactToNote() {
  return {
    key: "contact-card",
    type: "contact",
    title: "联系 ruiquan.studio",
    summary: "通过邮箱、GitHub 或访客留言和我交流，也可以下载简历二维码。",
    date: "Contact",
    likes: 8,
    likeId: "contact-card",
    image: siteData.site.qrImage,
    category: "联系",
    tags: ["Email", "GitHub", "二维码"],
  };
}

function likeCount(id, baseCount) {
  const liked = Boolean(readLikes()[id]);
  return String(baseCount + (liked ? 1 : 0));
}

function readLikes() {
  try {
    return JSON.parse(localStorage.getItem(LIKE_KEY) || "{}");
  } catch {
    return {};
  }
}

function issueUrl(label, title) {
  const params = new URLSearchParams({
    title: `[${label}] ${title}`,
    body: `来自 ruiquan.studio 的访客互动：${title}`,
    labels: "visitor-feedback",
  });
  return `https://github.com/${siteData.github.owner}/${siteData.github.repo}/issues/new?${params.toString()}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
