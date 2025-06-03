This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Run this import scripts in the production environnement (change the value of the FE:import version):

Importer les facteurs d'emissions de negaoctet :
`npx tsx src/scripts/negaOctet/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFileNegaOctet}`

Importer les facteurs d'emissions de legifrance :
`npx tsx src/scripts/legifrance/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFileLegifrance} `

Importer les facteurs d'emissions de la base empreinte :
`npx tsx src/scripts/baseEmpreinte/getEmissionFactors.ts -n ${versionNumberBaseEmpreinte}"`

Créer les règles de gestion du BEGES :
`npx tsx src/scripts/exportRules/beges.ts`

Importer les actualités depuis un CSV :
`npx tsx src/scripts/actuality/add.ts -f ${pathToCSVFileActuality}`

Importer les Donnée cartographie depuis un [CSV du CNC](https://www.cnc.fr/cinema/etudes-et-rapports/statistiques/geolocalisation-des-cinemas-actifs-en-france) :
`npx tsx src/scripts/cnc/add.ts -f ${pathToCSVFileCNC}`

## Prisma

Update :
npx prisma db push
Create new migration after a change :
npx prisma migrate dev

## Deploy on Scalingo
