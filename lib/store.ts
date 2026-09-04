import { 
  Product, 
  Sale, 
  InventoryMovement, 
  CardMachineRate, 
  Customer, 
  StoreSettings 
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_CARD_MACHINES, 
  INITIAL_SETTINGS, 
  INITIAL_SALES 
} from './sample-data';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  PRODUCTS: 'absolut_products_v1',
  SALES: 'absolut_sales_v1',
  MOVEMENTS: 'absolut_movements_v1',
  CARD_MACHINES: 'absolut_machines_v1',
  CUSTOMERS: 'absolut_customers_v1',
  SETTINGS: 'absolut_settings_v1',
};

// ==========================================
// FUNÇÕES DE PRODUTOS
// ==========================================
export async function getProducts(): Promise<Product[]> {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Falha de conexão com o banco de dados Supabase: ' + error.message);
      }
      if (data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data));
        return data as Product[];
      }
    } catch (err: any) {
      console.error('Erro crítico ao carregar produtos do Supabase:', err);
      throw err;
    }
  }

  // Se Supabase não estiver configurado
  const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_PRODUCTS;
  }
}


export async function saveProduct(product: Partial<Product>): Promise<Product> {
  const products = await getProducts();
  let updated: Product;

  if (product.id && products.some(p => p.id === product.id)) {
    updated = {
      ...(products.find(p => p.id === product.id)!),
      ...product,
    } as Product;
    const list = products.map(p => p.id === product.id ? updated : p);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
  } else {
    updated = {
      id: product.id || 'prod-' + Date.now(),
      name: product.name || 'Nova Fragrância',
      brand: product.brand || 'Absolut Parfum',
      concentration: product.concentration || 'Eau de Parfum (EDP)',
      volume_ml: Number(product.volume_ml) || 100,
      olfactory_family: product.olfactory_family || 'Amadeirado',
      gender: product.gender || 'Compartilhável',
      sku: product.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      barcode: product.barcode || '',
      cost_price: Number(product.cost_price) || 0,
      sale_price: Number(product.sale_price) || 0,
      stock_quantity: Number(product.stock_quantity) || 0,
      min_stock: Number(product.min_stock) || 2,
      image_url: product.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=600',
      ncm: product.ncm || '3303.00.10',
      description: product.description || '',
      active: product.active ?? true,
      created_at: new Date().toISOString(),
    };
    const list = [updated, ...products];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('products').upsert(updated);
    if (error) {
      throw new Error('Falha ao sincronizar produto com o banco online Supabase: ' + error.message);
    }
  }

  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      throw new Error('Falha ao excluir produto no Supabase: ' + error.message);
    }
  }
}


export async function importProductsBatch(newItems: Partial<Product>[]): Promise<{ inserted: number; updated: number }> {
  const current = await getProducts();
  let inserted = 0;
  let updated = 0;
  const list = [...current];

  for (const item of newItems) {
    if (!item.name) continue;
    const existingIndex = list.findIndex(p => 
      (item.sku && p.sku === item.sku) || 
      (p.name.toLowerCase().trim() === item.name?.toLowerCase().trim() && p.brand.toLowerCase().trim() === (item.brand || '').toLowerCase().trim())
    );

    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...item,
        cost_price: Number(item.cost_price ?? list[existingIndex].cost_price),
        sale_price: Number(item.sale_price ?? list[existingIndex].sale_price),
        stock_quantity: Number(item.stock_quantity ?? list[existingIndex].stock_quantity),
      };
      updated++;
    } else {
      const brand = item.brand || 'Absolut Parfum';
      const cleanSku = item.sku || (brand.substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000));
      const newProduct: Product = {
        id: item.id || 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        name: item.name,
        brand: brand,
        concentration: item.concentration || 'Eau de Parfum (EDP)',
        volume_ml: Number(item.volume_ml) || 100,
        olfactory_family: item.olfactory_family || 'Amadeirado',
        gender: item.gender || 'Compartilhável',
        sku: cleanSku,
        barcode: item.barcode || '',
        cost_price: Number(item.cost_price) || 0,
        sale_price: Number(item.sale_price) || 0,
        stock_quantity: Number(item.stock_quantity) || 0,
        min_stock: Number(item.min_stock) || 2,
        image_url: item.image_url || 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=600',
        ncm: item.ncm || '3303.00.10',
        description: item.description || '',
        active: true,
        created_at: new Date().toISOString(),
      };
      list.push(newProduct);
      inserted++;
    }
  }

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('products').upsert(list);
    if (error) {
      throw new Error('Falha ao sincronizar lote de produtos com o Supabase: ' + error.message);
    }
  }

  return { inserted, updated };
}


// ==========================================
// FUNÇÕES DE VENDAS (PDV)
// ==========================================
export async function getSales(): Promise<Sale[]> {
  if (typeof window === 'undefined') return INITIAL_SALES;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          items:sale_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Falha de conexão com as vendas online no Supabase: ' + error.message);
      }
      if (data) {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data));
        return data as Sale[];
      }
    } catch (err: any) {
      console.error('Erro crítico ao buscar vendas no Supabase:', err);
      throw err;
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.SALES);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    return INITIAL_SALES;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_SALES;
  }
}

export async function createSale(saleData: Omit<Sale, 'id' | 'code' | 'created_at'>): Promise<Sale> {
  const sales = await getSales();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nextSeq = String(sales.length + 1).padStart(3, '0');
  const code = `ABS-${dateStr}-${nextSeq}`;

  const newSale: Sale = {
    ...saleData,
    id: 'sale-' + Date.now(),
    code,
    created_at: new Date().toISOString(),
  };

  // 1. Salvar venda no Supabase (online obrigatório)
  if (isSupabaseConfigured && supabase) {
    const { items, ...saleRecord } = newSale;
    const { error: saleErr } = await supabase.from('sales').insert([saleRecord]);
    if (saleErr) {
      throw new Error('Falha ao registrar venda online no Supabase: ' + saleErr.message);
    }
    const itemsToInsert = items.map(it => ({
      ...it,
      sale_id: newSale.id,
    }));
    const { error: itemsErr } = await supabase.from('sale_items').insert(itemsToInsert);
    if (itemsErr) {
      console.warn('Erro ao inserir itens da venda no Supabase:', itemsErr);
    }
  }

  // 2. Salvar venda local
  const updatedSales = [newSale, ...sales];
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

  // 3. Dar baixa no estoque de cada produto vendido
  const products = await getProducts();
  const movements: InventoryMovement[] = [];

  for (const item of newSale.items) {
    const prodIndex = products.findIndex(p => p.id === item.product_id);
    if (prodIndex >= 0) {
      const prev = products[prodIndex].stock_quantity;
      const nextStock = Math.max(0, prev - item.quantity);
      products[prodIndex].stock_quantity = nextStock;

      movements.push({
        id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        product_id: item.product_id,
        product_name: item.product_name,
        type: 'SAIDA',
        quantity: item.quantity,
        previous_stock: prev,
        new_stock: nextStock,
        reason: `Venda PDV: ${code}`,
        reference_id: newSale.id,
        user_name: newSale.seller_name || 'Vendedor',
        created_at: new Date().toISOString(),
      });

      if (isSupabaseConfigured && supabase) {
        await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', item.product_id);
      }
    }
  }

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  // 4. Salvar movimentações de auditoria
  const existingMovs = await getInventoryMovements();
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([...movements, ...existingMovs]));
  if (isSupabaseConfigured && supabase && movements.length > 0) {
    await supabase.from('inventory_movements').insert(movements);
  }

  // 5. Se o cliente for cadastrado, atualizar estatísticas
  if (newSale.customer_id) {
    const customers = await getCustomers();
    const custIndex = customers.findIndex(c => c.id === newSale.customer_id);
    if (custIndex >= 0) {
      customers[custIndex].total_spent += newSale.total;
      customers[custIndex].total_purchases += 1;
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

      if (isSupabaseConfigured && supabase) {
        await supabase.from('customers').update({
          total_spent: customers[custIndex].total_spent,
          total_purchases: customers[custIndex].total_purchases
        }).eq('id', newSale.customer_id);
      }
    }
  }

  return newSale;
}

export async function deleteSale(id: string): Promise<void> {
  const sales = await getSales();
  const saleToDelete = sales.find(s => s.id === id);
  if (!saleToDelete) return;

  // 1. Estornar estoque dos itens vendidos de volta ao produto
  const products = await getProducts();
  const movements: InventoryMovement[] = [];

  for (const item of saleToDelete.items) {
    const prodIndex = products.findIndex(p => p.id === item.product_id);
    if (prodIndex >= 0) {
      const prev = products[prodIndex].stock_quantity;
      const nextStock = prev + item.quantity;
      products[prodIndex].stock_quantity = nextStock;

      movements.push({
        id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        product_id: item.product_id,
        product_name: item.product_name,
        type: 'ENTRADA',
        quantity: item.quantity,
        previous_stock: prev,
        new_stock: nextStock,
        reason: `Exclusão/Cancelamento da Venda ${saleToDelete.code}`,
        reference_id: saleToDelete.id,
        user_name: 'Administrador',
        created_at: new Date().toISOString(),
      });

      if (isSupabaseConfigured && supabase) {
        await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', item.product_id);
      }
    }
  }

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  // 2. Gravar auditoria do estorno
  const existingMovs = await getInventoryMovements();
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([...movements, ...existingMovs]));
  if (isSupabaseConfigured && supabase && movements.length > 0) {
    await supabase.from('inventory_movements').insert(movements);
  }

  // 3. Remover a venda no Supabase (online obrigatório)
  if (isSupabaseConfigured && supabase) {
    const { error: delItemsErr } = await supabase.from('sale_items').delete().eq('sale_id', id);
    if (delItemsErr) console.warn('Erro ao excluir sale_items no Supabase:', delItemsErr);
    const { error: delSaleErr } = await supabase.from('sales').delete().eq('id', id);
    if (delSaleErr) {
      throw new Error('Falha ao excluir venda no banco online Supabase: ' + delSaleErr.message);
    }
  }

  // 4. Remover a venda local
  const updatedSales = sales.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

  // 5. Se o cliente pontuou, estornar total_spent
  if (saleToDelete.customer_id) {
    const customers = await getCustomers();
    const custIndex = customers.findIndex(c => c.id === saleToDelete.customer_id);
    if (custIndex >= 0) {
      customers[custIndex].total_spent = Math.max(0, customers[custIndex].total_spent - saleToDelete.total);
      customers[custIndex].total_purchases = Math.max(0, customers[custIndex].total_purchases - 1);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));

      if (isSupabaseConfigured && supabase) {
        await supabase.from('customers').update({
          total_spent: customers[custIndex].total_spent,
          total_purchases: customers[custIndex].total_purchases
        }).eq('id', saleToDelete.customer_id);
      }
    }
  }
}

export async function updateSale(id: string, updatedFields: Partial<Sale>): Promise<Sale> {
  const sales = await getSales();
  const index = sales.findIndex(s => s.id === id);
  if (index < 0) {
    throw new Error('Venda não encontrada');
  }

  const updatedSale: Sale = {
    ...sales[index],
    ...updatedFields,
  };

  if (isSupabaseConfigured && supabase) {
    const { items, ...saleRecord } = updatedSale;
    const { error } = await supabase.from('sales').update(saleRecord).eq('id', id);
    if (error) {
      throw new Error('Falha ao atualizar venda no banco online Supabase: ' + error.message);
    }
  }

  sales[index] = updatedSale;
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

  return updatedSale;
}



// ==========================================
// MOVIMENTAÇÕES DE ESTOQUE
// ==========================================
export async function getInventoryMovements(): Promise<InventoryMovement[]> {
  if (typeof window === 'undefined') return [];

  const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export async function addInventoryMovement(params: {
  product_id: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantity: number;
  reason: string;
  user_name?: string;
}): Promise<void> {
  const products = await getProducts();
  const prodIndex = products.findIndex(p => p.id === params.product_id);
  if (prodIndex < 0) return;

  const product = products[prodIndex];
  const prev = product.stock_quantity;
  let nextStock = prev;

  if (params.type === 'ENTRADA') {
    nextStock = prev + Math.abs(params.quantity);
  } else if (params.type === 'SAIDA') {
    nextStock = Math.max(0, prev - Math.abs(params.quantity));
  } else if (params.type === 'AJUSTE') {
    nextStock = Math.max(0, params.quantity);
  }

  product.stock_quantity = nextStock;
  products[prodIndex] = product;
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  const movement: InventoryMovement = {
    id: 'mov-' + Date.now(),
    product_id: product.id,
    product_name: `${product.name} (${product.brand} - ${product.volume_ml}ml)`,
    type: params.type,
    quantity: params.quantity,
    previous_stock: prev,
    new_stock: nextStock,
    reason: params.reason,
    user_name: params.user_name || 'Admin',
    created_at: new Date().toISOString(),
  };

  const existingMovs = await getInventoryMovements();
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([movement, ...existingMovs]));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('products').update({ stock_quantity: nextStock }).eq('id', product.id);
      await supabase.from('inventory_movements').insert([movement]);
    } catch (err) {
      console.warn('Erro ao atualizar estoque no Supabase:', err);
    }
  }
}

// ==========================================
// MAQUININHAS DE CARTÃO & TAXAS
// ==========================================
export async function getCardMachines(): Promise<CardMachineRate[]> {
  if (typeof window === 'undefined') return INITIAL_CARD_MACHINES;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('card_machines')
        .select('*')
        .order('name');

      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CARD_MACHINES, JSON.stringify(data));
        return data as CardMachineRate[];
      }
    } catch (err) {
      console.warn('Erro ao carregar taxas de cartão do Supabase:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.CARD_MACHINES);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.CARD_MACHINES, JSON.stringify(INITIAL_CARD_MACHINES));
    return INITIAL_CARD_MACHINES;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_CARD_MACHINES;
  }
}

export async function saveCardMachine(machine: CardMachineRate): Promise<void> {
  const machines = await getCardMachines();
  const exists = machines.some(m => m.id === machine.id);
  const list = exists 
    ? machines.map(m => m.id === machine.id ? machine : m)
    : [...machines, machine];

  localStorage.setItem(STORAGE_KEYS.CARD_MACHINES, JSON.stringify(list));

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('card_machines').upsert(machine);
    if (error) {
      throw new Error('Falha ao salvar taxas da maquininha no Supabase: ' + error.message);
    }
  }
}

// ==========================================
// CLIENTES (CRM)
// ==========================================
export async function getCustomers(): Promise<Customer[]> {
  if (typeof window === 'undefined') return INITIAL_CUSTOMERS;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data));
        return data as Customer[];
      }
    } catch (err) {
      console.warn('Erro ao carregar clientes do Supabase:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    return INITIAL_CUSTOMERS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

export async function saveCustomer(customer: Partial<Customer>): Promise<Customer> {
  const customers = await getCustomers();
  let updated: Customer;

  if (customer.id && customers.some(c => c.id === customer.id)) {
    updated = {
      ...(customers.find(c => c.id === customer.id)!),
      ...customer,
    } as Customer;
    const list = customers.map(c => c.id === customer.id ? updated : c);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
  } else {
    updated = {
      id: customer.id || 'cust-' + Date.now(),
      name: customer.name || 'Novo Cliente',
      phone: customer.phone || '',
      email: customer.email || '',
      cpf: customer.cpf || '',
      address: customer.address || '',
      preferred_notes: customer.preferred_notes || '',
      total_spent: 0,
      total_purchases: 0,
      created_at: new Date().toISOString(),
    };
    const list = [updated, ...customers];
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list));
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('customers').upsert(updated);
    if (error) {
      throw new Error('Falha ao salvar cliente no Supabase: ' + error.message);
    }
  }

  return updated;
}

// ==========================================
// CONFIGURAÇÕES DA LOJA & SENHA MESTRE
// ==========================================
export async function getStoreSettings(): Promise<StoreSettings> {
  if (typeof window === 'undefined') return INITIAL_SETTINGS;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (!error && data) {
        let masterPin = '191215';
        let tagline = data.brand_tagline || 'Perfumaria de Luxo & Fracionados Exclusivos';

        // Suporte à senha mestre embutida no JSON ou campo access_pin
        if (data.access_pin) {
          masterPin = data.access_pin;
        } else if (tagline.startsWith('{')) {
          try {
            const parsed = JSON.parse(tagline);
            masterPin = parsed.master_pin || masterPin;
            tagline = parsed.tagline || tagline;
          } catch (e) {}
        }

        const settingsResult: StoreSettings = {
          ...data,
          brand_tagline: tagline,
          access_pin: masterPin,
        };

        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsResult));
        return settingsResult;
      }
    } catch (err) {
      console.warn('Erro ao carregar configurações do Supabase:', err);
    }
  }

  const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_SETTINGS;
  }
}

export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await getStoreSettings();
  const updated: StoreSettings = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

  if (isSupabaseConfigured && supabase) {
    const masterPin = updated.access_pin || '191215';
    const rowToSave: any = {
      id: 'default',
      store_name: updated.store_name,
      brand_tagline: JSON.stringify({
        tagline: updated.brand_tagline,
        master_pin: masterPin,
      }),
      cnpj: updated.cnpj,
      phone: updated.phone,
      email: updated.email,
      pix_key: updated.pix_key,
      pix_key_type: updated.pix_key_type,
      address: updated.address,
      receipt_footer_text: updated.receipt_footer_text,
      thermal_printer_width: updated.thermal_printer_width,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('store_settings').upsert(rowToSave);
    if (error) {
      console.warn('Aviso ao sincronizar store_settings com Supabase:', error.message);
    }
  }

  return updated;
}

// Obter a senha mestre configurada na Supabase
export async function getMasterPinFromSupabase(): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('brand_tagline')
        .eq('id', 'default')
        .single();

      if (!error && data?.brand_tagline) {
        const raw = data.brand_tagline;
        if (raw.startsWith('{')) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.master_pin) return String(parsed.master_pin);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar senha mestre no Supabase:', e);
    }
  }
  return '191215'; // Senha mestre padrão
}

// Validar se o PIN informado corresponde ao PIN cadastrado no Supabase
export async function verifyMasterPin(pin: string): Promise<boolean> {
  const actualPin = await getMasterPinFromSupabase();
  return String(pin).trim() === actualPin.trim();
}


// ==========================================
// CÁLCULO DE KPIS & MÉTRICAS
// ==========================================
export async function getDashboardMetrics() {
  const [products, sales] = await Promise.all([getProducts(), getSales()]);

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock_quantity <= p.min_stock).length;
  const totalStockItems = products.reduce((acc, p) => acc + p.stock_quantity, 0);
  const totalStockValue = products.reduce((acc, p) => acc + (p.stock_quantity * p.sale_price), 0);
  const totalCostValue = products.reduce((acc, p) => acc + (p.stock_quantity * p.cost_price), 0);

  const completedSales = sales.filter(s => s.status === 'CONCLUIDA');
  const grossRevenue = completedSales.reduce((acc, s) => acc + s.total, 0);
  const netRevenue = completedSales.reduce((acc, s) => acc + s.net_received, 0);

  let totalCostSold = 0;
  completedSales.forEach(s => {
    s.items.forEach(it => {
      totalCostSold += (it.unit_cost || 0) * it.quantity;
    });
  });

  const estimatedProfit = netRevenue - totalCostSold;
  const averageTicket = completedSales.length > 0 ? grossRevenue / completedSales.length : 0;

  return {
    totalProducts,
    lowStockCount,
    totalStockItems,
    totalStockValue,
    totalCostValue,
    completedSalesCount: completedSales.length,
    grossRevenue,
    netRevenue,
    totalCostSold,
    estimatedProfit,
    averageTicket,
    recentSales: sales.slice(0, 5),
    lowStockProducts: products.filter(p => p.stock_quantity <= p.min_stock).slice(0, 6),
  };
}
