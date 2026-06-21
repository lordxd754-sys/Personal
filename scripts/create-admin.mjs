import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import crypto from 'node:crypto'

dotenv.config({ path: '.env.local' })

const email = process.env.ADMIN_EMAIL || 'admin@ptmanager.com'
const name = process.env.ADMIN_NAME || 'Administrador PT Manager'
const providedPassword = Boolean(process.env.ADMIN_PASSWORD)
const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(18).toString('base64url')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const hashedPassword = await bcrypt.hash(password, 12)

const { data: existing, error: lookupError } = await supabase
  .from('User')
  .select('id,email')
  .eq('email', email.toLowerCase())
  .limit(1)

if (lookupError) throw lookupError

let result
if (existing && existing.length > 0) {
  result = await supabase
    .from('User')
    .update({ name, password: hashedPassword })
    .eq('email', email.toLowerCase())
    .select('id,email')
    .single()
} else {
  result = await supabase
    .from('User')
    .insert({ name, email: email.toLowerCase(), password: hashedPassword })
    .select('id,email')
    .single()
}

if (result.error) throw result.error

console.log(JSON.stringify({
  ok: true,
  action: existing && existing.length > 0 ? 'updated_existing_admin' : 'created_admin',
  id: result.data.id,
  email: result.data.email,
  password: providedPassword ? '[ADMIN_PASSWORD fornecida via ambiente]' : password,
}, null, 2))
