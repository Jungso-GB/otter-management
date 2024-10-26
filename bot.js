/* INFOS
Pour rajouter des valeurs par défaut sur les membres, c'est dans Commands/add.js


TODO:
- Quand une personne qui a un grade concerné MAIS n'est pas dans la base de données firestore. Avertir par un message dans le chan bot.
- dans updateMemberDAO, faire en sorte que ce soit aléatoire pour les membres.
- Le filtre des mots, réalisé par Kronox -> Si un mot est détecté, y'a 10% de chance que Chantal dise un truc en mode "OMG TU DIS QUOI _feur_"
*/

/*
A ACTIVER POUR L'ANNIVERSAIRE
- Systeme de citations ( await saveQuote(message, bot) )
- Déplacer gill.js dans "Commands"
- Ré-activer l'update au démarrage
*/


//HEALTH CHECK UP DE L'APPLICATION
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000; // Utilisez la variable d'environnement PORT fournie par Heroku ou un port par défaut

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Le serveur est en écoute sur le port ${PORT}`);
});
//FIN DE HEALTH CHECK UP DE L'APPLICATION

require('dotenv').config();

const Discord = require('discord.js');
const intents = new Discord.IntentsBitField(3276799) // Indents used for the bot
const bot = new Discord.Client({intents});

bot.rolePermissions = {
  "Le Parrain": 7,
  "Loutre Lanceuse de Pantoufles": 6,
  "Loutre Sottocapo": 5,
  "L'Enrôloutre": 4,
  "Loutre Mafieuse": 3,
  "Loutre Naissante": 2
};

const loadCommands = require('./Loader/loadCommands');
const loadEvents = require('./Loader/loadEvents');
const loadDatabase = require('./Loader/loadDatabase');

const loadSlashCommands = require('./Loader/loadSlashCommands');

const timestamp = new Date().toISOString();

bot.color = "#95A5A6" // Set bot color

bot.commands = new Discord.Collection(); // Create collection of commands

console.log(timestamp + ': Connexion à Discord...')
bot.login(process.env.DISCORD_TOKEN); // Login to Discord
console.log('Connexion validée !')

bot.db = loadDatabase()

loadCommands(bot); // Load all commands in collection, to the bot
loadEvents(bot); // Load all commands in collection, to the bot

// Quand le bot est prêt et connecté
bot.on('ready', () => {
    console.log(`Bot opérationnel sous le nom: ${bot.user.tag}!`);

    // Load slash commands
    loadSlashCommands(bot);
});

// SYSTEME DE CITATIONS
const saveQuote = require('./Helpers/quoteSystem');
bot.removeAllListeners('messageCreate');
// Avant d'ajouter le listener
console.log(`Nombre de listeners pour 'messageCreate' avant ajout: ${bot.listenerCount('messageCreate')}`);
// Écouteur d'événements pour les nouveaux messages
bot.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Ne pas répondre aux messages du bot lui-même
  if(!message.mentions.has(bot.user)) return; // Ne pas traiter les messages qui ne mentionnent pas le bot



  // Appeler saveQuote quand un message est reçu
  await saveQuote(message, bot);
});
// Après avoir ajouté le listener
console.log(`Nombre de listeners pour 'messageCreate' après ajout: ${bot.listenerCount('messageCreate')}`);

// UPDATE FUNCTION
const updateFunction = require('./Helpers/updateFunction');
//updateFunction(bot);

// Quand un membre change de role
/*const handleRoleChange = require('./Events/handleRoleChange');
bot.on('guildMemberUpdate', (oldMember, newMember) => {
  handleRoleChange(bot, oldMember, newMember);
});*/
 

//When bot join a guild
bot.on('guildCreate', async (guild) => {
    await bot.function.linkGuildDB(bot, guild);
});

// Supprimer les écouteurs d'événements existants avant de vérifier le nombre de listeners, pour prévenir de certains bugs.
bot.removeAllListeners('interactionCreate');
// Avant d'ajouter le listener
console.log(`Nombre de listeners pour 'interactionCreate' avant ajout: ${bot.listenerCount('interactionCreate')}`);
bot.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    await interaction.deferReply({ ephemeral: true });

    if(interaction.type === Discord.InteractionType.ApplicationCommand) {
      // Then take the command name 
      let command = require(`./Commands/${interaction.commandName}`);
      console.log('Commande: ' + command.name + ' par: ' + interaction.user.username);
      //Run the command
      command.run(bot, interaction, command.options);
  } 
  };
  bot.hasInteractionCreateListener = true; // Marque que l'écouteur a été ajouté
})
// Après avoir ajouté le listener
console.log(`Nombre de listeners pour 'interactionCreate' après ajout: ${bot.listenerCount('interactionCreate')}`);

/* POUR LE DEVELOPPMENT UNIQUMENT
const downloadGitWebsite = require('./Helpers/downloadGitWebsite');
downloadGitWebsite('https://github.com/Satalis/LOUTRES_SITE/', './devWebsite')*/

