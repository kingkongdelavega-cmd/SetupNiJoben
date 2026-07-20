let supabaseClientGetter = () => require('./supabaseClient').getSupabase()

function __setSupabaseClient(getterFn) {
  // getterFn must return a Supabase-like client with `.from()`.
  supabaseClientGetter = getterFn
}

async function getAllInventory() {
  const supabase = supabaseClientGetter()

  const { data, error } = await supabase.from('inventory').select('*')

  if (error) {
    const err = new Error(error.message || 'Failed to fetch inventory')
    err.statusCode = error.statusCode || 500
    throw err
  }

  return data
}

async function getInventoryById(id) {
  const supabase = supabaseClientGetter()

  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    const err = new Error(error.message || 'Failed to fetch inventory item')
    err.statusCode = error.statusCode || 500
    throw err
  }

  return data
}

async function createInventory(row) {
  const supabase = supabaseClientGetter()

  const { data, error } = await supabase
    .from('inventory')
    .insert(row)
    .select()
    .single()

  if (error) {
    const err = new Error(error.message || 'Failed to create inventory item')
    err.statusCode = error.statusCode || 500
    throw err
  }

  return data
}

async function updateInventory(id, changes) {
  const supabase = supabaseClientGetter()

  const { data, error } = await supabase
    .from('inventory')
    .update(changes)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    const err = new Error(error.message || 'Failed to update inventory item')
    err.statusCode = error.statusCode || 500
    throw err
  }

  return data
}

async function deleteInventory(id) {
  const supabase = supabaseClientGetter()

  const { error } = await supabase.from('inventory').delete().eq('id', id)

  if (error) {
    const err = new Error(error.message || 'Failed to delete inventory item')
    err.statusCode = error.statusCode || 500
    throw err
  }

  return true
}

module.exports = {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  __setSupabaseClient,
}