// server/ai.js
const { Octokit } = require("@octokit/rest");
const axios = require("axios");

// === GitHub Setup ===
// Ersetze diese Variablen mit deinen eigenen Daten
const GITHUB_TOKEN = "<DEIN_PERSONAL_ACCESS_TOKEN>";
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
