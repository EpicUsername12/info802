# Comment utiliser l'application

Il vous faut démarrer/déployer ces deux composants:

- soap
- client

# soap

Pour le lancer:

```shell
cd soap
python ./soap_server.py # (ou python3)
```

Pré-requis:

```shell
pip install requests lxml spyne
```

Il se lancera sur "0.0.0.0:22220", ce sera à vous de gérer l'HTTP/HTTPS avec nginx ou un autre outil tiers pour la connexion si ce port ne vous plait pas.

# client

Il s'agit d'un site Next.js

Pré-requis:

- Node.js 18+
- npm

```shell
npm i
```

Pour le construire/lancer (en mode dev):

```shell
npm run dev
```

Pour le construire/lancer:

```shell
npm run build
npm run start
```

- Le site se lancera sur `http://localhost:3000`

Ce sera donc à vous de gérer son accès par HTTP/HTTPS (sur les ports standard 80/443) avec nginx ou bien un outil de déploiement comme "Vercel".

# client (Environnement)

Un fichier de variable d'environnement doit exister et s'appeler `.env` dans le dossier `/client`

Avec la variable suivante: `SOAP_PUBLIC_URL` pointant vers l'adresse publique du serveur SOAP.

# Note: déploiement

Ce repo est déjà parametré grâce à Vercel et se déploiera automatiquement sur [https://info802.tarikchettibi.fr](https://info802.tarikchettibi.fr)
