'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Sparkles, 
  Send, 
  Edit3, 
  X,
  Heart,
  ShoppingBag
} from 'lucide-react';
import { Customer } from '@/lib/types';
import { getCustomers, saveCustomer } from '@/lib/store';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Partial<Customer> | null>(null);

  const loadData = async () => {
    const list = await getCustomers();
    setCustomers(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingCust({
      name: '',
      phone: '',
      email: '',
      cpf: '',
      address: '',
      preferred_notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCust(c);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCust || !editingCust.name) return;

    await saveCustomer(editingCust);
    setIsModalOpen(false);
    setEditingCust(null);
    await loadData();
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.cpf && c.cpf.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gold-400">
            <Users className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">CRM & Clientes VIP</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100">
            Clientes Absolut Parfum
          </h1>
          <p className="text-xs text-zinc-400">
            Histórico de compras, preferências olfativas e contato direto via WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome do cliente, WhatsApp, e-mail ou CPF..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-gold-500 focus:outline-none"
        />
      </div>

      {/* Grid de Cards de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const cleanPhone = (c.phone || '').replace(/\D/g, '');

          return (
            <div
              key={c.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 flex flex-col justify-between shadow-lg hover:border-zinc-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-zinc-100 text-sm">{c.name}</h3>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(c)}
                    className="text-zinc-500 hover:text-gold-400 p-1"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 space-y-1 text-xs text-zinc-400">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gold-400" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>

                {c.preferred_notes && (
                  <div className="mt-3 rounded-lg border border-gold-500/20 bg-gold-500/5 p-2 text-[11px] text-zinc-300">
                    <div className="flex items-center gap-1 text-gold-400 font-semibold mb-0.5">
                      <Heart className="h-3 w-3" />
                      <span>Preferências Olfativas:</span>
                    </div>
                    <p className="line-clamp-2 italic">{c.preferred_notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">Total Comprado</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    R$ {c.total_spent.toFixed(2)} ({c.total_purchases} compras)
                  </span>
                </div>

                {cleanPhone && (
                  <a
                    href={`https://wa.me/55${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(c.name)}%2C%20tudo%20bem%3F%20Falamos%20da%20Absolut%20Parfum!`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/80 transition-colors"
                  >
                    <Send className="h-3 w-3" />
                    <span>Conversar</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Cadastro / Edição de Cliente */}
      {isModalOpen && editingCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-zinc-100">
                {editingCust.id ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editingCust.name || ''}
                  onChange={(e) => setEditingCust({ ...editingCust, name: e.target.value })}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={editingCust.phone || ''}
                    onChange={(e) => setEditingCust({ ...editingCust, phone: e.target.value })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 focus:border-gold-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">CPF</label>
                  <input
                    type="text"
                    value={editingCust.cpf || ''}
                    onChange={(e) => setEditingCust({ ...editingCust, cpf: e.target.value })}
                    className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 focus:border-gold-500"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={editingCust.email || ''}
                  onChange={(e) => setEditingCust({ ...editingCust, email: e.target.value })}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 focus:border-gold-500"
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Endereço de Entrega</label>
                <input
                  type="text"
                  value={editingCust.address || ''}
                  onChange={(e) => setEditingCust({ ...editingCust, address: e.target.value })}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 focus:border-gold-500"
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Notas Olfativas / Perfumes Favoritos</label>
                <textarea
                  rows={2}
                  value={editingCust.preferred_notes || ''}
                  onChange={(e) => setEditingCust({ ...editingCust, preferred_notes: e.target.value })}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 focus:border-gold-500"
                  placeholder="Ex: Ama fragrâncias com âmbar, oud e cardamomo. Prefere decants de 10ml."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-zinc-700 px-4 py-1.5 font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-gold-500 px-5 py-1.5 font-bold text-zinc-950 hover:brightness-110"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
