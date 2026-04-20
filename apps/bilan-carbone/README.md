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

5. **Set up Publicodes local development** (optionnal)

   ```bash
   # Recompile Publicodes rules (one time)
   yarn publicodes-count:compile

   # In an other terminal watch changes
   yarn publicodes-count:watch
   ```

6. **Run the development server**

   ```bash
   yarn dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

## Import scripts

These scripts must be run from apps/bilan-carbone:

### Import emission factors from NegaOctet

```bash
yarn tsx src/scripts/negaOctet/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFile}
```

### Import emission factors from Legifrance

```bash
yarn tsx src/scripts/legifrance/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFile}
```

### Import emission factors from Base Empreinte

```bash
# Prévisualiser un import sans écrire en base
yarn tsx src/scripts/baseEmpreinte/getEmissionFactors.ts -n ${versionNumberBaseEmpreinte} -f ${pathToCSVFile} --dry-run

# Importer la base empreinte
yarn tsx src/scripts/baseEmpreinte/getEmissionFactors.ts -n ${versionNumberBaseEmpreinte} -f ${pathToCSVFile}

# Importer la base empreinte en conservant les correctifs manuels existants en cas de conflit
yarn tsx src/scripts/baseEmpreinte/getEmissionFactors.ts -n ${versionNumberBaseEmpreinte} -f ${pathToCSVFile} --keep-overrides

# Importer la base empreinte en supprimant les correctifs manuels existants en cas de conflit
yarn tsx src/scripts/baseEmpreinte/getEmissionFactors.ts -n ${versionNumberBaseEmpreinte} -f ${pathToCSVFile} --discard-overrides

# Preview overrides to emission factors (overrides)
yarn tsx src/scripts/baseEmpreinte/applyOverrides.ts -f ${pathToCSVFile} --dry-run

# Apply overrides to emission factors on an existing version
yarn tsx src/scripts/baseEmpreinte/applyOverrides.ts -f ${pathToCSVFile}

# Export existing overrides to Excel to modify or add new ones
yarn tsx src/scripts/baseEmpreinte/exportOverrides.ts
```

### Create BEGES rules

```bash
yarn tsx src/scripts/exportRules/beges.ts
```

### Import actualities

```bash
yarn tsx src/scripts/actuality/add.ts -f ${pathToCSVFile}
```

### Import CNC data

Import CNC data from a [CSV file](https://www.cnc.fr/cinema/etudes-et-rapports/statistiques/geolocalisation-des-cinemas-actifs-en-france) :

```bash
yarn tsx src/scripts/cnc/add.ts -f ${pathToCSVFile}
```

### Delete answers of a question

```bash
yarn tsx src/scripts/questions/deleteAnswersWithCleanup.ts -q "question-intern-id-here"
```

### Scripts lancés par CRON

Import users from the FTP server : `curl -X POST $NEXT_API_URL/cron/import-users -H "Authorization: Bearer $CRON_SECRET"`

Create training studies for users who have started or ended a formation : `curl -X POST $NEXT_API_URL/cron/assign-training-studies -H "Authorization: Bearer $CRON_SECRET"`

### Import Secten data

Import Secten data by creating a new version or updating an existing version if the version name is already used :

```bash
yarn tsx src/scripts/secten/importSectenData.ts -y ${versionYear} -f ${pathToCSVFileSecten}
```

The CSV file is created manually from the Excel file available on the Secten website.

- Find the file <https://www.citepa.org/donnees-air-climat/donnees-gaz-a-effet-de-serre/secten/> > "Données de GES ed X"
- Download the file 01 > Tab CO2e-UE
- Copy the values of lines 7 to 14, except line 13, into the excel template file.
- Then export the excel file to CSV with the delimiter ";" and the format "UTF-8".

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

### Run Publicodes test

```bash
yarn publicodes-count:test
yarn publicodes-clickson:test
yarn publicodes-tilt:test
```

### Run Cypress tests

```bash
# Add environment variables to the test database
Create a `.env.test` file in the root directory and copy the content of `.env.test.dist` to it.

# Start the app in test environment connected to the test database
yarn dev:test

# Run Cypress tests
yarn cypress

# Run a specific test file
yarn cypress --spec "src/tests/end-to-end/app/auth.cy.ts"

# Open Cypress GUI
yarn cypress:gui
```

### Run Publicodes tests

```bash
# Run tests
yarn publicodes-count:test
```

## Deploy on Scalingo

Follow Scalingo deployment guidelines for Next.js applications.

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
