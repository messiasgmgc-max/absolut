-- ==============================================================================
-- SISTEMA ABSOLUT PARFUM - ESQUEMA DE BANCO DE DADOS SUPABASE (POSTGRESQL)
-- Perfumaria de Luxo: Produtos, Estoque, Vendas, Clientes, Taxas de Cartão e NF-e
-- ==============================================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE MARCAS / GRIFES
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    country VARCHAR(60),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE PRODUTOS / PERFUMES
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    concentration VARCHAR(50) NOT NULL DEFAULT 'Eau de Parfum', -- Parfum, EDP, EDT, EDC, Decant/Fração
    volume_ml INTEGER NOT NULL DEFAULT 100, -- 100ml, 50ml, 10ml, etc.
    olfactory_family VARCHAR(80), -- Amadeirado, Oriental, Cítrico, Floral, etc.
    gender VARCHAR(30) DEFAULT 'Compartilhável', -- Masculino, Feminino, Compartilhável
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(50),
    cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 3,
    image_url TEXT,
    ncm VARCHAR(20) DEFAULT '3303.00.10', -- NCM oficial para perfumes e águas de colônia
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE CLIENTES (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    cpf VARCHAR(20),
    address TEXT,
    preferred_notes TEXT, -- Notas ou perfumes favoritos
    total_spent NUMERIC(10,2) DEFAULT 0.00,
    total_purchases INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE VENDAS
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL, -- Ex: ABS-202609-001
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(200) DEFAULT 'Cliente Balcão',
    customer_phone VARCHAR(30),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL, -- PIX, DINHEIRO, CARTAO_CREDITO, CARTAO_DEBITO, MISTO
    installments INTEGER DEFAULT 1,
    card_machine VARCHAR(60), -- InfinitePay, Stone, PagBank, Mercado Pago, Ton, Cielo
    card_rate_applied NUMERIC(5,2) DEFAULT 0.00,
    net_received NUMERIC(10,2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'CONCLUIDA', -- CONCLUIDA, PENDENTE, CANCELADA
    invoice_status VARCHAR(30) DEFAULT 'NAO_EMITIDA', -- NAO_EMITIDA, EMITIDA, CANCELADA
    invoice_key VARCHAR(60), -- Chave de acesso da NF-e (44 dígitos)
    seller_name VARCHAR(100) DEFAULT 'Vendedor Absolut',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ITENS DA VENDA
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    volume_ml INTEGER,
    unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL, -- 'ENTRADA', 'SAIDA', 'AJUSTE'
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(255),
    reference_id VARCHAR(50), -- Ex: ID da venda correspondente
    user_name VARCHAR(100) DEFAULT 'Sistema',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA DE TAXAS DE CARTÃO / MAQUININHAS
CREATE TABLE IF NOT EXISTS public.card_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(60) NOT NULL UNIQUE,
    debit_rate NUMERIC(5,2) NOT NULL DEFAULT 1.39,
    credit_1x NUMERIC(5,2) NOT NULL DEFAULT 3.15,
    credit_2x NUMERIC(5,2) NOT NULL DEFAULT 4.50,
    credit_3x NUMERIC(5,2) NOT NULL DEFAULT 5.50,
    credit_4x NUMERIC(5,2) NOT NULL DEFAULT 6.50,
    credit_5x NUMERIC(5,2) NOT NULL DEFAULT 7.50,
    credit_6x NUMERIC(5,2) NOT NULL DEFAULT 8.50,
    credit_7x NUMERIC(5,2) NOT NULL DEFAULT 9.50,
    credit_8x NUMERIC(5,2) NOT NULL DEFAULT 10.50,
    credit_9x NUMERIC(5,2) NOT NULL DEFAULT 11.50,
    credit_10x NUMERIC(5,2) NOT NULL DEFAULT 12.50,
    credit_11x NUMERIC(5,2) NOT NULL DEFAULT 13.50,
    credit_12x NUMERIC(5,2) NOT NULL DEFAULT 14.50,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. CONFIGURAÇÕES DA LOJA ABSOLUT PARFUM & SENHA MESTRE
CREATE TABLE IF NOT EXISTS public.store_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    store_name VARCHAR(100) DEFAULT 'Absolut Parfum',
    brand_tagline TEXT DEFAULT '{"tagline":"Perfumaria de Luxo & Fracionados Exclusivos","master_pin":"191215"}',
    access_pin VARCHAR(20) DEFAULT '191215',
    cnpj VARCHAR(30) DEFAULT '00.000.000/0001-00',
    phone VARCHAR(30) DEFAULT '(11) 99999-9999',
    email VARCHAR(100) DEFAULT 'contato@absolutparfum.com.br',
    pix_key VARCHAR(100) DEFAULT 'contato@absolutparfum.com.br',
    pix_key_type VARCHAR(20) DEFAULT 'EMAIL',
    address TEXT DEFAULT 'São Paulo - SP',
    receipt_footer_text TEXT DEFAULT 'Garantia de originalidade 100% comprovada. Agradecemos a preferência!',
    thermal_printer_width INTEGER DEFAULT 80, -- 80mm ou 58mm
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SE A TABELA JÁ EXISTIR, ADICIONA A COLUNA DE SENHA MESTRE SE NÃO EXISTIR
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS access_pin VARCHAR(20) DEFAULT '191215';

-- DADOS INICIAIS DE MAQUININHAS DE CARTÃO
INSERT INTO public.card_machines (name, debit_rate, credit_1x, credit_2x, credit_3x, credit_4x, credit_5x, credit_6x, credit_7x, credit_8x, credit_9x, credit_10x, credit_11x, credit_12x, is_default)
VALUES 
('InfinitePay (Smart)', 0.75, 2.90, 4.25, 5.15, 5.99, 6.85, 7.70, 8.55, 9.40, 10.25, 11.10, 11.95, 12.80, true),
('Stone (Ton Pro)', 1.39, 3.15, 5.44, 6.64, 7.82, 8.98, 10.13, 11.27, 12.39, 13.50, 14.59, 15.67, 16.74, false),
('PagBank (PagSeguro)', 1.49, 3.19, 5.49, 6.79, 7.99, 9.19, 10.39, 11.59, 12.79, 13.99, 15.19, 16.39, 17.59, false),
('Mercado Pago (Point)', 1.68, 3.15, 5.41, 6.70, 7.96, 9.20, 10.42, 11.61, 12.79, 13.94, 15.08, 16.19, 17.28, false)
ON CONFLICT (name) DO NOTHING;

-- CONFIGURAÇÃO INICIAL DA LOJA COM SENHA MESTRE (191215)
INSERT INTO public.store_settings (id, store_name, brand_tagline, access_pin, phone, pix_key, receipt_footer_text)
VALUES ('default', 'Absolut Parfum', '{"tagline":"Perfumaria de Luxo & Fracionados Exclusivos","master_pin":"191215"}', '191215', '(11) 99999-9999', 'pix@absolutparfum.com.br', 'Perfumes 100% Originais. Obrigado por escolher a Absolut Parfum!')
ON CONFLICT (id) DO UPDATE SET 
  access_pin = COALESCE(public.store_settings.access_pin, '191215'),
  brand_tagline = '{"tagline":"Perfumaria de Luxo & Fracionados Exclusivos","master_pin":"191215"}';

-- HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO LIVRE PARA USO NA APLICAÇÃO (Permite SELECT/INSERT/UPDATE/DELETE)
DO $$
BEGIN
    EXECUTE 'CREATE POLICY "Public Read Products" ON public.products FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Public Read Customers" ON public.customers FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Public Read Sales" ON public.sales FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Public Read Sale Items" ON public.sale_items FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Public Read Movements" ON public.inventory_movements FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Public Read Machines" ON public.card_machines FOR ALL USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Public Read Settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true)';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

