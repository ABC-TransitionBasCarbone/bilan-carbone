This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Run this import scripts in the production environnement (change the value of the FE:import version):

Importer les facteurs d'emissions de negaoctet :
`npx ts-node src/scripts/negaOctet/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFileNegaOctet}`

Importer les facteurs d'emissions de legifrance froid :
`npx ts-node src/scripts/legifrance/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFileLegifranceCold} -r froid`

Importer les facteurs d'emissions de legifrance chaud :
`npx ts-node src/scripts/legifrance/getEmissionFactors.ts -n ${versionNumber} -f ${pathToCSVFileLegifranceHot} -r chaud`

Importer les facteurs d'emissions de la base empreinte :
`npx ts-node src/scripts/baseEmpreinte/getEmissionFactors.ts -n ${versionNumberBaseEmpreinte}"`

Importer les actualités depuis un CSV :
`npx ts-node src/scripts/actuality/add.ts -f ${pathToCSVFileActuality}`

## Prisma

Update :
npx prisma db push
Create new migration after a change :
npx prisma migrate dev

## Deploy on Scalingo
