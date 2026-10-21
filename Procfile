web: sh -c 'exec node apps/$APP_TARGET/.next/standalone/apps/$APP_TARGET/server.js'
postdeploy: npx prisma migrate deploy --config packages/common/db/prisma.config.ts --schema packages/common/db/prisma/schema
