import { createClient } from '@supabase/supabase-js'

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'wrapbid-private'

function storageClient() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) throw new Error('Supabase Storage is not configured.')
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from(bucket)
}

export async function uploadPrivateObject(path: string, body: Buffer, contentType: string) {
  const { error } = await storageClient().upload(path, body, { contentType, upsert: false })
  if (error) throw new Error(`Could not store upload: ${error.message}`)
  return path
}

export async function downloadPrivateObject(path: string) {
  const { data, error } = await storageClient().download(path)
  if (error) throw new Error(`Could not load upload: ${error.message}`)
  return Buffer.from(await data.arrayBuffer())
}
