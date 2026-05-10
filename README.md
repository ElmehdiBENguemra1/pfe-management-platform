# Plateforme de Gestion des Projets de Fin d'Études (PFE)

Bienvenue dans le dépôt du projet de plateforme de gestion des PFE. Ce projet a été conçu pour simplifier et centraliser la gestion des stages et des projets de fin d'études pour les étudiants, les encadrants et les administrateurs.

---

## 🌟 Présentation Globale du Projet

L'objectif principal de cette plateforme est d'offrir un espace de travail collaboratif complet permettant de suivre le cycle de vie d'un PFE, de la proposition du sujet jusqu'à la soutenance finale.

### Fonctionnalités Clés :
- **Gestion des Utilisateurs** : Inscription, authentification et gestion des profils (Étudiant, Encadrant, Administrateur).
- **Gestion des Projets** : Soumission de sujets, affectation d'étudiants et suivi de l'avancement.
- **Espace de Travail Collaboratif** : Messagerie instantanée, partage de documents et suivi des jalons (milestones).
- **Notifications en Temps Réel** : Alertes pour les nouvelles candidatures, messages ou mises à jour de projets.
- **Tableau de Bord** : Vue d'ensemble de l'état des projets pour chaque type d'utilisateur.

---

## 🚀 Guide de Test Étape par Étape

Pour tester l'application dans son ensemble, voici le parcours recommandé :

1.  **Authentification** : Connectez-vous avec un compte étudiant ou encadrant.
2.  **Exploration des Sujets** : Consultez les projets disponibles ou créez une nouvelle proposition (si encadrant).
3.  **Candidature** : Postulez à un projet (si étudiant) et gérez les candidatures reçues (si encadrant).
4.  **Espace Projet** : Une fois un projet validé, accédez à l'espace de travail dédié pour voir le chat en temps réel et les fichiers partagés.
5.  **Suivi** : Créez des jalons pour marquer les étapes importantes du projet.

---

## 🛠️ Installation et Configuration

Suivez ces étapes pour lancer le projet localement :

### Prérequis
- **Java 17** ou supérieur
- **Node.js** (v16+)
- **MySQL** (ou une autre base de données compatible)
- **Maven**

### 1. Configuration de la Base de Données
- Créez une base de données MySQL nommée `pfe_db`.
- Mettez à jour le fichier `backend/src/main/resources/application.properties` avec vos identifiants MySQL si nécessaire.

#### Option A : Démarrage à vide (Schéma automatique)
L'application est configurée pour créer automatiquement les tables lors du premier lancement grâce à Hibernate (`ddl-auto=update`).

#### Option B : Importer les données de test (Recommandé)
Pour avoir accès aux comptes de test (étudiants, encadrants) et aux projets déjà créés :
1. Localisez le fichier `database.sql` à la racine du projet.
2. Importez-le dans votre base `pfe_db` via votre outil favori (phpMyAdmin, MySQL Workbench ou en ligne de commande) :
   ```bash
   mysql -u root -p pfe_db < database.sql
   ```

---

### 2. Lancement du Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
Le serveur backend sera disponible sur `http://localhost:8080`.

### 3. Lancement du Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Le frontend sera accessible sur `http://localhost:5173` (ou l'URL affichée dans votre terminal).

---

## 📝 Note à l'attention de l'encadrant

Monsieur/Madame,

Ce projet est actuellement en cours de développement. Les fonctionnalités de base (authentification, gestion des projets, chat, documents) sont opérationnelles, mais certaines parties font encore l'objet d'optimisations.

Je suis très ouvert à vos **remarques et suggestions d'amélioration**. Votre expertise m'aidera à affiner les fonctionnalités restantes et à garantir que la plateforme réponde parfaitement aux besoins académiques.

N'hésitez pas à me faire part de vos retours sur l'ergonomie, la logique métier ou toute fonctionnalité additionnelle que vous jugeriez pertinente.

---

*Développé dans le cadre du stage de fin d'études.*
