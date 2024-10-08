const e = require('express');
const db = require('../Loader/loadDatabase');
require('dotenv').config();


async function saveQuote(message, bot) {

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
      const discordUsername = originalMessage.author.username;
      const quoteContent = originalMessage.content;
      const quoteDate = originalMessage.createdAt;

      // Accéder à Firestore pour créer ou mettre à jour le document
      const profilesRef = db.collection('profiles');
      const userDocRef = profilesRef.doc(discordUsername);

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

      const quotesRef = userDocRef.collection('citations');

      // Vérifier si la citation existe déjà
      const existingQuotes = await quotesRef.where('quote', '==', quoteContent).get();
      if(!existingQuotes.empty) {
        const randomAlreadySave = alreadySave[Math.floor(Math.random() * alreadySave.length)]; // Phrase aléatoire de la liste alreadySave
        message.reply(randomAlreadySave);
        return;
      }

      // Sauvegarder la citation
      await quotesRef.add({
        quote: quoteContent,
        date: quoteDate
      });
      const randomSaveDone = saveDone[Math.floor(Math.random() * saveDone.length)]; // Phrase aléatoire de la liste saveDone
      message.reply(randomSaveDone);
      

    } else {
      // Si le bot est mentionné sans message de réponse
      const mentionedUsers = message.mentions.users.filter(user => user.id !== bot.user.id);
      if (mentionedUsers.size > 0) {
          // Prendre le premier utilisateur mentionné
        const mentionedUser = mentionedUsers.first();
        const discordUsername = mentionedUser.username;
        // Accéder à Firestore pour récupérer les citations de l'utilisateur mentionné
        const profilesRef = db.collection('profiles');
        const userDocRef = profilesRef.doc(discordUsername);
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