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

// Multer pour gérer les fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Commande /start
bot.start((ctx) => {
  ctx.reply("Bienvenue ! Envoyez-moi un fichier HTML, et je vais l'héberger.");
});

// Gère les fichiers HTML envoyés
bot.on("document", async (ctx) => {
  const file = ctx.message.document;
  if (!file.file_name.endsWith(".html")) {
    return ctx.reply("Veuillez envoyer un fichier .html uniquement.");
  }

  const filePath = path.join(UPLOADS_DIR, `${Date.now()}-${file.file_name}`);
  const fileLink = await ctx.telegram.getFileLink(file.file_id);

  // Télécharge et sauvegarde le fichier
  const response = await fetch(fileLink);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(buffer));

  // URL d'accès au fichier
  const fileUrl = `${process.env.BASE_URL}/uploads/${path.basename(filePath)}`;
  
  // Sauvegarde dans un fichier JSON
  const logPath = path.join(__dirname, "uploads.json");
  let logs = [];
  if (fs.existsSync(logPath)) {
    logs = JSON.parse(fs.readFileSync(logPath, "utf8"));
  }
  logs.push({ user: ctx.message.from.username, url: fileUrl });
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

  ctx.reply(`Fichier mis en ligne : ${fileUrl}`);
});

// Serveur Express pour accéder aux fichiers
app.use("/uploads", express.static(UPLOADS_DIR));

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});

// Démarrer le bot
bot.launch();
