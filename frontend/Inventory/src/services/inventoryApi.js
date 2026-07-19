const BASE_URL = ''

async function handleJsonResponse(res) {
  const text = await res.text()
  const data = text ? (() => { try { return JSON.parse(text) } catch { return null } })() : null

  if (!res.ok) {
    const message = data?.error?.message || data?.error || data?.message || `Request failed: ${res.status}`
    const err = new Error(message)
    err.status = res.status
    err.payload = data
    throw err
  }

  return data
}

export async function fetchInventory({ q, category } = {}) {
  const params = new URLSearchParams()
  if (typeof q === 'string' && q.trim()) params.set('q', q.trim())
  if (typeof category === 'string' && category.trim()) params.set('category', category.trim())

  const qs = params.toString()
  const url = `${BASE_URL}/api/inventory${qs ? `?${qs}` : ''}`

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  const json = await handleJsonResponse(res)
  return json?.data ?? []
}

export async function updateInventory(id, { quantity, reason, notes } = {}) {
  if (!id) {
    const err = new Error('`id` is required')
    err.status = 400
    throw err
  }

  const url = `${BASE_URL}/api/inventory/${encodeURIComponent(id)}`

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity, reason, notes }),
  })

  const json = await handleJsonResponse(res)
  return json?.data
}

