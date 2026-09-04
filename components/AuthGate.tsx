'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Sparkles, KeyRound, ArrowRight, ShieldCheck, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { verifyMasterPin, getProducts } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';

const AUTH_STORAGE_KEY = 'absolut_auth_token_v1';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);

  // 1. Checagem inicial de conexão online e autenticação
  useEffect(() => {
    async function checkStatus() {
      // Checar se o navegador está explicitamente offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOffline(true);
        setLoading(false);
        return;
      }

      // Validar se o Supabase está configurado e online
      if (!isSupabaseConfigured) {
        setIsOffline(true);
        setLoading(false);
        return;
      }

      // Testar conexão ao vivo com Supabase
      try {
        await getProducts();
        setIsOffline(false);
      } catch (err) {
        console.error('Falha de conexão com banco de dados Supabase:', err);
        setIsOffline(true);
        setLoading(false);
        return;
      }

      // Checar se já possui token de autenticação ativo na sessão
      const token = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (token === 'AUTHORIZED') {
        setIsAuthenticated(true);
      }
      setLoading(false);
    }

    checkStatus();

    // Ouvintes de eventos online/offline do navegador
    const handleOnline = () => {
      setIsOffline(false);
      checkStatus();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Tentativa de reconexão
  const handleRetryConnection = async () => {
    setCheckingConnection(true);
    setErrorMsg(null);
    try {
      await getProducts();
      setIsOffline(false);
    } catch (err) {
      setIsOffline(true);
      setErrorMsg('Ainda não foi possível estabelecer conexão com o banco de dados online.');
    } finally {
      setCheckingConnection(false);
    }
  };

  // 2. Validação da Senha Mestre diretamente no Supabase
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const isValid = await verifyMasterPin(pin.trim());
      if (isValid) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, 'AUTHORIZED');
        setIsAuthenticated(true);
      } else {
        setErrorMsg('Senha mestre incorreta. Verifique e tente novamente.');
        setPin('');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro de comunicação com o servidor online. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  // TELA DE BLOQUEIO TOTAL QUANDO OFFLINE
  if (isOffline) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 p-4 text-center">
        <div className="w-full max-w-md rounded-3xl border border-rose-900/50 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 shadow-2xl space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400">
            <WifiOff className="h-10 w-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-zinc-100 uppercase tracking-wide">
              Acesso Indisponível Offline
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              O sistema <b>Absolut Parfum</b> opera 100% online para garantir integridade de estoque, vendas em tempo real e sincronização permanente com o banco de dados.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-left space-y-2 text-xs text-zinc-300">
            <div className="flex items-center gap-2 font-semibold text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Conexão Obrigatória</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Nenhuma funcionalidade é permitida em modo offline. Conecte-se à internet e tente novamente.
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
          )}

          <button
            type="button"
            onClick={handleRetryConnection}
            disabled={checkingConnection}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold-500 py-3.5 text-xs font-bold text-zinc-950 shadow-lg shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${checkingConnection ? 'animate-spin' : ''}`} />
            <span>{checkingConnection ? 'Verificando Conexão...' : 'Testar Conexão Online'}</span>
          </button>
        </div>
      </div>
    );
  }

  // TELA DE CARREGAMENTO INICIAL
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-zinc-950 shadow-xl shadow-gold-500/20 animate-pulse">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-gold-400" />
          <span>Iniciando ambiente seguro Absolut Parfum...</span>
        </div>
      </div>
    );
  }

  // TELA DE BLOQUEIO POR SENHA MESTRE
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 p-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Logo & Marca */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 text-zinc-950 shadow-xl shadow-gold-500/20 ring-1 ring-gold-300/40">
              <Lock className="h-7 w-7" />
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-gold-400">
                ABSOLUT PARFUM
              </span>
              <h2 className="text-xl font-black text-zinc-100">
                Acesso Restrito
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Digite a senha mestre para desbloquear o sistema
              </p>
            </div>
          </div>

          {/* Formulário de PIN */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Senha Mestre de Segurança
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  autoFocus
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-10 pr-4 text-center text-sm font-mono tracking-widest text-zinc-100 placeholder-zinc-600 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !pin.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-amber-500 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-gold-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Desbloquear Painel</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé de Segurança */}
          <div className="border-t border-zinc-800 pt-4 flex items-center justify-center gap-2 text-[10px] text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Autenticação Direta via Banco Supabase</span>
          </div>
        </div>
      </div>
    );
  }

  // USUÁRIO AUTENTICADO E ONLINE
  return <>{children}</>;
}
