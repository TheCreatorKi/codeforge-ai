const fs = require('fs');
const path = require('path');
const { Octokit } = require("@octokit/rest");

// === 1️⃣ GitHub-Zugang ===
const GITHUB_TOKEN = "<DEIN_PERSONAL_ACCESS_TOKEN>";
const REPO_OWNER = "<DEIN_GITHUB_USERNAME>";
const REPO_NAME = "<DEIN_REPO_NAME>";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// === 2️⃣ Hilfsfunktionen ===
function renderTemplate(content, vars){
  return content.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => vars[key] || '');
}

function sanitizeSlug(name){
  return name.toLowerCase().replace(/[^a-z0-9\-]/g,'-').replace(/-+/g,'-').replace(/(^-|-$)/g,'');
}

// === 3️⃣ Template laden ===
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

// === 4️⃣ Dateien nach GitHub pushen ===
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

// === 5️⃣ Projekt generieren ===
async function generateProject(projectBrief){
  const projectName = projectBrief.trim() || "Demo Project";
  const slug = sanitizeSlug(projectName);
  const vars = { APP_NAME: projectName, APP_SLUG: slug };

  const files = loadTemplateFiles('todo', vars);
  await pushMultipleFiles(files, projectName);

  return { success:true, path:`generated/${slug}/` };
}

// Export für API-Endpunkt
module.exports = { generateProject };
