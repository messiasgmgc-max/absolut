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

      if (!error && data && data.length > 0) {
        return data as Product[];
      }
    } catch (err) {
      console.warn('Erro ao carregar produtos do Supabase, usando local:', err);
    }
  }

  // Fallback LocalStorage
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
    try {
      await supabase.from('products').upsert(updated);
    } catch (err) {
      console.warn('Erro ao salvar no Supabase:', err);
    }
  }

  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (err) {
      console.warn('Erro ao deletar do Supabase:', err);
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
    try {
      await supabase.from('products').upsert(list);
    } catch (err) {
      console.warn('Erro ao sincronizar lote com Supabase:', err);
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

      if (!error && data && data.length > 0) {
        return data as Sale[];
      }
    } catch (err) {
      console.warn('Erro ao buscar vendas no Supabase:', err);
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

  // 1. Salvar venda
  const updatedSales = [newSale, ...sales];
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

  // 2. Dar baixa no estoque de cada produto vendido
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
    }
  }

  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

  // 3. Salvar movimentações de auditoria
  const existingMovs = await getInventoryMovements();
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([...movements, ...existingMovs]));

  // 4. Se o cliente for cadastrado, atualizar estatísticas
  if (newSale.customer_id) {
    const customers = await getCustomers();
    const custIndex = customers.findIndex(c => c.id === newSale.customer_id);
    if (custIndex >= 0) {
      customers[custIndex].total_spent += newSale.total;
      customers[custIndex].total_purchases += 1;
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  }

  // Se Supabase estiver conectado
  if (isSupabaseConfigured && supabase) {
    try {
      const { items, ...saleRecord } = newSale;
      await supabase.from('sales').insert([saleRecord]);
      const itemsToInsert = items.map(it => ({
        ...it,
        sale_id: newSale.id,
      }));
      await supabase.from('sale_items').insert(itemsToInsert);
    } catch (err) {
      console.warn('Erro ao registrar venda no Supabase:', err);
    }
  }

  return newSale;
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
}

// ==========================================
// CLIENTES (CRM)
// ==========================================
export async function getCustomers(): Promise<Customer[]> {
  if (typeof window === 'undefined') return INITIAL_CUSTOMERS;

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

  return updated;
}

// ==========================================
// CONFIGURAÇÕES DA LOJA
// ==========================================
export async function getStoreSettings(): Promise<StoreSettings> {
  if (typeof window === 'undefined') return INITIAL_SETTINGS;

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
  return updated;
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
