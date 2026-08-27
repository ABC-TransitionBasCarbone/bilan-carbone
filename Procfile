web: node apps/$APP_TARGET/.next/standalone/apps/$APP_TARGET/server.js
postdeploy: npx prisma migrate deploy --config packages/db-common/prisma.config.ts --schema packages/db-common/prisma/schema
