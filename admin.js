const DATA_URL = "data/site.json";
const statusNode = document.querySelector("#status");
const validateStatus = document.querySelector("#validateStatus");
const editor = document.querySelector("#jsonEditor");
const tokenInput = document.querySelector("#token");
const publishBtn = document.querySelector("#publishBtn");
const downloadBtn = document.querySelector("#downloadBtn");
const formatBtn = document.querySelector("#formatBtn");
const previewBtn = document.querySelector("#previewBtn");
const githubEditLink = document.querySelector("#githubEditLink");
const profileName = document.querySelector("#profileName");
const profileBio = document.querySelector("#profileBio");
const contactEmail = document.querySelector("#contactEmail");
const contactGithub = document.querySelector("#contactGithub");
const newBlogTitle = document.querySelector("#newBlogTitle");
const newBlogExcerpt = document.querySelector("#newBlogExcerpt");
const applyQuickBtn = document.querySelector("#applyQuickBtn");
const addBlogBtn = document.querySelector("#addBlogBtn");

let currentData;

init();

async function init() {
  bindEvents();
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    currentData = await response.json();
    editor.value = JSON.stringify(currentData, null, 2);
    githubEditLink.href = `https://github.com/${currentData.github.owner}/${currentData.github.repo}/edit/${currentData.github.branch}/data/site.json`;
    hydrateQuickForm(currentData);
    statusNode.textContent = "数据已加载";
    validate();
  } catch (error) {
    statusNode.textContent = `加载失败：${error.message}`;
  }
}

function bindEvents() {
  editor.addEventListener("input", validate);
  formatBtn.addEventListener("click", formatJson);
  downloadBtn.addEventListener("click", downloadJson);
  previewBtn.addEventListener("click", () => window.open("index.html#home", "_blank", "noreferrer"));
  publishBtn.addEventListener("click", publishToGitHub);
  applyQuickBtn.addEventListener("click", applyQuickProfile);
  addBlogBtn.addEventListener("click", addBlogPost);
}

function parseEditor() {
  const data = JSON.parse(editor.value);
  const required = ["site", "github", "profile", "modules", "feed", "projects", "blog", "contact"];
  const missing = required.filter((key) => !(key in data));
  if (missing.length) throw new Error(`缺少字段：${missing.join(", ")}`);
  return data;
}

function validate() {
  try {
    const data = parseEditor();
    currentData = data;
    validateStatus.textContent = `校验通过：${data.projects.length} 个项目，${data.blog.length} 篇随笔，${data.feed.length} 条动态`;
    validateStatus.style.color = "#15a36c";
    return true;
  } catch (error) {
    validateStatus.textContent = `校验失败：${error.message}`;
    validateStatus.style.color = "#d71936";
    return false;
  }
}

function hydrateQuickForm(data) {
  profileName.value = data.profile.name || "";
  profileBio.value = data.profile.bio || "";
  const email = data.contact.find((item) => item.label === "Email");
  const github = data.contact.find((item) => item.label === "GitHub");
  contactEmail.value = email?.value || "";
  contactGithub.value = github?.href || "";
}

function writeEditor(data) {
  editor.value = JSON.stringify(data, null, 2);
  validate();
}

function applyQuickProfile() {
  const data = parseEditor();
  data.profile.name = profileName.value.trim() || data.profile.name;
  data.profile.bio = profileBio.value.trim() || data.profile.bio;

  const emailValue = contactEmail.value.trim();
  const email = data.contact.find((item) => item.label === "Email");
  if (email && emailValue) {
    email.value = emailValue;
    email.href = `mailto:${emailValue}`;
  }

  const githubValue = contactGithub.value.trim();
  const github = data.contact.find((item) => item.label === "GitHub");
  if (github && githubValue) {
    github.href = githubValue;
    github.value = githubValue.replace(/^https?:\/\//, "");
  }

  writeEditor(data);
  statusNode.textContent = "资料已应用到 JSON";
}

function addBlogPost() {
  const title = newBlogTitle.value.trim();
  const excerpt = newBlogExcerpt.value.trim();
  if (!title || !excerpt) {
    statusNode.textContent = "请填写新随笔标题和摘要";
    return;
  }

  const data = parseEditor();
  const date = new Date().toISOString().slice(0, 10);
  data.blog.unshift({
    id: `post-${Date.now()}`,
    title,
    date,
    category: "随笔",
    likes: 0,
    image: "assets/blog-life.png",
    excerpt,
  });
  data.profile.metrics = data.profile.metrics.map((metric) =>
    metric.label === "随笔" ? { ...metric, value: String(data.blog.length).padStart(2, "0") } : metric,
  );
  newBlogTitle.value = "";
  newBlogExcerpt.value = "";
  writeEditor(data);
  statusNode.textContent = "新随笔已追加到 JSON";
}

function formatJson() {
  const data = parseEditor();
  editor.value = JSON.stringify(data, null, 2);
  validate();
}

function downloadJson() {
  const data = parseEditor();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "site.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function publishToGitHub() {
  if (!validate()) return;
  const token = tokenInput.value.trim();
  if (!token) {
    statusNode.textContent = "请先填写 GitHub Token";
    return;
  }

  const data = parseEditor();
  const { owner, repo, branch } = data.github;
  const path = "data/site.json";
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  publishBtn.disabled = true;
  statusNode.textContent = "正在提交到 GitHub";

  try {
    const getResponse = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, {
      headers: authHeaders(token),
    });
    if (!getResponse.ok) throw new Error(`读取 GitHub 文件失败：HTTP ${getResponse.status}`);
    const current = await getResponse.json();

    const putResponse = await fetch(apiBase, {
      method: "PUT",
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update personal site data",
        content: toBase64Utf8(JSON.stringify(data, null, 2) + "\n"),
        sha: current.sha,
        branch,
      }),
    });
    if (!putResponse.ok) throw new Error(`提交失败：HTTP ${putResponse.status}`);
    statusNode.textContent = "已保存，GitHub Pages 会自动更新";
  } catch (error) {
    statusNode.textContent = error.message;
  } finally {
    publishBtn.disabled = false;
  }
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function toBase64Utf8(value) {
  return btoa(unescape(encodeURIComponent(value)));
}
