# Cadrage complet du projet — Application de pronostics sociaux entre amis

## 1. Vision du projet

Le projet consiste à créer une application web accessible depuis un navigateur permettant à un groupe d’amis de créer, rejoindre et participer à des pronostics sur n’importe quel sujet.
L’objectif n’est pas de créer une application de pari avec argent réel, mais un jeu social de prédictions entre amis, basé sur des points fictifs, des récompenses virtuelles, des badges, des boosts et des moments de révélation.
Le principe est simple : un joueur crée une question, ajoute plusieurs choix de réponse, définit une date limite de vote, partage un lien avec ses amis, puis les participants votent. Une fois la période terminée et le résultat validé, l’application dévoile les gagnants, attribue les points, applique les effets des boosts et débloque éventuellement des succès.
Le projet doit être pensé comme un jeu web social, rapide à rejoindre, amusant, mobile-friendly et suffisamment flexible pour fonctionner avec tous types de sujets : événements entre amis, soirées, compétitions, défis, prédictions absurdes, résultats sportifs entre amis, vie quotidienne, jeux vidéo, films, séries, études, travail ou événements privés.

---

## 2. Positionnement du produit

### 2.1. Positionnement principal

L’application est un jeu de pronostics sociaux entre amis.

Elle permet de transformer n’importe quelle question en mini-jeu collectif :

> “Qui va arriver en retard ?”  
> “Quel film va gagner ce soir ?”  
> “Qui va gagner la partie ?”  
> “Combien de temps Houssam va tenir avant de rage quit ?”  
> “Est-ce que Florian va finir son projet avant dimanche ?”

Le ton doit rester léger, drôle, compétitif et accessible.

### 2.2. Ce que le projet n’est pas

Le projet ne doit pas être présenté comme une application de jeu d’argent.

Il ne doit pas proposer :

- d’argent réel ;
- de mise financière ;
- de retrait de gains ;
- de récompenses convertibles en argent ;
- de marketplace d’objets revendables ;
- de gains monétisables ;
- de boosts achetables qui donnent un avantage compétitif direct dans un système de gain réel.

Tous les gains doivent rester fictifs et internes au jeu : points, badges, niveaux, titres, cosmétiques, statistiques, classements ou trophées virtuels.

### 2.3. Formulation recommandée

À privilégier :

> Application de pronostics sociaux entre amis.
> Jeu de prédictions entre amis.
> Plateforme de défis et votes entre amis.
> Crée une question, fais voter tes amis, révèle les gagnants.

À éviter dans la communication publique :

> Application de paris.
> Mise.
> Jackpot.
> Gain d’argent.
> Cashout.
> Pari rémunéré.

Le mot “pari” peut être utilisé dans le langage courant entre amis, mais le positionnement produit doit rester centré sur le mot “pronostic”.

---

## 3. Objectifs du projet

### 3.1. Objectif principal

Créer une application web permettant à un utilisateur de créer un pronostic, de le partager par lien, de faire voter ses amis, puis de révéler automatiquement ou manuellement les gagnants à la fin de la période définie.

### 3.2. Objectifs secondaires

Le projet doit également permettre :

- de créer une expérience amusante autour du vote et de l’attente du résultat ;
- de récompenser les bons pronostics avec des points fictifs ;
- de faire progresser les joueurs grâce à des niveaux et des badges ;
- d’ajouter des boosts pour enrichir la stratégie ;
- de créer des interactions sociales drôles, notamment via les sabotages ;
- de conserver un historique des pronostics joués ;
- de créer des classements entre amis ;
- de favoriser la rejouabilité avec des succès, saisons et événements.

---

## 4. Public cible

### 4.1. Utilisateurs principaux

L’application vise principalement :

- les groupes d’amis ;
- les étudiants ;
- les communautés Discord ;
- les groupes de joueurs ;
- les familles ;
- les collègues en contexte informel ;
- les petits groupes privés qui veulent créer des votes funs et compétitifs.

### 4.2. Types d’usage

L’application peut être utilisée pour :

- des soirées entre amis ;
- des pronostics sur des parties de jeux vidéo ;
- des prédictions sur des événements du quotidien ;
- des événements sportifs suivis entre amis ;
- des votes humoristiques ;
- des défis de groupe ;
- des compétitions internes à une communauté ;
- des animations Discord ou Twitch.

---

## 5. Concept général

### 5.1. Boucle de jeu principale

La boucle de jeu principale est la suivante :

1. Un utilisateur crée un pronostic.
2. Il renseigne une question.
3. Il ajoute éventuellement un contexte.
4. Il définit plusieurs choix de réponse.
5. Il choisit une date limite de vote.
6. Il définit une date de révélation ou un mode de résolution.
7. Il partage le lien du pronostic avec ses amis.
8. Les participants rejoignent le pronostic.
9. Les participants votent pour une réponse.
10. La période de vote se termine.
11. Le résultat est validé.
12. Les gagnants sont révélés.
13. Les points, badges et effets des boosts sont appliqués.
14. Les statistiques et classements sont mis à jour.

### 5.2. Expérience recherchée

L’expérience doit être :

- simple à comprendre ;
- rapide à rejoindre ;
- drôle ;
- compétitive ;
- légèrement chaotique grâce aux boosts ;
- sécurisée contre les abus évidents ;
- agréable sur mobile ;
- pensée pour être partagée facilement par lien.

---

## 6. Vocabulaire métier

Pour éviter les ambiguïtés, le projet doit utiliser un vocabulaire clair.

### Pronostic

Un pronostic est une question créée par un utilisateur, accompagnée de plusieurs choix de réponse.

Exemple :

> Qui va gagner la partie de Mario Kart ce soir ?

### Créateur

Le créateur est l’utilisateur qui crée le pronostic.
Il peut configurer la question, les choix de réponse, les dates et le mode de résolution.

### Participant

Un participant est un utilisateur qui rejoint un pronostic et vote pour une réponse.

### Choix de réponse

Les choix de réponse sont les options proposées par le créateur.

Exemple :

- Florian
- Houssam
- Lucas
- Personne, la partie sera annulée
- le créateur peut également voter comme un joueur classique

### Vote

Un vote correspond au choix effectué par un participant.
Par défaut, un participant ne peut voter qu’une seule fois.

### Date limite de vote

La date limite de vote correspond au moment après lequel les participants ne peuvent plus voter.

### Date de révélation

La date de révélation correspond au moment où le résultat peut être affiché aux participants.

### Résolution

La résolution est l’action qui consiste à déterminer la bonne réponse.
Elle peut être effectuée par le créateur, par le groupe ou par un système automatique dans une future version.

### Récompense

La récompense correspond aux points fictifs attribués aux gagnants.

### Boost

Un boost est un objet virtuel consommable permettant d’obtenir un avantage ou de déclencher un effet spécial.

### Sabotage

Un sabotage est un boost offensif qui réduit les gains potentiels d’un autre joueur ou perturbe son résultat.

### Badge

Un badge est une récompense de collection obtenue lorsqu’un joueur accomplit une action spécifique.

---

## 7. Création d’un pronostic

### 7.1. Informations obligatoires

Pour créer un pronostic, l’utilisateur doit renseigner :

- une question ;
- au moins deux choix de réponse ;
- une date limite de vote ;
- un mode de résolution.

### 7.2. Informations facultatives

Le créateur peut également ajouter :

- un contexte ;
- une image d’illustration ;
- une catégorie ;
- une date de révélation ;
- un nombre maximum de participants ;
- une visibilité ;
- des règles spécifiques ;
- l’autorisation ou non des boosts ;
- l’autorisation ou non des sabotages ;
- un niveau de récompense ;
- une durée automatique.

### 7.3. Exemple de pronostic simple

Question :

> Qui va arriver en retard dimanche ?

Contexte :

> Rendez-vous prévu à 14h devant la gare.

Choix :

- Florian
- Houssam
- Lucas
- Tout le monde sera à l’heure

/!\ Il y a également la possibilité de choisir une tranche horaire ou une heure précise pour avoir la chance d'augmenter drastiquement ses gains

Date limite de vote :

> Dimanche à 13h30

Mode de résolution :

> Le créateur choisit la bonne réponse

Date de révélation :

> Dimanche à 15h00

### 7.4. Exemple de pronostic drôle

Question :

> Combien de temps avant que Lucas dise “je lag” ?

Choix :

- Moins de 5 minutes
- Entre 5 et 15 minutes
- Plus de 15 minutes
- Réponse personnalisée
- Il ne le dira pas cette fois

Contexte :

> Session gaming prévue vendredi soir.

---

## 8. Cycle de vie d’un pronostic

Un pronostic doit suivre un cycle de vie clair.

### 8.1. Brouillon

Le pronostic est en cours de création.

Il n’est pas encore visible par les participants.

Actions possibles :

- modifier la question ;
- modifier le contexte ;
- ajouter ou supprimer des choix ;
- modifier les dates ;
- supprimer le pronostic ;
- publier le pronostic.

### 8.2. Ouvert aux votes

Le pronostic est publié et les participants peuvent voter.

Actions possibles :

- rejoindre le pronostic ;
- voter ;
- utiliser certains boosts ;
- consulter les informations publiques ;
- partager le lien.

Restrictions recommandées :

- le créateur ne peut plus modifier les choix de réponse ;
- le créateur ne peut plus changer la question de manière majeure ;
- le créateur ne peut pas supprimer arbitrairement un choix ayant déjà reçu des votes.

### 8.3. Votes fermés

La date limite de vote est passée.

Les participants ne peuvent plus voter.

Actions possibles :

- consulter son vote ;
- attendre la résolution ;
- afficher un écran de suspense ;
- préparer la révélation.

### 8.4. En attente de résolution

Le pronostic attend que la bonne réponse soit déterminée.

Selon le mode choisi, la résolution peut être :

- faite par le créateur ;
- soumise à validation du groupe ;
- automatique dans une future version.

### 8.5. Révélé

Le résultat est validé.

L’application affiche :

- la bonne réponse ;
- les gagnants ;
- les perdants ;
- les boosts utilisés ;
- les sabotages appliqués ;
- les points gagnés ;
- les badges débloqués ;
- les statistiques du pronostic.

### 8.6. Archivé

Le pronostic reste consultable dans l’historique.

Il n’est plus modifiable.

---

## 9. Modes de résolution

### 9.1. Résolution par le créateur

Le créateur choisit la bonne réponse lorsque le pronostic est terminé.

Avantages :

- simple à développer ;
- adapté au MVP ;
- fonctionne avec tous les sujets.

Inconvénients :

- nécessite de faire confiance au créateur ;
- peut créer des litiges si le créateur triche.

Mesures anti-abus :

- afficher publiquement que le créateur est responsable de la résolution ;
- conserver un historique de la réponse sélectionnée ;
- permettre un signalement ou une contestation en future version.

### 9.2. Résolution par vote de validation

Après la fin du vote, les participants peuvent voter pour confirmer la bonne réponse.

Avantages :

- plus démocratique ;
- réduit la triche du créateur ;
- intéressant pour les groupes d’amis.

Inconvénients :

- plus long ;
- nécessite un second vote ;
- peut bloquer la résolution si les participants ne répondent pas.

### 9.3. Résolution automatique

Dans une future version, certains pronostics pourraient être résolus automatiquement via des données externes.

Exemples :

- score sportif ;
- météo ;
- résultat public ;
- événement daté.

Cette fonctionnalité n’est pas prioritaire pour le MVP.

---

## 10. Système de vote

### 10.1. Vote standard

Chaque participant peut voter pour un seul choix de réponse.

Le vote est enregistré avec :

- l’identifiant du participant ;
- l’identifiant du pronostic ;
- l’identifiant du choix sélectionné ;
- la date de vote ;
- l’historique éventuel des modifications ;
- les boosts associés.

### 10.2. Modification de vote

Par défaut, le vote peut être verrouillé après validation.

Cependant, un boost “Correction” peut permettre de modifier son vote avant la date limite.

Règle recommandée :

- sans boost : le vote est définitif ;
- avec boost : une correction autorisée ;
- aucune correction après la date limite de vote.

### 10.3. Confidentialité des votes

Plusieurs options peuvent être proposées au créateur.

#### Votes cachés jusqu’à la révélation

Les participants ne voient pas les choix des autres avant la fin.
C’est le mode recommandé par défaut.

#### Votes visibles en direct

Les participants peuvent voir la répartition des votes avant la fin.
Ce mode est plus social, mais influence davantage les votes.

#### Votes anonymes

Les participants voient les résultats, mais pas qui a voté quoi.

#### Votes publics

Après révélation, tout le monde peut voir qui avait voté pour quelle réponse.

---

## 11. Système de points

### 11.1. Objectif

Le système de points sert à récompenser les bons pronostics et à alimenter les classements.
Les points doivent rester fictifs et non convertibles en argent.

### 11.2. Récompense de base

Chaque pronostic peut donner une récompense de base aux gagnants.

Exemple :

- pronostic simple : 100 points ;
- pronostic moyen : 150 points ;
- pronostic important : 250 points ;
- pronostic événement : 500 points.

### 11.3. Calcul simple recommandé pour le MVP

Pour le MVP, le calcul peut rester simple :

> Si le joueur a voté pour la bonne réponse, il gagne la récompense de base.

Exemple :

- récompense de base : 100 points ;
- joueur gagnant : +100 points ;
- joueur perdant : +0 point.

### 11.4. Calcul avancé possible

Dans une version avancée, la récompense peut dépendre de la popularité de la réponse.

Principe :

- une réponse très populaire rapporte moins ;
- une réponse peu choisie rapporte plus ;
- cela encourage les votes risqués.

Exemple :

- réponse choisie par 80 % des joueurs : x1 ;
- réponse choisie par 40 % des joueurs : x1.25 ;
- réponse choisie par 10 % des joueurs : x2 ;
- réponse choisie par moins de 5 % des joueurs : x3.

### 11.5. Limites d’équilibrage

Pour éviter les abus :

- plafonner les multiplicateurs ;
- limiter le cumul des boosts ;
- empêcher les récompenses infinies ;
- empêcher les pronostics privés créés uniquement pour farmer des points ;
- adapter les récompenses selon le nombre de participants.

---

## 12. Système de boosts

### 12.1. Objectif

Les boosts ajoutent une dimension stratégique et chaotique au jeu.

Ils doivent être amusants, mais pas trop puissants.

Un boost doit avoir :

- un nom ;
- une description ;
- un type ;
- un effet ;
- une condition d’utilisation ;
- une rareté ;
- une durée éventuelle ;
- une limite d’utilisation.

### 12.2. Types de boosts

Les boosts peuvent être classés en plusieurs catégories :

- boosts défensifs ;
- boosts offensifs ;
- boosts de vote ;
- boosts de récompense ;
- boosts de bluff ;
- boosts cosmétiques.

---

## 13. Catalogue initial des boosts

### 13.1. Correction

Effet :

> Permet de modifier son vote une fois avant la date limite.

Règles :

- utilisable uniquement avant la fermeture des votes ;
- ne peut être utilisé qu’une fois par pronostic ;
- ne permet pas de changer de vote après la date limite.

Intérêt :

- utile si le joueur change d’avis ;
- simple à comprendre ;
- peu frustrant.

### 13.2. Double vote

Effet :

> Permet de voter sur deux réponses différentes.

Contrepartie :

> Les récompenses obtenues sont réduites.

Exemple :

- vote simple gagnant : +100 points ;
- double vote gagnant : +60 points.

Règles :

- utilisable uniquement avant la fin du vote ;
- impossible de voter deux fois sur la même réponse ;
- ne doit pas permettre de doubler totalement ses gains.

### 13.3. Multiplicateur

Effet :

> Augmente les récompenses si le joueur gagne.

Exemple :

- x1.5 sur les gains ;
- x2 pour une version rare.

Règles :

- un seul multiplicateur actif par pronostic ;
- multiplicateur plafonné ;
- peut être contré par un sabotage.

### 13.4. Sabotage

Effet :

> Réduit les gains potentiels d’un autre joueur.

Exemple :

- réduction de 20 % des gains du joueur ciblé ;
- réduction de 30 % pour une version rare.

Règles :

- ne peut pas faire perdre des points ;
- ne réduit que les points gagnés sur le pronostic ;
- doit être révélé au moment de l’affichage des résultats ;
- ne doit pas bloquer totalement la victoire d’un joueur.

### 13.5. Bouclier

Effet :

> Protège contre un sabotage.

Règles :

- bloque un sabotage ;
- peut être consommé automatiquement ;
- ne protège pas contre tous les types d’effets.

### 13.6. Vote fantôme

Effet :

> Cache temporairement le vote du joueur dans les statistiques visibles.

Utile uniquement si les votes partiels sont visibles avant la révélation.

### 13.7. Coup de poker

Effet :

> Augmente fortement les gains si le joueur gagne, mais réduit les gains à zéro s’il perd.

Exemple :

- si le vote est correct : x2 ;
- si le vote est incorrect : aucun point de consolation éventuel.

### 13.8. Voleur de gloire

Effet :

> Si le joueur ciblé gagne, l’utilisateur récupère un petit bonus de points.

Règles :

- ne vole pas directement les points du joueur ciblé ;
- donne seulement un bonus au lanceur ;
- doit rester limité.

### 13.9. Anti-chaos

Effet :

> Annule un effet négatif reçu sur le pronostic.

Règles :

- plus rare que le bouclier ;
- peut annuler un sabotage ou un malus ;
- utilisable uniquement avant la révélation.

### 13.10. Regard du devin

Effet :

> Affiche un indice sur la répartition des votes.

Exemple :

> “La réponse A est actuellement dans le top 2 des choix les plus votés.”

Règles :

- ne doit pas révéler exactement tous les votes ;
- utile uniquement avant la fermeture des votes ;
- peut être désactivé sur certains pronostics.

---

## 14. Équilibrage des boosts

### 14.1. Principes d’équilibrage

Les boosts doivent respecter plusieurs principes :

- ils doivent créer du fun ;
- ils ne doivent pas rendre la victoire impossible pour les autres ;
- ils doivent avoir des contreparties ;
- ils doivent être limités en nombre ;
- ils ne doivent pas permettre de farmer les points trop facilement ;
- ils doivent rester compréhensibles.

### 14.2. Limites recommandées

Pour un MVP avec boosts :

- maximum 1 boost de vote par pronostic ;
- maximum 1 boost de récompense par pronostic ;
- maximum 1 boost offensif par joueur et par pronostic ;
- maximum 1 sabotage reçu par joueur et par pronostic ;
- impossibilité d’utiliser des boosts après la révélation ;
- historique complet des boosts visible après la fin.

### 14.3. Moment de révélation des boosts

Les boosts peuvent être révélés de différentes manières.

#### Révélation immédiate

Le boost est visible dès son utilisation.

Avantage :

- transparent.

Inconvénient :

- moins drôle ;
- moins de surprise.

#### Révélation à la fin

Le boost est caché jusqu’à la révélation.

Avantage :

- plus de suspense ;
- moment social plus drôle.

Inconvénient :

- peut frustrer si mal expliqué.

Recommandation :

> Les boosts offensifs et les sabotages doivent être révélés au moment des résultats.

---

## 15. Système de badges et succès

### 15.1. Objectif

Les badges servent à récompenser les comportements marquants et à donner aux joueurs des objectifs à long terme.

Ils renforcent la collection, la progression et l’identité des joueurs.

### 15.2. Types de badges

Les badges peuvent être classés en plusieurs familles :

- badges de victoire ;
- badges de défaite ;
- badges de création ;
- badges de sabotage ;
- badges de collection ;
- badges rares ;
- badges saisonniers ;
- badges humoristiques.

---

## 16. Catalogue initial de badges

### 16.1. Le Visionnaire

Condition :

> Gagner 5 pronostics d’affilée.

Description :

> Tu avais tout prévu.

### 16.2. Le Maudit

Condition :

> Perdre 10 pronostics d’affilée.

Description :

> Même une pièce ferait mieux.

### 16.3. Le Sniper

Condition :

> Gagner avec une réponse choisie par moins de 10 % des participants.

Description :

> Personne n’y croyait. Sauf toi.

### 16.4. Le Traître

Condition :

> Saboter un ami qui aurait gagné.

Description :

> L’amitié, c’est surfait.

### 16.5. Le Survivant

Condition :

> Gagner malgré un sabotage.

Description :

> Ils ont essayé. Ils ont échoué.

### 16.6. Le Miraculé

Condition :

> Modifier son vote grâce à un boost Correction et gagner grâce à ce changement.

Description :

> Un retournement de veste parfaitement exécuté.

### 16.7. Le Créateur Fou

Condition :

> Créer 50 pronostics.

Description :

> Toute question devient une compétition.

### 16.8. Le Roi du Chaos

Condition :

> Utiliser 10 boosts offensifs.

Description :

> Là où tu passes, les classements trépassent.

### 16.9. Le Fidèle

Condition :

> Participer à un pronostic pendant 7 jours consécutifs.

Description :

> Toujours présent quand il faut voter.

### 16.10. Le Dernier Moment

Condition :

> Voter dans les 5 dernières minutes avant la fermeture.

Description :

> Pourquoi faire simple quand on peut stresser tout le monde ?

### 16.11. L’Imposteur

Condition :

> Gagner un pronostic après avoir utilisé un Double vote.

Description :

> Deux chances, une victoire.

### 16.12. Le Patron

Condition :

> Être premier du classement hebdomadaire.

Description :

> Cette semaine, c’était ton royaume.

---

## 17. Progression joueur

### 17.1. Profil joueur

Chaque joueur doit disposer d’un profil affichant :

- son pseudo ;
- son avatar ;
- son niveau ;
- son total de points ;
- ses badges ;
- son nombre de pronostics joués ;
- son nombre de victoires ;
- son taux de réussite ;
- ses boosts disponibles ;
- son historique récent ;
- son classement dans ses groupes.

### 17.2. Niveaux

Les niveaux permettent de matérialiser la progression.

Exemple :

- Niveau 1 : Nouveau joueur ;
- Niveau 5 : Habitué ;
- Niveau 10 : Stratège ;
- Niveau 25 : Oracle ;
- Niveau 50 : Légende du groupe.

Les niveaux peuvent être calculés via l’expérience gagnée.

### 17.3. Expérience

L’expérience peut être gagnée même en cas de défaite, pour encourager la participation.

Exemple :

- participer à un pronostic : +10 XP ;
- gagner un pronostic : +50 XP ;
- créer un pronostic joué par au moins 3 amis : +30 XP ;
- débloquer un badge : +100 XP.

---

## 18. Groupes d’amis

### 18.1. Objectif

Les groupes permettent d’organiser les pronostics par communauté.

Exemples :

- groupe d’amis ;
- serveur Discord ;
- classe ;
- équipe ;
- famille ;
- groupe gaming.

### 18.2. Fonctionnalités de groupe

Un groupe peut contenir :

- un nom ;
- une description ;
- une image ;
- des membres ;
- des rôles ;
- des pronostics actifs ;
- un historique ;
- un classement ;
- des paramètres.

### 18.3. Rôles de groupe

Rôles possibles :

- propriétaire ;
- administrateur ;
- membre ;
- invité.

### 18.4. Pronostics hors groupe

Pour simplifier le MVP, il doit être possible de créer un pronostic partageable par lien sans créer de groupe.

Les groupes peuvent être ajoutés dans une version suivante.

---

## 19. Partage par lien

### 19.1. Objectif

Le partage par lien est central dans le projet.

Un utilisateur doit pouvoir créer un pronostic et envoyer le lien à ses amis via :

- Discord ;
- WhatsApp ;
- Messenger ;
- SMS ;
- Instagram ;
- navigateur ;
- QR code éventuel.

### 19.2. Accès invité

Pour réduire la friction, un participant doit pouvoir rejoindre rapidement avec :

- un pseudo ;
- éventuellement un avatar ;
- sans compte obligatoire dans le MVP.

Cependant, certaines fonctionnalités doivent nécessiter un compte :

- historique global ;
- badges permanents ;
- progression ;
- inventaire de boosts ;
- classement long terme.

### 19.3. Recommandation MVP

Le MVP peut proposer deux modes :

#### Mode invité

Permet de rejoindre rapidement un pronostic.

Limites :

- progression limitée ;
- badges temporaires ;
- dépendance au navigateur ou au lien ;
- moins sécurisé.

#### Mode compte

Permet de conserver :

- points ;
- badges ;
- boosts ;
- historique ;
- statistiques.

---

## 20. Anti-triche et règles de confiance

### 20.1. Problèmes possibles

Le projet doit anticiper plusieurs abus :

- voter plusieurs fois avec plusieurs comptes ;
- créer des pronostics faciles pour farmer des points ;
- modifier les réponses après les votes ;
- choisir une mauvaise réponse volontairement en tant que créateur ;
- saboter excessivement un joueur ;
- créer des contenus offensants ;
- partager un lien dans un groupe non prévu ;
- spammer des pronostics.

### 20.2. Mesures MVP

Pour une première version :

- verrouiller les choix après le premier vote ;
- empêcher la modification de la question après publication, sauf correction mineure ;
- limiter un vote par compte ou par session invitée ;
- conserver l’historique des votes ;
- conserver l’historique des boosts ;
- afficher le mode de résolution ;
- limiter les gains si le nombre de participants est trop faible ;
- imposer au moins deux participants pour générer des récompenses ;
- permettre au créateur de supprimer un pronostic uniquement avant le premier vote.

### 20.3. Mesures avancées

Dans une version plus poussée :

- détection de comptes multiples ;
- limitation par IP ou appareil ;
- réputation du créateur ;
- contestation du résultat ;
- vote de validation du groupe ;
- signalement de contenu ;
- modération ;
- journal d’audit ;
- restrictions sur les pronostics privés abusifs.

---

## 21. Modération et sécurité communautaire

### 21.1. Contenus sensibles

Comme les utilisateurs peuvent créer des questions sur n’importe quel sujet, l’application doit prévoir des garde-fous.

Les pronostics ne doivent pas encourager :

- le harcèlement ;
- l’humiliation ciblée ;
- la haine ;
- les menaces ;
- les contenus sexuels impliquant des mineurs ;
- les discriminations ;
- la violence réelle ;
- les comportements dangereux ;
- les défis illégaux.

### 21.2. Signalement

Les utilisateurs doivent pouvoir signaler :

- un pronostic ;
- un commentaire ;
- un pseudo ;
- un avatar ;
- un comportement abusif.

### 21.3. Paramètres de confidentialité

Un pronostic peut être :

- privé par lien ;
- réservé à un groupe ;
- public dans une future version.

Pour le MVP, le mode recommandé est :

> Privé par lien.

---

## 22. Interface utilisateur

### 22.1. Principes UX

L’interface doit être :

- simple ;
- rapide ;
- claire ;
- mobile-first ;
- amusante ;
- colorée sans être illisible ;
- adaptée aux partages entre amis.

### 22.2. Pages principales MVP

Le MVP doit contenir les pages suivantes :

1. Page d’accueil.
2. Page de création de pronostic.
3. Page de détail d’un pronostic.
4. Page de vote.
5. Page d’attente avant révélation.
6. Page de résultat.
7. Page de profil joueur.
8. Page de connexion / inscription.
9. Page d’historique.
10. Page de classement simple.

### 22.3. Page d’accueil

Objectif :

- présenter le concept ;
- inciter à créer un pronostic ;
- permettre de rejoindre un pronostic via un lien ou un code.

Contenu recommandé :

- titre fort ;
- courte explication ;
- bouton “Créer un pronostic” ;
- bouton “Rejoindre” ;
- exemples de pronostics ;
- aperçu des badges et boosts.

### 22.4. Page de création

Champs :

- question ;
- contexte facultatif ;
- choix de réponse ;
- date limite de vote ;
- date de révélation ;
- mode de résolution ;
- visibilité ;
- activation ou non des boosts ;
- activation ou non des sabotages.

Actions :

- ajouter un choix ;
- supprimer un choix ;
- prévisualiser ;
- publier ;
- enregistrer en brouillon.

### 22.5. Page de vote

La page de vote doit afficher :

- la question ;
- le contexte ;
- le temps restant ;
- les choix disponibles ;
- le bouton de vote ;
- les boosts utilisables ;
- les règles du pronostic ;
- l’état de participation.

Après le vote, la page doit afficher :

- confirmation du vote ;
- possibilité d’utiliser un boost si autorisé ;
- temps restant avant fermeture ;
- bouton de partage.

### 22.6. Page d’attente

Lorsque les votes sont fermés mais que le résultat n’est pas encore révélé, l’application doit afficher :

- un écran de suspense ;
- le rappel de la question ;
- le vote du joueur ;
- le temps restant avant révélation ;
- l’état de résolution.

### 22.7. Page de résultat

La page de résultat est l’un des moments les plus importants du jeu.

Elle doit afficher :

- la bonne réponse ;
- les gagnants ;
- les perdants ;
- les points gagnés ;
- les boosts déclenchés ;
- les sabotages révélés ;
- les badges débloqués ;
- la répartition des votes ;
- les réactions possibles ;
- le bouton “Créer un nouveau pronostic”.

### 22.8. Profil joueur

Le profil doit afficher :

- pseudo ;
- avatar ;
- niveau ;
- points ;
- badges ;
- statistiques ;
- historique ;
- boosts disponibles ;
- classement.

---

## 23. Notifications

### 23.1. Notifications utiles

L’application peut notifier l’utilisateur lorsque :

- un ami l’invite à un pronostic ;
- la date limite de vote approche ;
- les votes sont fermés ;
- le résultat est disponible ;
- un badge est débloqué ;
- un joueur l’a saboté ;
- un nouveau pronostic est créé dans son groupe.

### 23.2. Canaux de notification

Pour le MVP :

- notifications dans l’application ;
- emails facultatifs.

Pour une version future :

- notifications push ;
- intégration Discord ;
- webhook ;
- bot Discord.

---

## 24. Classements

### 24.1. Classement global

Le classement global affiche les meilleurs joueurs sur l’ensemble de l’application.

Il n’est pas prioritaire pour le MVP.

### 24.2. Classement par groupe

Le classement par groupe est plus pertinent.

Il peut afficher :

- points totaux ;
- victoires ;
- taux de réussite ;
- badges rares ;
- nombre de sabotages réussis ;
- série de victoires.

### 24.3. Classements temporels

Types de classements :

- classement de la semaine ;
- classement du mois ;
- classement de la saison ;
- classement all-time.

### 24.4. Recommandation

Pour le MVP :

> Mettre en place un classement simple par points et par groupe ou par pronostic.

---

## 25. Saisons et événements

### 25.1. Objectif

Les saisons permettent de relancer l’intérêt du jeu.

Exemple :

- Saison 1 : Les fondateurs ;
- Saison 2 : Chaos entre amis ;
- Saison Halloween ;
- Saison Noël ;
- Saison été.

### 25.2. Fonctionnement

Une saison peut contenir :

- une période ;
- un classement dédié ;
- des badges exclusifs ;
- des boosts temporaires ;
- des récompenses cosmétiques.

### 25.3. Priorité

Les saisons ne sont pas nécessaires pour le MVP, mais elles sont intéressantes pour la rétention long terme.

---

## 26. Règles légales et éthiques

### 26.1. Principe fondamental

Le projet doit rester un jeu social sans argent réel.

Il ne doit pas demander de sacrifice financier pour participer à un pronostic ou espérer obtenir une récompense monétisable.

### 26.2. Règles à respecter

Pour rester dans une logique de jeu social :

- aucune mise en argent réel ;
- aucun gain convertible en argent ;
- aucune récompense revendable ;
- aucun objet numérique monétisable ;
- pas de système de cashout ;
- pas de boutique vendant des avantages compétitifs contre de l’argent réel ;
- pas de promesse de gain financier ;
- pas de communication marketing assimilable à des jeux d’argent.

### 26.3. Recommandation produit

Le projet doit utiliser le vocabulaire suivant :

- pronostic ;
- vote ;
- point ;
- badge ;
- boost ;
- défi ;
- récompense virtuelle ;
- classement.

Et éviter :

- mise ;
- argent ;
- jackpot ;
- pari rémunéré ;
- gain réel ;
- cashout.

---

## 27. Périmètre MVP

### 27.1. Fonctionnalités incluses dans le MVP

Le MVP doit inclure :

- création de compte ;
- connexion ;
- profil joueur simple ;
- création d’un pronostic ;
- ajout de choix de réponse ;
- contexte facultatif ;
- date limite de vote ;
- date de révélation ;
- partage par lien ;
- participation à un pronostic ;
- vote ;
- verrouillage du vote ;
- fermeture automatique des votes ;
- résolution par le créateur ;
- révélation des résultats ;
- attribution de points simples ;
- historique des pronostics ;
- quelques badges simples ;
- classement simple.

### 27.2. Fonctionnalités exclues du MVP

À ne pas faire dans la première version :

- boutique ;
- argent réel ;
- système de paiement ;
- application mobile native ;
- bot Discord complet ;
- résolution automatique externe ;
- saisons ;
- marketplace ;
- modération avancée ;
- messagerie privée ;
- statistiques avancées ;
- système de groupes complexe ;
- trop grand nombre de boosts.

### 27.3. MVP recommandé avec boosts limités

Pour intégrer rapidement la promesse du projet sans exploser le périmètre, le MVP peut inclure seulement trois boosts :

1. Correction.
2. Double vote.
3. Sabotage léger.

Et un boost défensif :

4. Bouclier.

---

## 28. Roadmap fonctionnelle

### Phase 1 — Base jouable

Objectif :

> Permettre de créer un pronostic, voter et révéler les gagnants.

Fonctionnalités :

- authentification ;
- profil simple ;
- création de pronostic ;
- vote ;
- résolution créateur ;
- résultats ;
- points ;
- historique.

### Phase 2 — Gamification

Objectif :

> Ajouter la progression et les récompenses.

Fonctionnalités :

- badges ;
- niveaux ;
- XP ;
- classement ;
- statistiques de profil.

### Phase 3 — Boosts

Objectif :

> Ajouter la stratégie et le chaos contrôlé.

Fonctionnalités :

- inventaire de boosts ;
- correction de vote ;
- double vote ;
- multiplicateur ;
- sabotage ;
- bouclier ;
- historique des effets.

### Phase 4 — Groupes

Objectif :

> Structurer l’usage entre communautés.

Fonctionnalités :

- création de groupes ;
- invitation de membres ;
- classement de groupe ;
- pronostics réservés à un groupe ;
- rôles simples.

### Phase 5 — Social avancé

Objectif :

> Renforcer les interactions.

Fonctionnalités :

- réactions aux résultats ;
- commentaires ;
- notifications ;
- partage enrichi ;
- intégration Discord.

### Phase 6 — Saisons et événements

Objectif :

> Améliorer la rétention.

Fonctionnalités :

- saisons ;
- badges temporaires ;
- classements saisonniers ;
- événements spéciaux ;
- boosts exclusifs.

---

## 29. Modèle de données conceptuel

### 29.1. User

Représente un utilisateur de l’application.

Champs possibles :

- Id ;
- UserName ;
- Email ;
- PasswordHash ;
- AvatarUrl ;
- CreatedAt ;
- LastLoginAt ;
- Level ;
- Experience ;
- TotalPoints ;
- IsGuest ;
- GuestToken.

### 29.2. Prediction

Représente un pronostic.

Champs possibles :

- Id ;
- CreatorId ;
- GroupId ;
- Question ;
- Context ;
- Status ;
- Visibility ;
- VoteDeadline ;
- RevealDate ;
- ResolutionMode ;
- CorrectOptionId ;
- CreatedAt ;
- PublishedAt ;
- ResolvedAt ;
- AllowBoosts ;
- AllowSabotage ;
- BaseReward ;
- ShareCode ;
- ShareUrl.

### 29.3. PredictionOption

Représente un choix de réponse.

Champs possibles :

- Id ;
- PredictionId ;
- Label ;
- Description ;
- ImageUrl ;
- SortOrder ;
- CreatedAt.

### 29.4. Vote

Représente le vote d’un participant.

Champs possibles :

- Id ;
- PredictionId ;
- UserId ;
- OptionId ;
- CreatedAt ;
- UpdatedAt ;
- IsCorrect ;
- RewardPoints ;
- UsedCorrectionBoost ;
- IsSecondVote.

### 29.5. Boost

Représente un type de boost.

Champs possibles :

- Id ;
- Name ;
- Description ;
- BoostType ;
- Rarity ;
- EffectValue ;
- IsActive ;
- CreatedAt.

### 29.6. UserBoost

Représente un boost possédé par un utilisateur.

Champs possibles :

- Id ;
- UserId ;
- BoostId ;
- Quantity ;
- AcquiredAt ;
- ExpiresAt.

### 29.7. PredictionBoostUsage

Représente l’utilisation d’un boost sur un pronostic.

Champs possibles :

- Id ;
- PredictionId ;
- UserId ;
- TargetUserId ;
- BoostId ;
- UsedAt ;
- EffectPayload ;
- IsRevealed ;
- WasBlocked.

### 29.8. Badge

Représente un badge à collectionner.

Champs possibles :

- Id ;
- Name ;
- Description ;
- IconUrl ;
- Rarity ;
- ConditionType ;
- ConditionValue ;
- IsSecret ;
- IsActive.

### 29.9. UserBadge

Représente un badge débloqué par un utilisateur.

Champs possibles :

- Id ;
- UserId ;
- BadgeId ;
- UnlockedAt ;
- RelatedPredictionId.

### 29.10. Group

Représente un groupe d’amis.

Champs possibles :

- Id ;
- OwnerId ;
- Name ;
- Description ;
- AvatarUrl ;
- CreatedAt ;
- InviteCode ;
- IsPrivate.

### 29.11. GroupMember

Représente l’appartenance d’un utilisateur à un groupe.

Champs possibles :

- Id ;
- GroupId ;
- UserId ;
- Role ;
- JoinedAt.

### 29.12. Notification

Représente une notification interne.

Champs possibles :

- Id ;
- UserId ;
- Type ;
- Title ;
- Message ;
- RelatedPredictionId ;
- IsRead ;
- CreatedAt.

---

## 30. Statuts recommandés

### 30.1. PredictionStatus

Valeurs possibles :

- Draft ;
- Open ;
- VoteClosed ;
- AwaitingResolution ;
- Resolved ;
- Archived ;
- Cancelled.

### 30.2. ResolutionMode

Valeurs possibles :

- CreatorDecision ;
- GroupValidation ;
- Automatic.

### 30.3. Visibility

Valeurs possibles :

- PrivateLink ;
- GroupOnly ;
- Public.

### 30.4. BoostType

Valeurs possibles :

- VoteCorrection ;
- SecondVote ;
- RewardMultiplier ;
- Sabotage ;
- Shield ;
- Information ;
- Cosmetic.

### 30.5. BadgeRarity

Valeurs possibles :

- Common ;
- Rare ;
- Epic ;
- Legendary ;
- Secret.

---

## 31. Règles métier principales

### 31.1. Création

Un pronostic ne peut pas être publié s’il n’a pas :

- une question ;
- au moins deux choix ;
- une date limite de vote future ;
- un mode de résolution.

### 31.2. Publication

Après publication :

- les choix ne peuvent plus être supprimés s’il y a déjà des votes ;
- la question ne peut plus être changée de manière majeure ;
- la date limite peut être prolongée uniquement si les votes ne sont pas fermés.

### 31.3. Vote

Un utilisateur ne peut voter que si :

- le pronostic est ouvert ;
- la date limite n’est pas passée ;
- il n’a pas déjà voté, sauf boost spécifique ;
- il est autorisé à accéder au pronostic.

### 31.4. Fermeture

À la date limite :

- le pronostic passe en statut VoteClosed ;
- aucun nouveau vote n’est accepté ;
- les boosts de vote ne peuvent plus être utilisés.

### 31.5. Résolution

Un pronostic ne peut être résolu que si :

- les votes sont fermés ;
- une bonne réponse est sélectionnée ;
- l’utilisateur qui résout est autorisé à le faire.

### 31.6. Récompenses

Les récompenses sont calculées après résolution.

L’ordre recommandé :

1. Déterminer les votes gagnants.
2. Calculer la récompense de base.
3. Appliquer les bonus.
4. Appliquer les malus.
5. Appliquer les protections.
6. Attribuer les points.
7. Débloquer les badges.
8. Mettre à jour les statistiques.

---

## 32. Architecture technique recommandée

### 32.1. Type d’application

Application web responsive.

Deux approches possibles :

#### Option A — Application ASP.NET Core MVC / Razor

Avantages :

- simple ;
- rapide à développer ;
- bon choix pour un MVP ;
- moins de séparation frontend/backend.

#### Option B — API ASP.NET Core + frontend React

Avantages :

- plus moderne ;
- meilleure séparation ;
- plus adaptée à une interface interactive ;
- plus facile à faire évoluer vers une application mobile ou PWA.

Recommandation :

> Pour un projet ambitieux, utiliser ASP.NET Core pour l’API et React pour le frontend.  
> Pour un MVP rapide seul, Razor Pages ou MVC peut suffire.

### 32.2. Backend

Technologies possibles :

- ASP.NET Core ;
- Entity Framework Core ;
- ASP.NET Core Identity ;
- API REST ;
- SignalR pour les mises à jour en temps réel ;
- Serilog pour les logs.

### 32.3. Frontend

Technologies possibles :

- React ;
- TypeScript ;
- Tailwind CSS ;
- Vite ;
- PWA éventuelle.

### 32.4. Base de données

Options possibles :

- PostgreSQL ;
- MySQL ;
- SQL Server.

Recommandation :

> PostgreSQL ou MySQL sont adaptés au projet.

### 32.5. Temps réel

SignalR peut être utile pour :

- actualiser les votes en direct ;
- afficher la fermeture des votes ;
- révéler les résultats en même temps à tous les joueurs ;
- notifier les boosts utilisés ;
- animer les pages de résultat.

Pour le MVP, le temps réel peut être remplacé par du rafraîchissement manuel ou du polling simple.

---

## 33. Découpage applicatif recommandé

### 33.1. Domain

Contient les entités métier :

- User ;
- Prediction ;
- PredictionOption ;
- Vote ;
- Boost ;
- Badge ;
- Group ;
- Notification.

### 33.2. Application

Contient les cas d’usage :

- créer un pronostic ;
- publier un pronostic ;
- voter ;
- utiliser un boost ;
- fermer les votes ;
- résoudre un pronostic ;
- calculer les récompenses ;
- débloquer les badges ;
- récupérer le classement.

### 33.3. Infrastructure

Contient :

- base de données ;
- repositories ;
- services techniques ;
- Identity ;
- notifications ;
- logs ;
- stockage fichiers.

### 33.4. Web / API

Contient :

- contrôleurs API ;
- endpoints ;
- authentification ;
- configuration ;
- middlewares ;
- documentation API.

### 33.5. Frontend

Contient :

- pages ;
- composants ;
- services API ;
- gestion d’état ;
- formulaires ;
- animations ;
- responsive design.

---

## 34. Endpoints API possibles

### Auth

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Predictions

- POST /api/predictions
- GET /api/predictions/{id}
- GET /api/predictions/share/{code}
- PUT /api/predictions/{id}
- POST /api/predictions/{id}/publish
- POST /api/predictions/{id}/cancel
- POST /api/predictions/{id}/resolve

### Options

- POST /api/predictions/{id}/options
- PUT /api/options/{id}
- DELETE /api/options/{id}

### Votes

- POST /api/predictions/{id}/vote
- PUT /api/votes/{id}
- GET /api/predictions/{id}/votes

### Boosts

- GET /api/users/me/boosts
- POST /api/predictions/{id}/boosts/use
- GET /api/predictions/{id}/boosts

### Badges

- GET /api/badges
- GET /api/users/{id}/badges

### Leaderboards

- GET /api/leaderboards/global
- GET /api/groups/{id}/leaderboard

### Groups

- POST /api/groups
- GET /api/groups/{id}
- POST /api/groups/{id}/join
- GET /api/groups/{id}/predictions

---

## 35. Priorités de développement

### Priorité 1

- authentification ;
- création de pronostic ;
- partage par lien ;
- vote ;
- fermeture des votes ;
- résolution ;
- résultats.

### Priorité 2

- points ;
- profil ;
- historique ;
- classement simple.

### Priorité 3

- badges ;
- succès ;
- notifications internes.

### Priorité 4

- boosts ;
- sabotages ;
- bouclier ;
- équilibrage.

### Priorité 5

- groupes ;
- saisons ;
- intégration Discord ;
- temps réel.

---

## 36. Risques du projet

### 36.1. Risque de périmètre trop large

Le projet peut vite devenir très gros.

Solution :

> Commencer par un MVP simple sans trop de boosts.

### 36.2. Risque légal

Le mot “pari” et les mécaniques de gain peuvent créer une confusion.

Solution :

> Aucun argent réel, aucune récompense monétisable, communication centrée sur les pronostics sociaux.

### 36.3. Risque d’injustice

Les boosts peuvent frustrer les joueurs.

Solution :

> Limiter les boosts, ajouter des contreparties, rendre les effets visibles après la partie.

### 36.4. Risque de triche

Les utilisateurs peuvent créer plusieurs comptes ou manipuler les résultats.

Solution :

> Verrouillage, logs, limitations, résolution transparente, minimum de participants.

### 36.5. Risque UX

Trop de règles peuvent rendre le jeu difficile à comprendre.

Solution :

> Interface simple, règles affichées clairement, boosts introduits progressivement.

---

## 37. Nom de projet provisoire

Le nom final reste à définir.

Pistes possibles :

- GuessUp ;
- Predik ;
- Betwiin ;
- CallIt ;
- Verdict ;
- Oracle Club ;
- PronoParty ;
- Choix Final ;
- QuiDitVrai ;
- FriendCast ;
- Wagerless ;
- GuessGang ;
- Vote & Chaos.

Le nom doit évoquer :

- la prédiction ;
- le vote ;
- le jeu entre amis ;
- le suspense ;
- la révélation.

Il doit éviter de trop évoquer les jeux d’argent.

---

## 38. Proposition de slogan

Exemples :

> Crée des pronostics entre amis, vote, trahis, gagne des badges.
> Le jeu où tes amis deviennent tes pires adversaires.
> Pose une question, fais voter tes amis, révèle les gagnants.
> Des prédictions, des boosts, du chaos et beaucoup de mauvaise foi.
> Le party game de pronostics à partager par lien.

---

## 39. Conclusion

Le projet est viable, amusant et suffisamment original pour devenir une vraie application web sociale.

Sa force vient de son mélange entre :

- création libre de questions ;
- vote entre amis ;
- suspense jusqu’à la révélation ;
- points fictifs ;
- badges à collectionner ;
- boosts stratégiques ;
- sabotage contrôlé ;
- classements et progression.

La priorité doit être de construire une première version simple, claire et jouable.

Le cœur du MVP doit être :

> Créer un pronostic, partager le lien, faire voter ses amis, révéler les gagnants.

Une fois ce cœur solide, le projet pourra évoluer vers un véritable jeu social complet avec badges, boosts, groupes, saisons, classements et événements.