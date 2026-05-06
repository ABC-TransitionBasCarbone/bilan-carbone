# Bilan Carbone — Monorepo

Ce monorepo contient les applications et packages partagés du projet Bilan Carbone.
This monorepo contains apps and shared packages for Bilan Carbone & MEP Pro

## Get started

### Prerequisites

- Node.js >= 22.16.0
- Yarn 1.22
- Docker et Docker Compose

### Setup Steps

Execute these commands from the **root directory**

### 1. Install dependencies

```bash
yarn install
```

### 2. Variables d'environnement

Create a `.env` copied from `apps/bilan-carbone/.env.dist` and create a `.env.test` copied from `apps/bilan-carbone/.env.test.dist`.
Do the same in db-common folder.

```bash
cp apps/bilan-carbone/.env.dist apps/bilan-carbone/.env
cp apps/bilan-carbone/.env.dist.test apps/bilan-carbone/.env.test
cp packages/db-common/.env.dist packages/db-common/.env
```

### 3. Start the database

```bash
cd apps/bilan-carbone && docker-compose up -d && cd ../..
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
yarn workspace bilan-carbone prisma db seed
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

### bilan-carbone application

```bash
# Development
yarn workspace bilan-carbone dev

# Build
yarn workspace bilan-carbone build

# Unit tests
yarn workspace bilan-carbone test

# Cypress e2e tests
yarn workspace bilan-carbone cypress

# Reset test database
yarn workspace bilan-carbone db:test:reset
```

### Database (db-common)

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

These scripts must be run from apps/bilan-carbone:

```bash
cd apps/bilan-carbone

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
yarn workspace bilan-carbone test

# Watch mode
yarn workspace bilan-carbone test:watch
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
