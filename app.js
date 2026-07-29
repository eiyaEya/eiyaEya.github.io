const DATA_URL = "data/site.json";
const LIKE_KEY = "ruiquan-site-likes";

const app = document.querySelector("#app");
const navItems = [...document.querySelectorAll(".nav-item")];

let siteData;

init();

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    siteData = await response.json();
    window.addEventListener("hashchange", renderRoute);
    document.addEventListener("click", handleClick);
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
  const { profile, modules, feed } = siteData;
  return `
    <section class="view">
      <div class="profile-hero">
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
      </div>

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

      <div class="section-head">
        <div>
          <h2>快速入口</h2>
          <p>项目、随笔、联系信息一眼到达</p>
        </div>
      </div>
      <div class="module-grid">
        ${modules
          .map(
            (module) => `
              <a class="module-card" href="#${module.route}">
                <strong>${escapeHtml(module.title)}</strong>
                <span>${escapeHtml(module.summary)}</span>
              </a>
            `,
          )
          .join("")}
      </div>

      <div class="section-head">
        <div>
          <h2>图片墙动态</h2>
          <p>像刷笔记一样了解我最近在做什么</p>
        </div>
        <a class="text-link" href="#blog">看随笔</a>
      </div>
      <div class="feed-masonry">
        ${feed.map(renderNoteCard).join("")}
      </div>
    </section>
  `;
}

function renderProjects() {
  return `
    <section class="view">
      <div class="section-head">
        <div>
          <h2>Project</h2>
          <p>项目状态、开源信息和下载入口</p>
        </div>
      </div>
      <div class="card-list">
        ${siteData.projects
          .map(
            (project) => `
              <article class="project-card">
                <img src="${project.image}" alt="${escapeHtml(project.title)}" />
                <div class="content-pad">
                  <div class="card-kicker">
                    <span>${escapeHtml(project.period)}</span>
                    <span class="status-pill ${project.openSource ? "" : "is-closed"}">
                      ${project.openSource ? "开源" : "未开源"}
                    </span>
                  </div>
                  <h2 class="card-title">${escapeHtml(project.title)}</h2>
                  <p class="card-copy">${escapeHtml(project.summary)}</p>
                  <div class="tag-row">
                    ${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
                  </div>
                  <div class="action-row">
                    ${project.sourceUrl ? `<a class="secondary-button" href="${project.sourceUrl}" target="_blank" rel="noreferrer">源码</a>` : ""}
                    ${
                      project.downloadUrl
                        ? `<a class="primary-button" href="${project.downloadUrl}" target="_blank" rel="noreferrer">下载</a>`
                        : `<span class="ghost-button button-disabled">下载整理中</span>`
                    }
                  </div>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderBlog() {
  return `
    <section class="view">
      <div class="section-head">
        <div>
          <h2>Blog</h2>
          <p>生活、工作和一些阶段性想法</p>
        </div>
      </div>
      <div class="card-list">
        ${siteData.blog
          .map(
            (post) => `
              <article class="blog-card">
                <img src="${post.image}" alt="${escapeHtml(post.title)}" />
                <div class="content-pad">
                  <div class="card-kicker">
                    <span>${escapeHtml(post.date)}</span>
                    <span>${escapeHtml(post.category)}</span>
                  </div>
                  <h2 class="card-title">${escapeHtml(post.title)}</h2>
                  <p class="card-copy">${escapeHtml(post.excerpt)}</p>
                  <div class="action-row">
                    <button class="like-button" data-like-id="blog-${post.id}" type="button">
                      <span aria-hidden="true">♡</span>
                      <span>${likeCount(`blog-${post.id}`, post.likes)}</span>
                    </button>
                    <a class="secondary-button" href="${issueUrl("博客评论", post.title)}" target="_blank" rel="noreferrer">评论</a>
                  </div>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderContact() {
  const qrImage = siteData.site.qrImage || "assets/site-qr.png";
  return `
    <section class="view">
      <div class="section-head">
        <div>
          <h2>Contact</h2>
          <p>合作、交流和简历访问入口</p>
        </div>
      </div>
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
        <p>网站地址：<a href="${siteData.site.url}" target="_blank" rel="noreferrer">${siteData.site.url}</a></p>
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

function renderNoteCard(note) {
  return `
    <article class="note-card">
      <img src="${note.image}" alt="${escapeHtml(note.title)}" />
      <div class="note-body">
        <h3 class="note-title">${escapeHtml(note.title)}</h3>
        <div class="note-meta">
          <span>${escapeHtml(note.date)}</span>
          <button class="like-button" data-like-id="feed-${note.id}" type="button">
            <span aria-hidden="true">♡</span>
            <span>${likeCount(`feed-${note.id}`, note.likes)}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function handleClick(event) {
  const button = event.target.closest("[data-like-id]");
  if (!button) return;
  const id = button.dataset.likeId;
  const likes = readLikes();
  likes[id] = !likes[id];
  localStorage.setItem(LIKE_KEY, JSON.stringify(likes));
  button.classList.toggle("is-liked", likes[id]);
  const countNode = button.querySelector("span:last-child");
  const base = Number(countNode.textContent) + (likes[id] ? 1 : -1);
  countNode.textContent = String(Math.max(0, base));
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
    body: `来自个人主页的访客互动：${title}`,
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
