web: sh -c 'if [ "$APP_TARGET" = "mip" ]; then exec node apps/mip/.next/standalone/apps/mip/server.js; else exec node apps/bilan-carbone/.next/standalone/apps/bilan-carbone/server.js; fi'
postdeploy: cd apps/bilan-carbone && npx prisma migrate deploy --schema ../../packages/db-common/prisma/schema
