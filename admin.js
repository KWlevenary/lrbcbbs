import { supabase } from './supabase.js'

export async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return !!(data && data.role === 'admin')
}

export async function requireAdmin() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    location.href = 'login.html?redirect=' + redirect
    return null
  }
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!data || data.role !== 'admin') {
    alert('你不是管理员')
    location.href = 'index.html'
    return null
  }
  return user
}