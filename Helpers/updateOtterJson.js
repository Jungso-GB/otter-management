const fs = require('fs');
const path = require('path');
const db = require('../Loader/loadDatabase');


async function updateOtterJson() {
    const rolePermissions = {
      "Le Parrain": 6,
      "Sottocapo": 5,
      "Enroloutre": 4,
      "Loutre Mafieuse": 3,
      "Loutre Naissante": 2
    }

    let ottersInfo = {}

    for (const role of Object.keys(rolePermissions).sort((a, b) => rolePermissions[b] - rolePermissions[a])) {
        const roleRef = db.collection('activeMembers').doc(role).collection('members');
        const membersSnapshot = await roleRef.get();
        console.log(`Récupération des membres pour le rôle ${role}...`);

        for (const memberDoc of membersSnapshot.docs) {
            const discordName = memberDoc.id;
            const profileDoc = await db.collection('profiles').doc(discordName).get();

            if (profileDoc.exists && await profileDoc.data().websiteInfo.profilPage) {
                console.log(`Récupération de la page personnalisée de ${discordName}...`);
                let websiteInfo = await profileDoc.data().websiteInfo;
                let profilPageInfo = websiteInfo.profilPageInfo

                // Ajouter les informations nécessaires dans l'objet ottersInfo avec fileName comme clé
                ottersInfo[profilPageInfo.fileName] = {
                    FirstName: websiteInfo.Prenom,
                    LastName: websiteInfo.Nom,
                    FileName: profilPageInfo.fileName,
                    text: profilPageInfo.descriptionHTML,
                    title1: profilPageInfo.titre1,
                    title2: profilPageInfo.titre2,
                    title3: profilPageInfo.titre3,
                    Titre: profilPageInfo.titre,
                };
                }
            }
        }

        console.log('ottersInfo:', ottersInfo);
    


    const data = JSON.stringify(ottersInfo, null, 2); // Le paramètre '2' ajoute une indentation pour rendre le fichier plus lisible
    const outputPath = path.join(__dirname, '../tmp/otter.json');
    fs.writeFile(outputPath, data, (err) => {
        if (err) {
            console.error("Erreur lors de l'écriture du fichier JSON:", err);
        } else {
            console.log('Fichier ottersInfo.json créé avec succès.');
        }
    });


};

module.exports = updateOtterJson;