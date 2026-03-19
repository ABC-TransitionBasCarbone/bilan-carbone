web: node apps/bilan-carbone/.next/standalone/apps/bilan-carbone/server.js
postdeploy: cd apps/bilan-carbone && npx prisma@6 migrate deploy --schema ../../packages/db-common/prisma/schema
