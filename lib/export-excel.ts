import * as XLSX from 'xlsx';
import { Product, Sale } from './types';

// =======================================================
// GERAR MODELO DE PLANILHA PARA IMPORTAÇÃO
// =======================================================
export function downloadProductTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleRows = [
    {
      'Nome da Fragrância': 'Sauvage Elixir',
      'Marca': 'Dior',
      'Concentração': 'Parfum / Extrait',
      'Volumetria (ml)': 60,
      'Família Olfativa': 'Amadeirado Aromático',
      'Gênero': 'Masculino',
      'SKU': 'DIO-SAU-60',
      'Código de Barras (EAN)': '3348901567890',
      'Preço de Custo (R$)': 680.00,
      'Preço de Venda (R$)': 1190.00,
      'Estoque Inicial': 10,
      'Estoque Mínimo': 3,
      'NCM': '3303.00.10',
      'URL da Imagem': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600',
      'Descrição': 'Fragrância intensa e luxuosa com especiarias e madeiras nobres.',
    },
    {
      'Nome da Fragrância': 'Aventus',
      'Marca': 'Creed',
      'Concentração': 'Eau de Parfum (EDP)',
      'Volumetria (ml)': 100,
      'Família Olfativa': 'Chipre Frutado',
      'Gênero': 'Masculino',
      'SKU': 'CRD-AVE-100',
      'Código de Barras (EAN)': '3508441001114',
      'Preço de Custo (R$)': 1750.00,
      'Preço de Venda (R$)': 2980.00,
      'Estoque Inicial': 5,
      'Estoque Mínimo': 2,
      'NCM': '3303.00.10',
      'URL da Imagem': 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600',
      'Descrição': 'Ícone mundial da perfumaria de nicho com abacaxi defumado e patchouli.',
    },
    {
      'Nome da Fragrância': 'Decant Baccarat Rouge 540',
      'Marca': 'Maison Francis Kurkdjian',
      'Concentração': 'Decant / Fração (10ml)',
      'Volumetria (ml)': 10,
      'Família Olfativa': 'Âmbar Floral Amadeirado',
      'Gênero': 'Compartilhável',
      'SKU': 'DEC-MFK-540-10',
      'Código de Barras (EAN)': '7891000100018',
      'Preço de Custo (R$)': 160.00,
      'Preço de Venda (R$)': 380.00,
      'Estoque Inicial': 15,
      'Estoque Mínimo': 5,
      'NCM': '3303.00.10',
      'URL da Imagem': 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600',
      'Descrição': 'Fração fracionada em frasco de vidro de 10ml com borrifador.',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos Absolut');

  const filename = `modelo_produtos_absolut_parfum.${format}`;
  XLSX.writeFile(workbook, filename, { bookType: format === 'csv' ? 'csv' : 'xlsx' });
}

// =======================================================
// EXPORTAR PRODUTOS PARA EXCEL
// =======================================================
export function exportProductsToExcel(products: Product[]) {
  const data = products.map(p => ({
    'ID': p.id,
    'Nome': p.name,
    'Marca': p.brand,
    'Concentração': p.concentration,
    'Volume (ml)': p.volume_ml,
    'Família Olfativa': p.olfactory_family,
    'Gênero': p.gender,
    'SKU': p.sku,
    'Código de Barras': p.barcode,
    'Preço Custo (R$)': p.cost_price,
    'Preço Venda (R$)': p.sale_price,
    'Margem Lucro (%)': p.cost_price > 0 ? (((p.sale_price - p.cost_price) / p.cost_price) * 100).toFixed(1) + '%' : '100%',
    'Estoque Atual': p.stock_quantity,
    'Estoque Mínimo': p.min_stock,
    'NCM': p.ncm,
    'Status': p.active ? 'Ativo' : 'Inativo'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo');
  XLSX.writeFile(wb, `catalogo_absolut_parfum_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// =======================================================
// EXPORTAR VENDAS PARA EXCEL
// =======================================================
export function exportSalesToExcel(sales: Sale[]) {
  const data = sales.map(s => ({
    'Código': s.code,
    'Data': new Date(s.created_at).toLocaleString('pt-BR'),
    'Cliente': s.customer_name,
    'Telefone': s.customer_phone || '-',
    'Qtd Itens': s.items.reduce((acc, i) => acc + i.quantity, 0),
    'Subtotal (R$)': s.subtotal,
    'Desconto (R$)': s.discount,
    'Total (R$)': s.total,
    'Forma de Pagamento': s.payment_method,
    'Parcelas': s.installments,
    'Maquininha': s.card_machine || '-',
    'Taxa Aplicada (%)': s.card_rate_applied,
    'Líquido Recebido (R$)': s.net_received,
    'Status Venda': s.status,
    'Nota Fiscal': s.invoice_status,
    'Vendedor': s.seller_name
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vendas');
  XLSX.writeFile(wb, `vendas_absolut_parfum_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// =======================================================
// PROCESSAR ARQUIVO DE IMPORTAÇÃO (CSV OU XLSX)
// =======================================================
export async function parseUploadedFile(file: File): Promise<Partial<Product>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

        const mappedProducts: Partial<Product>[] = rawJson.map((row) => {
          // Mapeamento tolerante a variações nos cabeçalhos
          const name = row['Nome da Fragrância'] || row['Nome'] || row['Produto'] || row['Fragrance'] || '';
          const brand = row['Marca'] || row['Brand'] || row['Grife'] || 'Absolut Parfum';
          const concentration = row['Concentração'] || row['Tipo'] || 'Eau de Parfum (EDP)';
          const volume_ml = Number(row['Volumetria (ml)'] || row['Volume'] || row['Tamanho'] || 100);
          const olfactory_family = row['Família Olfativa'] || row['Familia'] || 'Amadeirado';
          const gender = row['Gênero'] || row['Genero'] || 'Compartilhável';
          const sku = String(row['SKU'] || row['Código'] || '').trim();
          const barcode = String(row['Código de Barras (EAN)'] || row['EAN'] || row['Barcode'] || '').trim();
          const cost_price = parseFloat(String(row['Preço de Custo (R$)'] || row['Custo'] || 0).replace(',', '.'));
          const sale_price = parseFloat(String(row['Preço de Venda (R$)'] || row['Preço'] || row['Venda'] || 0).replace(',', '.'));
          const stock_quantity = parseInt(String(row['Estoque Inicial'] || row['Estoque'] || row['Qtd'] || 0));
          const min_stock = parseInt(String(row['Estoque Mínimo'] || row['Estoque Minimo'] || 2));
          const ncm = String(row['NCM'] || '3303.00.10').trim();
          const image_url = row['URL da Imagem'] || row['Imagem'] || '';
          const description = row['Descrição'] || row['Descricao'] || '';

          return {
            name,
            brand,
            concentration,
            volume_ml: isNaN(volume_ml) ? 100 : volume_ml,
            olfactory_family,
            gender: gender as any,
            sku,
            barcode,
            cost_price: isNaN(cost_price) ? 0 : cost_price,
            sale_price: isNaN(sale_price) ? 0 : sale_price,
            stock_quantity: isNaN(stock_quantity) ? 0 : stock_quantity,
            min_stock: isNaN(min_stock) ? 2 : min_stock,
            ncm,
            image_url,
            description,
          };
        }).filter(p => p.name && p.name.trim().length > 0);

        resolve(mappedProducts);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
