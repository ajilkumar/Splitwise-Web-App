// import { PrismaClient } from './generated/prisma/client'
// import { PrismaPg } from '@prisma/adapter-pg'
// import { Pool, PoolConfig } from 'pg'

// const globalForPrisma = global as unknown as { prisma: PrismaClient }

// const connectionString = process.env.DATABASE_URL

// if (!connectionString) {
//   throw new Error('DATABASE_URL is not set')
// }

// const normalizeCertificate = (cert?: string) =>
//   cert?.replace(/\\n/g, '\n').trim()

// const shouldAllowSelfSigned =
//   process.env.DATABASE_SSL_ALLOW_SELFSIGNED === 'true' ||
//   process.env.NODE_ENV !== 'production'

// const customCa = normalizeCertificate(process.env.DATABASE_SSL_CA)

// const ssl: PoolConfig['ssl'] =
//   connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
//     ? false
//     : customCa
//       ? { ca: customCa }
//       : shouldAllowSelfSigned
//         ? { rejectUnauthorized: false }
//         : true

// const pool = new Pool({
//   connectionString,
//   ssl,
// })

// const adapter = new PrismaPg(pool)

// const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

// if (process.env.NODE_ENV !== 'production') {
//   globalForPrisma.prisma = prisma
// }

// export default prisma

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
