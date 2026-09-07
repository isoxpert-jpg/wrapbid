import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // sharp is used server-side to read uploaded image dimensions; keep it external
  // so Next doesn't try to bundle its native binaries.
  serverExternalPackages: ['sharp', '@prisma/client', 'better-sqlite3'],
}

export default nextConfig
