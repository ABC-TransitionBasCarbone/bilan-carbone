This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Run this import scripts in the production environnement (change the value of the FE:import version):

```json
{
  "negaOctet:import": "ts-node src/scripts/negaOctet/getEmissionFactors.ts -n 1 -f src/scripts/negaOctet/negaoctet.csv",
  "legifrance:froid:import": "ts-node src/scripts/legifrance/getEmissionFactors.ts -n 1 -f src/scripts/legifrance/reseaux_froid.csv -r froid",
  "legifrance:chaud:import": "ts-node src/scripts/legifrance/getEmissionFactors.ts -n 1 -f src/scripts/legifrance/reseaux_chaud.csv -r chaud",
  "actualities:import": "ts-node src/scripts/actuality/add.ts -f src/scripts/actuality/actualities.csv",
  "FE:import": "ts-node src/scripts/baseEmpreinte/getEmissionFactors.ts -n 23.4"
}
```

## Deploy on Scalingo
