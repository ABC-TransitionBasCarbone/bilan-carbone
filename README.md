# Bilan Carbone — Monorepo

Ce monorepo contient les applications et packages partagés du projet Bilan Carbone.
This monorepo contains apps and shared packages for Bilan Carbone & MEP Pro

## Get started

### Prerequisites

- Node.js = 24.18.0
- Yarn 1.22
- Docker et Docker Compose

### Setup Steps

Execute these commands from the **root directory**

### 1. Install dependencies

```bash
yarn install
```

### 2. Variables d'environnement

Create a `.env` copied from `apps/bc/.env.dist` and create a `.env.test` copied from `apps/bc/.env.test.dist`.
Do the same in db-common folder.

```bash
cp apps/bc/.env.dist apps/bc/.env
cp apps/bc/.env.test.dist apps/bc/.env.test
cp packages/db/.env.dist packages/db/.env
```

### 3. Start the database

```bash
cd apps/bc && docker-compose up -d && cd ../..
```

### 4. Set up the database with Prisma

```bash
yarn prisma migrate dev
```

Or in production :

```bash
yarn prisma migrate deploy
```

### 5. Seed the database (cannot use the yarn prisma shortcut)

```bash
yarn workspace bc prisma db seed
```

OR use the shortcut:

```bash
yarn seed
```

### 6. Generated prisma client

```bash
yarn prisma generate
```

### 7. Run the development serve

```bash
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Commands by workspace

### bc application

```bash
# Development
yarn workspace bc dev

# Build
yarn workspace bc build

# Unit tests
yarn workspace bc test

# Cypress e2e tests
yarn workspace bc cypress

# Reset test database
yarn workspace bc db:test:reset
```

### Database (db)

````bash
# Create a new migration
yarn prisma migrate dev

# Reset the database
yarn prisma migrate reset

# Apply migrations
yarn prisma migrate deploy

# Check migration status
yarn prisma migrate status

# Generate Prisma client
yarn prisma generate

# Prisma Studio
yarn prisma studio

---

## Import scripts

These scripts must be run from apps/bc:

```bash
cd apps/bc

# Importer les facteurs d'émissions NegaOctet
npx tsx src/scripts/negaOctet/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFile}

# Importer les facteurs d'émissions Légifrance
npx tsx src/scripts/legifrance/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFile}

# Importer les facteurs d'émissions Base Empreinte
npx tsx src/scripts/baseEmpreinte/getEmissionFactors.ts -n ${versionNumberBaseEmpreinte}

# Créer les règles BEGES
npx tsx src/scripts/exportRules/beges.ts

# Importer les actualités
npx tsx src/scripts/actuality/add.ts -f ${pathToCSVFile}

# Importer les données CNC
npx tsx src/scripts/cnc/add.ts -f ${pathToCSVFile}

# Supprimer les réponses d'une question
npx tsx src/scripts/questions/deleteAnswersWithCleanup.ts -q "question-intern-id-here"

# Importer les données Secten
npx tsx src/scripts/secten/importSectenData.ts -y ${versionYear} -f ${pathToCSVFile}
````

---

## Tests

### Run Unit tests

```bash
yarn workspace bc test

# Watch mode
yarn workspace bc test:watch
```

## Deploy on Scalingo

Migrations are automatically applied via the Procfile on each deployment

## Dependency Upgrades

### Upgrades

To upgrade packages to the latest version, run the following command:

```bash
yarn upgrade-interactive --latest
```

It's also possible to force upgrade all packages to the latest version, but that will include potential breaking changes:

```bash
yarn upgrade --latest
```

To list possible upgrades, run the following command:

```bash
yarn outdated
```

### Vulnerabilities

To check for vulnerabilities, run the following command:

```bash
yarn audit
```

Then, try the upgade command to choose the packages to upgrade or manually upgrade the dependencies:

```bash
yarn upgrade-interactive --latest
```

Then, run the following command to check if the vulnerabilities are fixed:

```bash
yarn audit
```
