# Bilan Carbone

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Get started

### Prerequisites

- Node.js >=22
- Yarn 1.22
- Docker and Docker Compose

### Setup Steps

1. **Install dependencies**

   ```bash
   yarn install
   ```

2. **Environment setup**

   Create a `.env` copied from `.env.dist` in the root directory and a `.env.test` copied from `.env.test.dist` in the root directory.

3. **Start the database**

   ```bash
   docker-compose up -d
   ```

4. **Set up the database with Prisma**

   ```bash
   # Push all migrations to the database
   npx prisma migrate deploy

   # Seed the database
   npx prisma db seed
   ```

5. **Run the development server**

   ```bash
   yarn dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

## Import Scripts

Run these import scripts in the production environment (change the value of the version):

Importer les facteurs d'emissions de negaoctet :
`npx tsx src/scripts/negaOctet/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFileNegaOctet}`

Importer les facteurs d'emissions de legifrance :
`npx tsx src/scripts/legifrance/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFileLegifrance}`

Importer les facteurs d'emissions de la base empreinte :
`npx tsx src/scripts/baseEmpreinte/getEmissionFactors.ts -n ${versionNumberBaseEmpreinte}"`

Créer les règles de gestion du BEGES :
`npx tsx src/scripts/exportRules/beges.ts`

Importer les actualités depuis un CSV :
`npx tsx src/scripts/actuality/add.ts -f ${pathToCSVFileActuality}`

Importer les Donnée cartographie depuis un [CSV du CNC](https://www.cnc.fr/cinema/etudes-et-rapports/statistiques/geolocalisation-des-cinemas-actifs-en-france) :
`npx tsx src/scripts/cnc/add.ts -f ${pathToCSVFileCNC}`

## Prisma Commands

```bash
# Apply in progress changes to the database
npx prisma db push

# Create new migration after a schema change
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio
```

## Testing

### Run unit tests

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test:watch
```

### Run Cypress tests

```bash
# Start the app in test environment connected to the test database
yarn dev:test

# Run Cypress tests
yarn cypress

# Run a specific test file
yarn cypress --spec "src/tests/end-to-end/app/auth.cy.ts"

# Open Cypress GUI
yarn cypress:gui
```

## Deploy on Scalingo

Follow Scalingo deployment guidelines for Next.js applications.
