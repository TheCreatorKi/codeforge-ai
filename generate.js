// Pfad zu ai.js anpassen
const { generateProject } = require('../server/ai');
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Nur POST erlaubt' });
  }

  const { projectName } = req.body;  // der Name des Projekts vom Frontend
  if (!projectName) return res.status(400).json({ error: 'Projektname fehlt' });

  try {
    const result = await generateProject(projectName);
    res.status(200).json(result);   // Erfolgs-Antwort
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fehler beim Generieren' });
  }
}
