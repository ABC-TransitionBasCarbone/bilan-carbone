web: sh -c 'if [ "$POSTGRES_PRISMA_URL" | grep -qi "mip" ]; then node apps/mip/.next/standalone/apps/mip/server.js; else node apps/bilan-carbone/.next/standalone/apps/bilan-carbone/server.js; fi'
postdeploy: npx prisma migrate deploy --schema packages/db-common/prisma/schema; fi'
