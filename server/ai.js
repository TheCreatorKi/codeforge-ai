// server/ai.js
const { Octokit } = require("@octokit/rest");
const axios = require("axios");

// === GitHub Setup ===
// Ersetze diese Variablen mit deinen eigenen Daten
const GITHUB_TOKEN = "ghp_8f1HxyJKL3123abcd98XYZ123456789";
const REPO_OWNER = "<DEIN_GITHUB_USERNAME>";
const REPO_NAME = "codeforge-ai";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// === KI-Generierung (erstmal über OpenAI API) ===
async function generateCode(projectBrief) {
    // Für jetzt simulieren wir die KI
    const simulatedCode = `// CodeForge AI generiert: ${projectBrief}\nconsole.log("Hello World!");`;
    return simulatedCode;
}

// === Code in GitHub pushen ===
async function pushToGitHub(filename, content) {
    const response = await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filename,
        message: `Automatisch generierter Code: ${filename}`,
        content: Buffer.from(content).toString("base64"),
        committer: {
            name: "CodeForge AI",
            email: "codeforge@example.com"
        },
        author: {
            name: "CodeForge AI",
            email: "codeforge@example.com"
        }
    });
    return response.data;
}

// Beispiel-Aufruf
async function demo() {
    const project = "Todo App";
    const code = await generateCode(project);
    console.log("Generierter Code:\n", code);
    await pushToGitHub(`generated/${project.replace(/\s/g,"_")}.js`, code);
}

demo();
const fs = require('fs');
const path = require('path');

// Hilfsfunktion: Platzhalter ersetzen
function renderTemplate(content, vars){
  return content.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => vars[key] || '');
}

// Alle Template-Dateien laden und rendern
function loadTemplateFiles(templateName, vars){
  const base = path.join(__dirname, '..', 'templates', templateName);
  const files = [];

  function walk(dir, rel=""){
    const items = fs.readdirSync(dir);
    for(const item of items){
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if(stat.isDirectory()) walk(full, rel + item + "/");
      else {
        const content = fs.readFileSync(full, 'utf8');
        const rendered = renderTemplate(content, vars);
        files.push({ path: `generated/${vars.APP_SLUG}/${rel}${item}`, content: rendered });
      }
    }
  }

  walk(base);
  return files;
}
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: GITHUB_TOKEN });

function sanitizeSlug(name){
  return name.toLowerCase().replace(/[^a-z0-9\-]/g,'-').replace(/-+/g,'-').replace(/(^-|-$)/g,'');
}

async function createOrUpdateFile(owner, repo, path, content, message){
  const b64 = Buffer.from(content, 'utf8').toString('base64');
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    const sha = data.sha;
    await octokit.repos.createOrUpdateFileContents({
      owner, repo, path, message, content: b64, sha,
      committer: {name: "CodeForge AI", email: "codeforge@example.com"},
      author: {name: "CodeForge AI", email: "codeforge@example.com"}
    });
  } catch (err) {
    if(err.status === 404){
      await octokit.repos.createOrUpdateFileContents({
        owner, repo, path, message, content: b64,
        committer: {name: "CodeForge AI", email: "codeforge@example.com"},
        author: {name: "CodeForge AI", email: "codeforge@example.com"}
      });
    } else throw err;
  }
}

async function pushMultipleFiles(files, projectName){
  const commitMsg = `Auto-generate: ${projectName}`;
  for(const file of files){
    await createOrUpdateFile(REPO_OWNER, REPO_NAME, file.path, file.content, commitMsg);
  }
}
async function generateProject(projectBrief){
  const projectName = projectBrief.trim() || "Demo Project";
  const slug = sanitizeSlug(projectName);
  const vars = { APP_NAME: projectName, APP_SLUG: slug };

  const files = loadTemplateFiles('todo', vars); // wir nehmen Todo-Template
  await pushMultipleFiles(files, projectName);

  return { success:true, path:`generated/${slug}/` };
}
