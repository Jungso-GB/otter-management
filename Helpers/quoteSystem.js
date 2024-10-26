const e = require('express');
const db = require('../Loader/loadDatabase');
require('dotenv').config();


async function saveQuote(message, bot) {

  const botDevId = "1110950106842284072";
  const botMainId = "1106850900682747974";

const alreadySave = ["Je sais déjà qu'il a dis ça !",

]

const saveDone = ["Allez hop, j'enregistre sa phrase on la ressortira plus tard !",

]

const onlyMention = ["Tu veux quoi ? _(feur)_",

]

  // Vérifier si le bot est mentionné
  if (message.mentions.has(bot.user)) {
    // Vérifier si le message est une réponse à un autre message
    if (message.reference && message.reference.messageId) {
      const originalMessage = await message.channel.messages.fetch(message.reference.messageId);
      const discordId = originalMessage.author.id;

      // Vérifier si l'ID de l'auteur est celui du bot de dev ou du bot principal
      if (discordId === botDevId || discordId === botMainId) {
        return //await message.reply("Pas besoin de toi pour retenir ce que je dis. :ko:");
      }
      const messageId = originalMessage.id;
      const discordUsername = originalMessage.author.username;
      const quoteContent = originalMessage.content;
      const quoteDate = originalMessage.createdAt;

      // Accéder à Firestore pour créer ou mettre à jour le document
      const profilesRef = db.collection('profiles');
      const userDocRef = profilesRef.doc(discordId);
      const quotesRef = userDocRef.collection('citations');
      const quoteDocRef = quotesRef.doc(messageId); // Utiliser l'ID du message comme référence du document

      // Vérifier si le profil existe déjà
      const doc = await userDocRef.get();
      if (!doc.exists) {
          console.warn(`quoteSystem : Le profil de ${discordUsername} n'existe pas.`); // Met une indication dans la console (pq pas au channel admin)
        if(process.env.GITHUB_BRANCH === "main"){
          const channel = await bot.channels.fetch("1282684525259919462"); // Met une indication dans le channel admin MAIN
          await channel.send(`quoteSystem : Le profil pour ${discordUsername} n'existait pas et a été créé.`);    
        } else{
          const channel = await bot.channels.fetch("1252901298798460978"); // Met une indication dans le channel admin DEV
          await channel.send(`quoteSystem : Le profil pour ${discordUsername} n'existait pas et a été créé.`);    
        }
      }


      // Vérifier si la citation existe déjà
      const quoteExists = await quoteDocRef.get();
      if(quoteExists.exists) { // Si la citation existe déjà
        const randomAlreadySave = alreadySave[Math.floor(Math.random() * alreadySave.length)]; // Phrase aléatoire de la liste alreadySave
        message.reply(randomAlreadySave);
        return;
      }

      // Sauvegarder la citation
      await quoteDocRef.set({
        quote: quoteContent,
        date: quoteDate
      });
      const randomSaveDone = saveDone[Math.floor(Math.random() * saveDone.length)]; // Phrase aléatoire de la liste saveDone
      message.reply(randomSaveDone);
      

    } else {
      // Si le bot est mentionné sans message de réponse, c'est donc qu'un utilisateur veut montrer la citation de quelqu'un
      const mentionedUsers = message.mentions.users.filter(user => user.id !== bot.user.id);
      if (mentionedUsers.size > 0) {
         // Prendre le premier utilisateur mentionné
        let mentionedUser = mentionedUsers.first();  
        // Vérifier si l'ID du premier utilisateur mentionné correspond à celui du bot dev ou main
        if (mentionedUser.id === botDevId || mentionedUser.id === botMainId) {
          // Essayer de prendre le second utilisateur mentionné, si disponible
          const mentionedUsersArray = mentionedUsers.array(); // Convertir en tableau si nécessaire
          if (mentionedUsersArray.length > 1) {
            mentionedUser = mentionedUsersArray[1]; // Prendre le second utilisateur mentionné
          }
        }

        const discordId = mentionedUser.id;
// Utiliser discordId comme nécessaire
        // Accéder à Firestore pour récupérer les citations de l'utilisateur mentionné
        const profilesRef = db.collection('profiles');
        const userDocRef = profilesRef.doc(discordId);
        const quotesRef = userDocRef.collection('citations');
        const quotesSnapshot = await quotesRef.get();

        if (!quotesSnapshot.empty) {
          // Sélectionner une citation au hasard pour cet utilisateur
          const quotes = [];
          quotesSnapshot.forEach(doc => quotes.push(doc.data()));
          if (quotes.length > 0) {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            // Afficher la citation et la date
            const dataUser = (await userDocRef.get()).data();
            const prenom = dataUser.Prenom || mentionedUser.displayName;
            const quoteContent = randomQuote.quote;
            const quoteDate = randomQuote.date;
            await message.reply(`"${quoteContent}" — ${prenom}, le ${quoteDate.toDate().toLocaleDateString()}`);
        }} else {
          // Gérer le cas où l'utilisateur mentionné n'a pas de citations sauvegardées
          message.reply("Cette personne n'as pas de citations. Pas très drôle...");
        }
      } else {
        // Gérer le cas où aucun utilisateur n'est mentionné avec le bot
        const randomOnlyMention = onlyMention[Math.floor(Math.random() * onlyMention.length)];
        message.reply(randomOnlyMention);
      }
    }
  }
}


module.exports = saveQuote;