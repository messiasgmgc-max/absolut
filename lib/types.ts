export type ConcentrationType = 
  | 'Parfum / Extrait'
  | 'Eau de Parfum (EDP)'
  | 'Eau de Toilette (EDT)'
  | 'Eau de Cologne (EDC)'
  | 'Decant / Fração (10ml)'
  | 'Decant / Fração (5ml)';

export type GenderType = 'Masculino' | 'Feminino' | 'Compartilhável';

export interface Product {
  id: string;
  name: string;
  brand: string;
  concentration: string;
  volume_ml: number;
  olfactory_family: string;
  gender: GenderType;
  sku: string;
  barcode: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  image_url?: string;
  ncm?: string;
  description?: string;
  active: boolean;
  created_at?: string;
}

export interface SaleItem {
  id: string;
  sale_id?: string;
  product_id: string;
  product_name: string;
  brand: string;
  volume_ml: number;
  unit_cost: number;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export type PaymentMethod = 
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'MISTO';

export type SaleStatus = 'CONCLUIDA' | 'PENDENTE' | 'CANCELADA';

export type InvoiceStatus = 'NAO_EMITIDA' | 'EMITIDA' | 'CANCELADA';

export interface Sale {
  id: string;
  code: string; // ex: ABS-202609-001
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  installments: number;
  card_machine?: string;
  card_rate_applied: number;
  net_received: number;
  status: SaleStatus;
  invoice_status: InvoiceStatus;
  invoice_key?: string;
  seller_name: string;
  notes?: string;
  created_at: string;
  items: SaleItem[];
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string;
  type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  reference_id?: string;
  user_name: string;
  created_at: string;
}

export interface CardMachineRate {
  id: string;
  name: string;
  debit_rate: number;
  credit_1x: number;
  credit_2x: number;
  credit_3x: number;
  credit_4x: number;
  credit_5x: number;
  credit_6x: number;
  credit_7x: number;
  credit_8x: number;
  credit_9x: number;
  credit_10x: number;
  credit_11x: number;
  credit_12x: number;
  is_default?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  address?: string;
  preferred_notes?: string;
  total_spent: number;
  total_purchases: number;
  created_at?: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  brand_tagline: string;
  cnpj: string;
  phone: string;
  email: string;
  pix_key: string;
  pix_key_type: string;
  address: string;
  receipt_footer_text: string;
  thermal_printer_width: number;
  access_pin?: string;
}

