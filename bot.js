/* INFOS
Pour rajouter des valeurs par défaut sur les membres, c'est dans Commands/add.js
*/

// Charge les modules alias
require('module-alias/register');

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

const {dateFormatLog} = require('./Helpers/logTools');

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


// Configuration des flux RSS et des canaux
const { checkRSS } = require('./Helpers/rssHandler');
const RSS_FEEDS = [
  { url: 'https://fr.finalfantasyxiv.com/lodestone/news/news.xml' }, // Canal de maintenance
  { url: 'https://fr.finalfantasyxiv.com/lodestone/news/topics.xml' }  // Canal des annonces importantes
];

//Pour les best-of des quotes
const { createMonthlyBestOf } = require('@helpers/createMonthlyBestOf');

// Quand le bot est prêt et connecté
bot.on('ready', () => {
    console.log(`Bot opérationnel sous le nom: ${bot.user.tag}!`);
    if(process.env.GITHUB_BRANCH === 'main'){
    // Envoyer un message dans le serveur et le channel spécifiés
    const guild = bot.guilds.cache.get("675543520425148416");
    if (guild) {
        const channel = guild.channels.cache.get("1311350221619597455");
        if (channel) {
            channel.send('Je suis de nouveau là ! <:otter_pompom:747554032582787163>');
        } else {
            console.error('Channel non trouvé');
        }
    } else {
        console.error('Serveur non trouvé');
    }

    }
    bot.user.setActivity('GILLS', { type: 'WATCHING' });

    // Load slash commands
    loadSlashCommands(bot);

    // Vérifier les différents flux RSS Lodestone
    setInterval(() => {
      RSS_FEEDS.forEach(feed => {
          checkRSS(bot, feed.url);
      });
      //Système du best-of mensuel de quote
      createMonthlyBestOf(bot);
  }, 20 * 60 * 1000); // Check toutes les 20m
});

// SYSTEME DE CITATIONS
const saveQuote = require('./Helpers/quoteSystem');
// SYSTEME DE FEUR
const verifyWord = require('./Helpers/verifyWord')

bot.removeAllListeners('messageCreate');
// Avant d'ajouter le listener
console.log(`Nombre de listeners pour 'messageCreate' avant ajout: ${bot.listenerCount('messageCreate')}`);
// Écouteur d'événements pour les nouveaux messages
bot.on('messageCreate', async (message) => {
  // Exceptions générales
  const exceptionsChannels = ['704404247445373029', '791052204823281714']; // Table ronde, Antre mafieuse
  if (exceptionsChannels.includes(message.channel.id)) return; // Ne pas répondre aux messages de la Table ronde et de l'Antre mafieuse
  if (message.author.bot) return; // Ne pas répondre aux messages du bot lui-même
  if (message.mentions.everyone) return; // Ne pas traiter les messages qui mentionnent @everyone ou @here
  
  // Feature "feur" et "keen'v"
  // Appeler `verifyWord` quand un message est reçu
  const exceptionsUsers = ['173439968381894656', '143762806574022656', '72405181253287936']; // Sefa, Raziel, Velena
  if (!exceptionsUsers.includes(message.author.id)) await verifyWord(message, bot); // Ne pas répondre "feur" ou "keen'v" aux utilisateurs qui ont un totem d'immunité
  
  // Feature "citation"
  // Appeler `saveQuote` quand un message est reçu
  if (!message.mentions.has(bot.user)) await saveQuote(message, bot); // Ne pas traiter les messages qui ne mentionnent pas le bot
});
// Après avoir ajouté le listener
console.log(`Nombre de listeners pour 'messageCreate' après ajout: ${bot.listenerCount('messageCreate')}`);
 
// QUAND UN USER REJOINT LA GUILDE
const { welcomeMessage, assignRoles } = require('./Helpers/newMember');

bot.on('guildMemberAdd', async (member) => {
    try {
        // Appeler la fonction pour gérer le message de bienvenue
        await welcomeMessage(member);
        // Lui assigner ses rôles
        await assignRoles(member)
    } catch (error) {
        console.error('Erreur lors de l’accueil du nouveau membre :', error);
    }
});

// MESSAGE DE AU REVOIR
const goodbyeMessage = require('./Helpers/goodbyeMessage');
bot.on('guildMemberRemove', async (member) => {
  console.log(`${member.displayName} a quitté le serveur ${member.guild.name}.`);
  await goodbyeMessage(member); // Appel de la fonction goodbyeMessage
});


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
    //await interaction.deferReply({ ephemeral: true });

    if(interaction.type === Discord.InteractionType.ApplicationCommand) {
      // Then take the command name 
      let command = require(`./Commands/${interaction.commandName}`);
      console.log(await dateFormatLog() +  '- Commande: ' + command.name + ' par: ' + interaction.user.username);
      //Run the command
      command.run(bot, interaction, command.options);
  } 
  };
  bot.hasInteractionCreateListener = true; // Marque que l'écouteur a été ajouté
})
// Après avoir ajouté le listener
console.log(`Nombre de listeners pour 'interactionCreate' après ajout: ${bot.listenerCount('interactionCreate')}`);