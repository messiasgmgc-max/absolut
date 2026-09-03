# Absolut Parfum • Sistema de Gestão Comercial, PDV & Vendas

> Sistema corporativo e frente de caixa desenvolvido em **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS** e **Supabase (PostgreSQL)**, projetado especificamente para perfumarias de luxo, fragrâncias finas e decants/fracionados.

---

## 🌟 Principais Funcionalidades

1. **Catálogo & Fragrâncias:**
   - Gestão completa de perfumes (Dior, Creed, Tom Ford, Chanel, Xerjoff, etc.).
   - Concentrações (Parfum, EDP, EDT, EDC, Decant/Fração de 5ml e 10ml).
   - Cálculo automático de margem de lucro (`%`) a partir do preço de custo e preço de venda.
   - Famílias olfativas, SKU, código de barras (EAN) e fotos em alta definição.

2. **Importação em Massa via Excel & CSV:**
   - Suporte a arrastar-e-soltar planilhas `.xlsx` e `.csv`.
   - Botão para **Baixar Modelo Pronto** para preenchimento.
   - Pré-visualização com validação antes de gravar no banco.

3. **Controle de Estoque & Auditoria:**
   - Alertas visuais de estoque crítico e nível de segurança.
   - Entradas de fornecedor, saídas por perdas/testers e ajustes de inventário.
   - Histórico de auditoria com data, quantidade e operador.

4. **Frente de Caixa (PDV Ágil):**
   - Vendas rápidas de balcão com leitor de código de barras ou busca por nome/grife.
   - Descontos em R$ ou porcentagem.
   - Múltiplas formas de pagamento: **PIX** (com chave copia-e-cola), **Dinheiro** (com cálculo automático de troco), **Cartão de Crédito** (1x a 12x) e **Cartão de Débito**.
   - Baixa imediata de estoque ao concluir a venda.

5. **Comprovantes de Venda & Notas Fiscais:**
   - **Cupom Térmico (Bobina 80mm / 58mm):** Impressão direta não-fiscal para impressoras térmicas de balcão.
   - **Recibo A4:** Emissão de recibo executivo estilizado com garantia de originalidade e autenticidade.
   - **Envio WhatsApp com 1 Clique:** Envia o resumo e itens do pedido diretamente no WhatsApp do cliente.
   - **Painel de Notas Fiscais (NFC-e / NF-e):** NCM padrão `3303.00.10`, chave de acesso de 44 dígitos e download de XML.

6. **Simulador de Taxas de Cartão:**
   - Simulador comparativo para operadoras: InfinitePay, Stone, PagBank, Mercado Pago, Ton, Cielo.
   - Modos: **Cliente Paga (Repasse de taxa)** e **Lojista Paga (Absorção de taxa)**.
   - Tabela detalhada de 1x a 12x com valor da parcela, total cobrado e valor líquido a receber.
   - Aplicação instantânea no carrinho do PDV!

7. **Clientes & CRM VIP:**
   - Cadastro com WhatsApp, endereço e histórico de compras.
   - Registro de preferências e notas olfativas favoritas de cada cliente.

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js 18+ instalado.

### 2. Instalação e Execução
```bash
# Entrar no diretório do projeto
cd amazing-volta

# Iniciar o servidor de desenvolvimento
npm run dev
```
Acesse no seu navegador: **`http://localhost:3000`**

---

## 🗄️ Integração com Supabase (PostgreSQL)

O sistema possui arquitetura **Dual-Engine**:
- Ele já vem com dados de exemplo e funciona imediatamente no modo local!
- Para conectar ao seu banco de dados na nuvem no Supabase:

1. Acesse o seu painel do [Supabase](https://supabase.com) e crie um novo projeto.
2. Vá em **SQL Editor** e execute o script contido em:
   👉 [`supabase/schema.sql`](supabase/schema.sql)
3. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Preencha as chaves da API do Supabase em `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```
5. Pronto! O badge no topo mudará automaticamente para **🟢 Supabase Conectado**.

---

## ☁️ Como Fazer Deploy na Vercel

1. Suba este repositório para a sua conta no **GitHub**:
   ```bash
   git add .
   git commit -m "feat: Sistema completo Absolut Parfum"
   git remote add origin https://github.com/SEU_USUARIO/absolut-parfum.git
   git push -u origin master
   ```
2. Acesse [vercel.com](https://vercel.com), clique em **Add New Project** e selecione o repositório.
3. Configure as variáveis de ambiente em **Environment Variables** (as mesmas do `.env.example`).
4. Clique em **Deploy**. O sistema estará online em segundos com HTTPS gratuito!

---

## 🛡️ Licença & Propriedade
Desenvolvido exclusivamente para **Absolut Parfum**. Todos os direitos reservados.
