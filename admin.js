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
    validateStatus.textContent = `校验通过：${data.projects.length} 个项目，${data.blog.length} 篇随笔，${data.feed.length} 条动态`;
    validateStatus.style.color = "#15a36c";
    return true;
  } catch (error) {
    validateStatus.textContent = `校验失败：${error.message}`;
    validateStatus.style.color = "#d71936";
    return false;
  }
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
