import { defineConfig } from 'prisma/config'

export default defineConfig({
  engineType: 'library',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
