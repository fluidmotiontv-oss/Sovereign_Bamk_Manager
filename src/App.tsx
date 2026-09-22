/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { signInWithGoogle, logout } from './lib/firebase';
import { 
  Account, 
  Transaction, 
  subscribeToAccounts, 
  subscribeToTransactions, 
  createAccount, 
  executeTransaction,
  IncomeStream,
  subscribeToIncomeStreams,
  createIncomeStream,
  Debt,
  RecoveryTeam,
  subscribeToDebts,
  subscribeToRecoveryTeams,
  createDebt,
  assignRecoveryTeam,
  seedRecoveryTeams,
  seedInitialCases,
  subscribeToLegalCases,
  subscribeToCorrespondence,
  createLegalCase,
  sendLegalCorrespondence,
  processIncomeDistribution,
  subscribeToDocuments,
  createDocument,
  LegalCase,
  LegalCorrespondence,
  EvidenceDocument
} from './lib/banking';
import { cn, formatCurrency, getDragon9Time } from './lib/utils';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Shield, 
  LayoutDashboard, 
  LogOut,
  ChevronRight,
  TrendingUp,
  History,
  Building2,
  Globe,
  Coins,
  ArrowRightLeft,
  PieChart,
  Settings2,
  Gavel,
  UserCheck,
  Zap,
  FileText,
  FileSearch,
  ExternalLink,
  Archive,
  Server,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function App() {
  const { user, loading, profile } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [incomeStreams, setIncomeStreams] = useState<IncomeStream[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [recoveryTeams, setRecoveryTeams] = useState<RecoveryTeam[]>([]);
  const [legalCases, setLegalCases] = useState<LegalCase[]>([]);
  const [documents, setDocuments] = useState<EvidenceDocument[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallet' | 'income' | 'debts' | 'legal' | 'evidence'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<Account['type']>('checking');
  const [newAccountCurrency, setNewAccountCurrency] = useState('USD');

  const [showCreateIncome, setShowCreateIncome] = useState(false);
  const [newIncomeName, setNewIncomeName] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  const [newIncomeFreq, setNewIncomeFreq] = useState<IncomeStream['frequency']>('recurring');
  const [newIncomeCurrency, setNewIncomeCurrency] = useState('USD');

  const [showCreateDebt, setShowCreateDebt] = useState(false);
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtCurrency, setNewDebtCurrency] = useState('USD');

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const [showCreateLegal, setShowCreateLegal] = useState(false);
  const [newLegalTitle, setNewLegalTitle] = useState('');
  const [newLegalType, setNewLegalType] = useState<LegalCase['type']>('corruption_recovery');
  const [newLegalMagnitude, setNewLegalMagnitude] = useState('');
  const [newLegalCurrency, setNewLegalCurrency] = useState('NZD');
  const [newLegalDescription, setNewLegalDescription] = useState('');

  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [correspondence, setCorrespondence] = useState<LegalCorrespondence[]>([]);
  const [newMsgRecipient, setNewMsgRecipient] = useState('');
  const [newMsgSubject, setNewMsgSubject] = useState('');
  const [newMsgBody, setNewMsgBody] = useState('');

  const [isPiping, setIsPiping] = useState(false);

  const [showCreateDocument, setShowCreateDocument] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<EvidenceDocument['type']>('sovereign_filing');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocAssocId, setNewDocAssocId] = useState('');
  const [newDocAssocType, setNewDocAssocType] = useState<EvidenceDocument['associatedType']>('legal_case');

  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txType, setTxType] = useState<'credit' | 'debit'>('credit');
  const [txCategory, setTxCategory] = useState<Transaction['category']>('expense');
  const [d9Time, setD9Time] = useState(getDragon9Time());

  useEffect(() => {
    const timer = setInterval(() => setD9Time(getDragon9Time()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      const unsubAccounts = subscribeToAccounts(user.uid, setAccounts);
      const unsubStreams = subscribeToIncomeStreams(user.uid, setIncomeStreams);
      const unsubDebts = subscribeToDebts(user.uid, setDebts);
      const unsubTeams = subscribeToRecoveryTeams(setRecoveryTeams);
      const unsubLegal = subscribeToLegalCases(user.uid, setLegalCases);
      const unsubDocs = subscribeToDocuments(user.uid, setDocuments);
      return () => {
        unsubAccounts();
        unsubStreams();
        unsubDebts();
        unsubTeams();
        unsubLegal();
        unsubDocs();
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedCase) {
      const unsub = subscribeToCorrespondence(selectedCase.id, setCorrespondence);
      return () => unsub();
    }
  }, [selectedCase]);

  useEffect(() => {
    if (selectedAccount) {
      const unsub = subscribeToTransactions(selectedAccount.id, setTransactions);
      return () => unsub();
    } else {
      setTransactions([]);
    }
  }, [selectedAccount]);

  // Aggregate all transactions for chart data
  useEffect(() => {
    if (user && accounts.length > 0) {
      const unsubs = accounts.map(acc => 
        subscribeToTransactions(acc.id, (txs) => {
          setAllTransactions(prev => {
            const others = prev.filter(t => t.accountId !== acc.id);
            return [...others, ...txs].sort((a, b) => 
              new Date(b.timestamp?.toDate?.() || b.timestamp).getTime() - 
              new Date(a.timestamp?.toDate?.() || a.timestamp).getTime()
            );
          });
        })
      );
      return () => unsubs.forEach(unsub => unsub());
    }
  }, [user, accounts.length]); // Use length to avoid infinite loops if accounts list is stable

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAccountName) return;
    await createAccount(user.uid, newAccountName, newAccountType, newAccountCurrency);
    setNewAccountName('');
    setShowCreateAccount(false);
  };

  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newIncomeName) return;
    await createIncomeStream(user.uid, newIncomeName, newIncomeFreq, parseFloat(newIncomeAmount), newIncomeCurrency);
    setNewIncomeName('');
    setNewIncomeAmount('');
    setShowCreateIncome(false);
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDebtName) return;
    await createDebt(user.uid, newDebtName, parseFloat(newDebtAmount), newDebtCurrency);
    setNewDebtName('');
    setNewDebtAmount('');
    setShowCreateDebt(false);
  };

  const handleAssignTeam = async (debtId: string, teamId: string, authorizer: 'Timothy' | 'Misaki') => {
    await assignRecoveryTeam(debtId, teamId, authorizer);
    setSelectedDebt(null);
  };

  const handleCreateLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newLegalTitle) return;
    await createLegalCase(
      user.uid, 
      newLegalTitle, 
      newLegalType, 
      parseFloat(newLegalMagnitude) || 0, 
      newLegalCurrency, 
      ['Timothy', 'Misaki'],
      newLegalDescription
    );
    setNewLegalTitle('');
    setNewLegalDescription('');
    setShowCreateLegal(false);
  };

  const handleSendCorrespondence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newMsgBody) return;
    await sendLegalCorrespondence(
      selectedCase.id,
      "Executive Lawyer (AI)",
      newMsgRecipient,
      newMsgSubject,
      newMsgBody
    );
    setNewMsgBody('');
    setNewMsgSubject('');
  };

  const handlePipeIncome = async () => {
    if (!user || accounts.length === 0 || incomeStreams.length === 0) return;
    setIsPiping(true);
    await processIncomeDistribution(user.uid, incomeStreams, accounts);
    setIsPiping(false);
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDocName || !newDocUrl) return;
    await createDocument(
      user.uid,
      newDocName,
      newDocType,
      newDocUrl,
      newDocAssocId || undefined,
      newDocAssocId ? newDocAssocType : undefined
    );
    setNewDocName('');
    setNewDocUrl('');
    setNewDocAssocId('');
    setShowCreateDocument(false);
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAccount || !txAmount) return;
    await executeTransaction(user.uid, selectedAccount.id, parseFloat(txAmount), txType, txDesc, txCategory);
    setTxAmount('');
    setTxDesc('');
  };

  const getChartData = () => {
    if (allTransactions.length === 0) return [];

    // Sort transactions by date ascending
    const sortedTxs = [...allTransactions].sort((a, b) => 
      new Date(a.timestamp?.toDate?.() || a.timestamp).getTime() - 
      new Date(b.timestamp?.toDate?.() || b.timestamp).getTime()
    );

    const data: { date: string; balance: number }[] = [];
    let runningBalance = 0;
    
    // Group by date
    const dailyBalances: Record<string, number> = {};
    
    sortedTxs.forEach(tx => {
      const date = new Date(tx.timestamp?.toDate?.() || tx.timestamp).toLocaleDateString();
      const amount = tx.type === 'credit' ? tx.amount : -tx.amount;
      runningBalance += amount;
      dailyBalances[date] = runningBalance;
    });

    return Object.entries(dailyBalances).map(([date, balance]) => ({
      date,
      balance
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Building2 className="w-12 h-12 text-[#1A1A1A] mb-4" />
          <p className="text-sm font-medium text-[#666666] tracking-widest uppercase">Initializing Sovereign Systems...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="inline-flex p-4 rounded-3xl bg-white shadow-sm border border-[#F0EFEF]">
            <Shield className="w-10 h-10 text-[#1A1A1A]" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-serif text-[#1A1A1A] leading-tight">Sovereign Bank Manager</h1>
            <p className="text-[#666666] leading-relaxed">
              Orchestrate your sovereign assets within the Dragon 9 Synchronized Time system. 
              Secure, autonomous, and strictly aligned.
            </p>
          </div>
          <button
            onClick={signInWithGoogle}
            className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-medium hover:bg-[#333333] transition-colors shadow-xl shadow-black/5"
          >
            Authenticate with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-[#F0EFEF] p-8 flex flex-col gap-12 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">Sovereign</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setSelectedAccount(null); setActiveTab('dashboard'); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              !selectedAccount && activeTab === 'dashboard' ? "bg-[#1A1A1A] text-white" : "text-[#666666] hover:bg-[#F5F4F3]"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => { setSelectedAccount(null); setActiveTab('wallet'); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              !selectedAccount && activeTab === 'wallet' ? "bg-[#1A1A1A] text-white" : "text-[#666666] hover:bg-[#F5F4F3]"
            )}
          >
            <Wallet className="w-4 h-4" />
            Digital Wallet
          </button>
          <button 
            onClick={() => { setSelectedAccount(null); setActiveTab('income'); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              !selectedAccount && activeTab === 'income' ? "bg-[#1A1A1A] text-white" : "text-[#666666] hover:bg-[#F5F4F3]"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Income Streams
          </button>
          <button 
            onClick={() => { setSelectedAccount(null); setActiveTab('debts'); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              !selectedAccount && activeTab === 'debts' ? "bg-[#1A1A1A] text-white" : "text-[#666666] hover:bg-[#F5F4F3]"
            )}
          >
            <Gavel className="w-4 h-4" />
            Debt Recovery
          </button>
          <button 
            onClick={() => { setSelectedAccount(null); setActiveTab('legal'); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              !selectedAccount && activeTab === 'legal' ? "bg-[#1A1A1A] text-white" : "text-[#666666] hover:bg-[#F5F4F3]"
            )}
          >
            <Shield className="w-4 h-4" />
            Legal Representation
          </button>
          <button 
            onClick={() => { setSelectedAccount(null); setActiveTab('evidence'); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              !selectedAccount && activeTab === 'evidence' ? "bg-[#1A1A1A] text-white" : "text-[#666666] hover:bg-[#F5F4F3]"
            )}
          >
            <Archive className="w-4 h-4" />
            Evidence Vault
          </button>
          
          <div className="pt-4 pb-2 px-4">
            <p className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Ledgers</p>
          </div>
          
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccount(acc)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                selectedAccount?.id === acc.id ? "bg-[#1A1A1A] text-white shadow-lg shadow-black/10" : "text-[#666666] hover:bg-[#F5F4F3]",
                acc.type === 'ecosystem_vault' && "border-l-2 border-[#1A1A1A]"
              )}
            >
              {acc.type === 'ecosystem_vault' ? (
                <Server className="w-4 h-4 text-[#1A1A1A] group-hover:text-white" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-[#E0DEDC]" />
              )}
              <span className="truncate">{acc.name}</span>
              <span className="ml-auto text-[10px] opacity-60">{acc.currency}</span>
            </button>
          ))}
          <button
            onClick={() => setShowCreateAccount(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#666666] hover:bg-[#F5F4F3] border border-dashed border-[#E0DEDC] mt-4"
          >
            <Plus className="w-4 h-4" />
            New Account
          </button>
        </nav>

        <div className="pt-8 border-t border-[#F0EFEF] space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Synchronized Time</p>
            <div className="flex items-center gap-2 text-lg font-mono font-medium">
              <Clock className="w-4 h-4 text-[#1A1A1A]" />
              {d9Time}
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 text-sm font-medium text-[#666666] hover:text-[#1A1A1A] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 max-w-6xl overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selectedAccount ? (
            activeTab === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <header className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#666666] uppercase tracking-widest">Sovereign Overview</p>
                    <h2 className="text-4xl font-serif leading-tight">Welcome, {profile?.displayName?.split(' ')[0]}</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl">
                      <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#15803D]">Systems Optimal</span>
                    </div>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-8 rounded-[32px] bg-white border border-[#F0EFEF] shadow-sm space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-[#F5F4F3] rounded-2xl">
                        <Wallet className="w-6 h-6 text-[#1A1A1A]" />
                      </div>
                      <div className="flex items-center gap-1 text-[#22C55E] text-xs font-bold bg-[#F0FDF4] px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        +4.2%
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666] font-medium">USD Net Value</p>
                      <p className="text-4xl font-serif mt-1">
                        {formatCurrency(accounts.filter(a => a.currency === 'USD').reduce((sum, acc) => sum + acc.balance, 0), 'USD')}
                      </p>
                    </div>
                  </div>

                  <div className="p-8 rounded-[32px] bg-white border border-[#F0EFEF] shadow-sm space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-[#F5F4F3] rounded-2xl">
                        <Coins className="w-6 h-6 text-[#1A1A1A]" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[#666666] font-medium">Sovereign D9C</p>
                      <p className="text-4xl font-serif mt-1">
                        {formatCurrency(accounts.filter(a => a.currency === 'D9C').reduce((sum, acc) => sum + acc.balance, 0), 'D9C')}
                      </p>
                    </div>
                  </div>

                  <div className="p-8 rounded-[32px] bg-[#1A1A1A] text-white shadow-2xl shadow-black/20 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Shield className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-white/60 font-medium">International Exposure</p>
                      <p className="text-4xl font-serif mt-1">{new Set(accounts.map(a => a.currency)).size} Currencies</p>
                    </div>
                  </div>
                </div>

                {accounts.some(a => a.type === 'ecosystem_vault') && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif">High-Security Holdings</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {accounts.filter(a => a.type === 'ecosystem_vault').map(acc => (
                        <div 
                          key={acc.id}
                          onClick={() => setSelectedAccount(acc)}
                          className="p-8 rounded-[32px] bg-white border-2 border-[#1A1A1A] shadow-xl space-y-6 cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Server className="w-32 h-32" />
                          </div>
                          <div className="flex justify-between items-start">
                            <div className="p-3 bg-[#1A1A1A] rounded-2xl">
                              <Lock className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="px-3 py-1 bg-[#1A1A1A] text-white rounded-full text-[8px] font-bold uppercase tracking-widest">
                                Ecosystem Vault
                              </div>
                              <div className="flex items-center gap-1 text-[8px] text-[#22C55E] font-bold uppercase">
                                <Shield className="w-2 h-2" />
                                Secured Holding
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-[#666666] font-medium">{acc.name}</p>
                            <p className="text-4xl font-serif mt-1">{formatCurrency(acc.balance, acc.currency)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-10 rounded-[48px] bg-white border border-[#F0EFEF] shadow-sm space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-serif">Aggregate Liquidity Over Time</h3>
                      <p className="text-xs text-[#666666] uppercase tracking-widest font-bold">Historical Performance Ledger</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#F5F4F3] rounded-2xl">
                      <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Growth Detected</span>
                    </div>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFEF" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#999999', fontWeight: 600 }} 
                          dy={15}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#999999', fontWeight: 600 }}
                          tickFormatter={(val) => `$${(val/1000).toFixed(1)}k`}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '24px', 
                            border: '1px solid #F0EFEF', 
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '16px'
                          }}
                          itemStyle={{ color: '#1A1A1A' }}
                          cursor={{ stroke: '#1A1A1A', strokeWidth: 1, strokeDasharray: '5 5' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#1A1A1A" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorBalance)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif">Recent Account Activity</h3>
                    </div>
                    <div className="space-y-4">
                      {accounts.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-[#E0DEDC] rounded-[32px] text-center">
                          <p className="text-[#666666]">No sovereign accounts detected.</p>
                        </div>
                      ) : (
                        accounts.slice(0, 4).map(acc => (
                          <div 
                            key={acc.id}
                            onClick={() => setSelectedAccount(acc)}
                            className="p-6 rounded-3xl bg-white border border-[#F0EFEF] hover:border-[#1A1A1A] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-[#F5F4F3] flex items-center justify-center font-serif text-lg">
                                {acc.name[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold">{acc.name}</p>
                                <p className="text-xs text-[#666666] uppercase tracking-wider">{acc.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-medium">{formatCurrency(acc.balance, acc.currency)}</p>
                              <p className="text-[10px] text-[#999999] uppercase font-bold">{acc.currency}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif">Income Health</h3>
                    </div>
                    <div className="p-8 rounded-[32px] bg-[#F5F4F3] border border-[#E0DEDC] space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-[#22C55E]" />
                        </div>
                        <div>
                          <p className="text-xs text-[#666666] uppercase font-bold">Monthly Velocity</p>
                          <p className="text-2xl font-serif">{formatCurrency(incomeStreams.reduce((sum, s) => sum + s.expectedAmount, 0), 'USD')}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {incomeStreams.map(stream => (
                          <div key={stream.id} className="flex justify-between items-center text-sm py-1">
                            <span className="text-[#666666]">{stream.name}</span>
                            <span className="font-mono font-medium">+{formatCurrency(stream.expectedAmount, stream.currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            ) : activeTab === 'wallet' ? (
              <motion.div 
                key="wallet"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <header className="space-y-1">
                  <p className="text-sm font-medium text-[#666666] uppercase tracking-widest">Sovereign Wallet</p>
                  <h2 className="text-4xl font-serif leading-tight">Unified Asset Command</h2>
                </header>

                <div className="p-12 rounded-[48px] bg-[#1A1A1A] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Globe className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 space-y-12">
                    <div className="space-y-2">
                      <p className="text-sm text-white/60 font-medium">Aggregate Liquidity (USD Equivalent)</p>
                      <p className="text-7xl font-serif">
                        {formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-8">
                      {Array.from(new Set(accounts.map(a => a.currency))).map(curr => {
                        const total = accounts.filter(a => a.currency === curr).reduce((s, a) => s + a.balance, 0);
                        return (
                          <div key={curr} className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{curr} Exposure</p>
                            <p className="text-xl font-mono font-medium">{formatCurrency(total, curr)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button className="p-8 rounded-[32px] bg-white border border-[#F0EFEF] flex items-center gap-6 hover:border-[#1A1A1A] transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-[#F5F4F3] flex items-center justify-center group-hover:bg-[#1A1A1A] transition-colors">
                      <ArrowRightLeft className="w-6 h-6 text-[#1A1A1A] group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Currency Exchange</p>
                      <p className="text-xs text-[#666666]">Swap between USD, EUR, GBP, and D9C.</p>
                    </div>
                  </button>
                  <button className="p-8 rounded-[32px] bg-white border border-[#F0EFEF] flex items-center gap-6 hover:border-[#1A1A1A] transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-[#F5F4F3] flex items-center justify-center group-hover:bg-[#1A1A1A] transition-colors">
                      <PieChart className="w-6 h-6 text-[#1A1A1A] group-hover:text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Diversification Audit</p>
                      <p className="text-xs text-[#666666]">Analyze asset distribution across jurisdictions.</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : activeTab === 'income' ? (
              <motion.div 
                key="income"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <header className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#666666] uppercase tracking-widest">Income Streams</p>
                    <h2 className="text-4xl font-serif leading-tight">Revenue Orchestration</h2>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={handlePipeIncome}
                      disabled={isPiping || incomeStreams.length === 0}
                      className={cn(
                        "px-6 py-3 border border-[#1A1A1A] text-[#1A1A1A] rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all",
                        isPiping ? "opacity-50 cursor-wait" : "hover:bg-[#1A1A1A] hover:text-white"
                      )}
                    >
                      <ArrowRightLeft className={cn("w-4 h-4", isPiping && "animate-spin")} />
                      {isPiping ? 'Piping Assets...' : 'Pipe All Income'}
                    </button>
                    <button 
                      onClick={() => setShowCreateIncome(true)}
                      className="px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#333333] transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Register Stream
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {incomeStreams.length === 0 ? (
                    <div className="col-span-2 p-24 border-2 border-dashed border-[#E0DEDC] rounded-[48px] text-center space-y-4">
                      <p className="text-lg text-[#666666]">No active revenue streams detected.</p>
                      <button 
                        onClick={() => setShowCreateIncome(true)}
                        className="text-[#1A1A1A] font-bold underline"
                      >
                        Initialize Your First Stream
                      </button>
                    </div>
                  ) : (
                    incomeStreams.map(stream => (
                      <div key={stream.id} className="p-8 rounded-[40px] bg-white border border-[#F0EFEF] space-y-8 hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="text-xl font-serif">{stream.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                                stream.status === 'active' ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-[#F5F4F3] text-[#666666]"
                              )}>
                                {stream.status}
                              </span>
                              <span className="text-[10px] text-[#999999] uppercase font-bold tracking-widest">{stream.frequency}</span>
                            </div>
                          </div>
                          <div className="p-3 bg-[#F5F4F3] rounded-2xl group-hover:bg-[#1A1A1A] transition-colors">
                            <TrendingUp className="w-5 h-5 text-[#1A1A1A] group-hover:text-white" />
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] text-[#666666] uppercase font-bold tracking-widest">Expected Yield</p>
                            <p className="text-3xl font-serif">{formatCurrency(stream.expectedAmount, stream.currency)}</p>
                          </div>
                          <button className="p-2 text-[#999999] hover:text-[#1A1A1A]">
                            <Settings2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'legal' ? (
              <motion.div 
                key="legal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <header className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#666666] uppercase tracking-widest">Executive Representation</p>
                    <h2 className="text-4xl font-serif leading-tight">Legal Matters</h2>
                  </div>
                  <div className="flex gap-4">
                    {legalCases.length === 0 && (
                      <button 
                        onClick={() => user && seedInitialCases(user.uid)}
                        className="px-6 py-3 border border-[#1A1A1A] text-[#1A1A1A] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all"
                      >
                        Seed Initial Cases
                      </button>
                    )}
                    <button 
                      onClick={() => setShowCreateLegal(true)}
                      className="px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#333333] transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      New Legal Case
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {legalCases.length === 0 ? (
                      <div className="p-24 border-2 border-dashed border-[#E0DEDC] rounded-[48px] text-center">
                        <p className="text-[#666666]">No active sovereign litigation detected.</p>
                      </div>
                    ) : (
                      legalCases.map(lCase => (
                        <div 
                          key={lCase.id}
                          onClick={() => setSelectedCase(lCase)}
                          className={cn(
                            "p-8 rounded-[40px] bg-white border transition-all cursor-pointer group",
                            selectedCase?.id === lCase.id ? "border-[#1A1A1A] shadow-xl" : "border-[#F0EFEF] hover:border-[#1A1A1A]"
                          )}
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                              <h4 className="text-xl font-serif">{lCase.title}</h4>
                              <p className="text-[10px] text-[#999999] uppercase font-bold tracking-widest">{lCase.type.replace('_', ' ')}</p>
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                              lCase.status === 'active' ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-[#FEF2F2] text-[#EF4444]"
                            )}>
                              {lCase.status}
                            </div>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-[#666666] uppercase font-bold tracking-widest">Case Magnitude</p>
                              <p className="text-2xl font-serif">{formatCurrency(lCase.magnitude, lCase.currency)}</p>
                            </div>
                            <div className="flex -space-x-2">
                              {lCase.representedEntities.map(entity => (
                                <div key={entity} className="w-8 h-8 rounded-full bg-[#1A1A1A] border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                                  {entity[0]}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-[#F5F4F3] rounded-[48px] border border-[#E0DEDC] overflow-hidden flex flex-col h-[600px]">
                    {selectedCase ? (
                      <>
                        <div className="p-8 border-b border-[#E0DEDC] bg-white">
                          <h4 className="font-serif text-lg">Case Correspondence: {selectedCase.title}</h4>
                          <p className="text-xs text-[#666666]">Executive Lawyer representing Timothy & Misaki</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                          {correspondence.length === 0 ? (
                            <p className="text-center text-[#999999] text-sm py-12">No formal communication logged.</p>
                          ) : (
                            correspondence.map(msg => (
                              <div key={msg.id} className="space-y-2">
                                <div className="flex justify-between text-[10px] text-[#999999] uppercase font-bold tracking-widest">
                                  <span>To: {msg.recipient}</span>
                                  <span>{new Date(msg.timestamp).toLocaleDateString()}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-[#F0EFEF] text-sm leading-relaxed whitespace-pre-wrap">
                                  <p className="font-bold mb-2">Subject: {msg.subject}</p>
                                  {msg.body}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Case Evidence Documents */}
                        <div className="p-8 border-t border-[#E0DEDC] bg-[#FDFCFB] space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Associated Evidence</h5>
                            <button 
                              onClick={() => {
                                setNewDocAssocId(selectedCase.id);
                                setNewDocAssocType('legal_case');
                                setShowCreateDocument(true);
                              }}
                              className="text-[10px] font-bold text-[#1A1A1A] underline"
                            >
                              Add Evidence
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {documents.filter(d => d.associatedId === selectedCase.id).length === 0 ? (
                              <p className="text-[10px] text-[#999999]">No evidence documents attached to this case.</p>
                            ) : (
                              documents.filter(d => d.associatedId === selectedCase.id).map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-[#F0EFEF] rounded-xl">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-[#666666]" />
                                    <div>
                                      <p className="text-[10px] font-bold">{doc.name}</p>
                                      <p className="text-[8px] text-[#999999] uppercase">{doc.type}</p>
                                    </div>
                                  </div>
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-[#F5F4F3] rounded-lg">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="p-6 bg-white border-t border-[#E0DEDC]">
                          <form onSubmit={handleSendCorrespondence} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <input 
                                type="text" 
                                value={newMsgRecipient}
                                onChange={(e) => setNewMsgRecipient(e.target.value)}
                                placeholder="Recipient"
                                className="p-3 bg-[#F5F4F3] border-none rounded-xl text-xs"
                              />
                              <input 
                                type="text" 
                                value={newMsgSubject}
                                onChange={(e) => setNewMsgSubject(e.target.value)}
                                placeholder="Subject"
                                className="p-3 bg-[#F5F4F3] border-none rounded-xl text-xs"
                              />
                            </div>
                            <textarea 
                              value={newMsgBody}
                              onChange={(e) => setNewMsgBody(e.target.value)}
                              placeholder="Draft formal legal notice..."
                              className="w-full p-4 bg-[#F5F4F3] border-none rounded-2xl text-sm min-h-[100px] resize-none"
                            />
                            <button 
                              type="submit"
                              className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#333333] transition-all"
                            >
                              Dispatch Legal Notice
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                        <Shield className="w-12 h-12 text-[#999999]" />
                        <p className="text-[#666666]">Select a case to view executive correspondence and orchestration.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'evidence' ? (
              <motion.div 
                key="evidence"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <header className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#666666] uppercase tracking-widest">Sovereign Filing System</p>
                    <h2 className="text-4xl font-serif leading-tight">Evidence Vault</h2>
                  </div>
                  <button 
                    onClick={() => setShowCreateDocument(true)}
                    className="px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#333333] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    File New Evidence
                  </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.length === 0 ? (
                    <div className="col-span-full p-24 border-2 border-dashed border-[#E0DEDC] rounded-[48px] text-center space-y-4">
                      <FileSearch className="w-12 h-12 text-[#999999] mx-auto" />
                      <p className="text-[#666666]">No filed evidence detected in the vault.</p>
                    </div>
                  ) : (
                    documents.map(doc => (
                      <div key={doc.id} className="p-6 rounded-[32px] bg-white border border-[#F0EFEF] space-y-6 hover:shadow-lg transition-all group">
                        <div className="flex justify-between items-start">
                          <div className="p-3 bg-[#F5F4F3] rounded-2xl group-hover:bg-[#1A1A1A] transition-colors">
                            <FileText className="w-6 h-6 text-[#1A1A1A] group-hover:text-white" />
                          </div>
                          <div className={cn(
                            "px-2 py-1 rounded-full text-[8px] font-bold uppercase",
                            doc.status === 'verified' ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-[#F5F4F3] text-[#666666]"
                          )}>
                            {doc.status}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-lg truncate">{doc.name}</h4>
                          <p className="text-[10px] text-[#999999] uppercase font-bold tracking-widest">{doc.type.replace('_', ' ')}</p>
                        </div>
                        <div className="pt-4 border-t border-[#F5F4F3] flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {doc.associatedType === 'legal_case' ? (
                              <Shield className="w-3 h-3 text-[#666666]" />
                            ) : (
                              <Wallet className="w-3 h-3 text-[#666666]" />
                            )}
                            <span className="text-[10px] text-[#666666] font-medium truncate max-w-[100px]">
                              {doc.associatedId ? (
                                doc.associatedType === 'legal_case' 
                                  ? legalCases.find(c => c.id === doc.associatedId)?.title 
                                  : accounts.find(a => a.id === doc.associatedId)?.name
                              ) : 'Global'}
                            </span>
                          </div>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-[#F5F4F3] rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="debts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <header className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#666666] uppercase tracking-widest">Debt Registry</p>
                    <h2 className="text-4xl font-serif leading-tight">Asset Recovery</h2>
                  </div>
                  <div className="flex gap-4">
                    {recoveryTeams.length === 0 && (
                      <button 
                        onClick={() => seedRecoveryTeams()}
                        className="px-6 py-3 border border-[#1A1A1A] text-[#1A1A1A] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all"
                      >
                        Seed Teams
                      </button>
                    )}
                    <button 
                      onClick={() => setShowCreateDebt(true)}
                      className="px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#333333] transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Register Debt
                    </button>
                  </div>
                </header>

                <div className="space-y-6">
                  {debts.length === 0 ? (
                    <div className="p-24 border-2 border-dashed border-[#E0DEDC] rounded-[48px] text-center space-y-4">
                      <p className="text-lg text-[#666666]">No outstanding sovereign debts detected.</p>
                    </div>
                  ) : (
                    debts.map(debt => (
                      <div key={debt.id} className="p-8 rounded-[40px] bg-white border border-[#F0EFEF] flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-16 h-16 rounded-3xl flex items-center justify-center",
                            debt.status === 'active_recovery' ? "bg-[#FEF2F2] text-[#EF4444]" : "bg-[#F5F4F3] text-[#1A1A1A]"
                          )}>
                            <Gavel className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-2xl font-serif">{debt.debtorName}</h4>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                                debt.status === 'active_recovery' ? "bg-[#EF4444] text-white" : "bg-[#F5F4F3] text-[#666666]"
                              )}>
                                {debt.status.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-[#999999] uppercase font-bold tracking-widest">{debt.currency}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-12">
                          <div className="text-right">
                            <p className="text-[10px] text-[#666666] uppercase font-bold tracking-widest">Outstanding Amount</p>
                            <p className="text-3xl font-serif">{formatCurrency(debt.amount, debt.currency)}</p>
                          </div>
                          
                          {debt.status === 'pending' ? (
                            <button 
                              onClick={() => setSelectedDebt(debt)}
                              className="px-6 py-3 bg-[#1A1A1A] text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#333333] transition-all"
                            >
                              Orchestrate Recovery
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#F5F4F3] rounded-2xl">
                              <UserCheck className="w-4 h-4 text-[#22C55E]" />
                              <span className="text-xs font-bold text-[#666666] uppercase tracking-wider">Authorized by {debt.authorizedBy}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )
          ) : (
            <motion.div 
              key="account-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                  <button 
                    onClick={() => setSelectedAccount(null)}
                    className="text-xs font-bold text-[#666666] uppercase tracking-widest hover:text-[#1A1A1A] mb-4 block"
                  >
                    ← Back to Control Center
                  </button>
                  <p className="text-sm font-medium text-[#666666] uppercase tracking-widest">{selectedAccount.type}</p>
                  <h2 className="text-4xl font-serif leading-tight">{selectedAccount.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#666666] font-medium">Account Liquidity</p>
                  <p className="text-5xl font-serif mt-1">{formatCurrency(selectedAccount.balance, selectedAccount.currency)}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <section className="space-y-6">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      <h3 className="text-xl font-serif">Categorized Ledger</h3>
                    </div>
                    <div className="space-y-2">
                      {transactions.length === 0 ? (
                        <p className="p-12 text-center text-[#666666] bg-[#F5F4F3] rounded-[32px]">No entries for this jurisdiction.</p>
                      ) : (
                        transactions.map(tx => (
                          <div key={tx.id} className="p-5 flex items-center justify-between border-b border-[#F0EFEF] last:border-0 hover:bg-[#F5F4F3] rounded-2xl transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                tx.type === 'credit' ? "bg-[#F0FDF4] text-[#22C55E]" : "bg-[#FEF2F2] text-[#EF4444]"
                              )}>
                                {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold">{tx.description || (tx.type === 'credit' ? 'Inward Transfer' : 'Outward Remittance')}</p>
                                  {tx.category && (
                                    <span className="text-[9px] uppercase font-bold text-[#999999] px-1.5 py-0.5 rounded border border-[#E0DEDC]">
                                      {tx.category}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#999999] font-mono">{tx.dragon9Timestamp}</p>
                              </div>
                            </div>
                            <p className={cn(
                              "font-mono font-medium text-lg",
                              tx.type === 'credit' ? "text-[#22C55E]" : "text-[#1A1A1A]"
                            )}>
                              {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section className="p-8 rounded-[32px] bg-white border border-[#F0EFEF] shadow-sm space-y-6">
                    <h3 className="text-lg font-serif">Execute Entry</h3>
                    <form onSubmit={handleTransaction} className="space-y-4">
                      <div className="flex rounded-2xl bg-[#F5F4F3] p-1">
                        {(['credit', 'debit'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setTxType(type)}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                              txType === type ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#999999]"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold px-1">Classification</label>
                        <select
                          value={txCategory}
                          onChange={(e) => setTxCategory(e.target.value as any)}
                          className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm appearance-none"
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                          <option value="transfer">Transfer</option>
                          <option value="sovereign_tax">Sovereign Tax</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold px-1">Magnitude</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={txAmount}
                            onChange={(e) => setTxAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all font-mono text-lg"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#999999]">{selectedAccount.currency}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold px-1">Narration</label>
                        <input
                          type="text"
                          value={txDesc}
                          onChange={(e) => setTxDesc(e.target.value)}
                          placeholder="Sovereign settlement..."
                          className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#333333] transition-all shadow-xl shadow-black/5"
                      >
                        Authorize Entry
                      </button>
                    </form>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Create Account Modal */}
      <AnimatePresence>
        {showCreateAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateAccount(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#FDFCFB] rounded-[40px] p-10 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-serif">New Ledger Jurisdiction</h3>
                <p className="text-sm text-[#666666]">Establish a new entity for international asset management.</p>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Designation</label>
                  <input
                    autoFocus
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="e.g. European Operations"
                    className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Classification</label>
                    <div className="flex flex-col gap-2">
                      {(['checking', 'savings', 'sovereign_vault', 'digital_wallet', 'ecosystem_vault'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewAccountType(type)}
                          className={cn(
                            "p-3 rounded-xl text-left transition-all border",
                            newAccountType === type 
                              ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                              : "bg-white text-[#666666] border-[#F0EFEF] hover:border-[#E0DEDC]",
                            type === 'ecosystem_vault' && "border-[#1A1A1A] border-dashed"
                          )}
                        >
                          <p className="font-bold text-[10px] uppercase tracking-widest flex items-center justify-between">
                            {type.replace('_', ' ')}
                            {type === 'ecosystem_vault' && <Lock className="w-3 h-3" />}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Currency Anchor</label>
                    <div className="flex flex-col gap-2">
                      {['USD', 'EUR', 'GBP', 'JPY', 'D9C'].map(curr => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setNewAccountCurrency(curr)}
                          className={cn(
                            "p-3 rounded-xl text-left transition-all border",
                            newAccountCurrency === curr 
                              ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                              : "bg-white text-[#666666] border-[#F0EFEF] hover:border-[#E0DEDC]"
                          )}
                        >
                          <p className="font-bold text-[10px] uppercase tracking-widest">{curr}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#333333] transition-all"
                >
                  Confirm Establishment
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Income Modal */}
      <AnimatePresence>
        {showCreateIncome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateIncome(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#FDFCFB] rounded-[40px] p-10 shadow-2xl space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-serif">Register Revenue Stream</h3>
                <p className="text-sm text-[#666666]">Configure a new inward yield source for your sovereign suite.</p>
              </div>

              <form onSubmit={handleCreateIncome} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Stream Identity</label>
                  <input
                    autoFocus
                    type="text"
                    value={newIncomeName}
                    onChange={(e) => setNewIncomeName(e.target.value)}
                    placeholder="e.g. Media Architecture Retainer"
                    className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Yield Magnitude</label>
                    <input
                      type="number"
                      value={newIncomeAmount}
                      onChange={(e) => setNewIncomeAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Currency</label>
                    <select
                      value={newIncomeCurrency}
                      onChange={(e) => setNewIncomeCurrency(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm appearance-none"
                    >
                      {['USD', 'EUR', 'GBP', 'JPY', 'D9C'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Occurrence Pattern</label>
                  <div className="flex gap-2">
                    {(['recurring', 'one-time'] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setNewIncomeFreq(f)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                          newIncomeFreq === f ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-white text-[#666666] border-[#F0EFEF]"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#333333] transition-all"
                >
                  Register Revenue Vector
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Register Debt Modal */}
      <AnimatePresence>
        {showCreateDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateDebt(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#FDFCFB] rounded-[40px] p-10 shadow-2xl space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-serif">Register Outstanding Debt</h3>
                <p className="text-sm text-[#666666]">Identify a target entity for sovereign recovery orchestration.</p>
              </div>

              <form onSubmit={handleCreateDebt} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Debtor Designation</label>
                  <input
                    autoFocus
                    type="text"
                    value={newDebtName}
                    onChange={(e) => setNewDebtName(e.target.value)}
                    placeholder="e.g. Acme Corp Default"
                    className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Debt Magnitude</label>
                    <input
                      type="number"
                      value={newDebtAmount}
                      onChange={(e) => setNewDebtAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Currency</label>
                    <select
                      value={newDebtCurrency}
                      onChange={(e) => setNewDebtCurrency(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm appearance-none"
                    >
                      {['USD', 'EUR', 'GBP', 'JPY', 'D9C'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#333333] transition-all"
                >
                  Register Debt Entity
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Recovery Orchestration Modal */}
      <AnimatePresence>
        {selectedDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDebt(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#FDFCFB] rounded-[48px] p-12 shadow-2xl space-y-10"
            >
              <div className="space-y-2">
                <h3 className="text-3xl font-serif">Recovery Orchestration</h3>
                <p className="text-sm text-[#666666]">Assign a specialized enforcement team for {selectedDebt.debtorName}.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Available Asset Teams</label>
                  <div className="space-y-3">
                    {recoveryTeams.map(team => (
                      <div key={team.id} className="p-4 rounded-2xl bg-white border border-[#F0EFEF] hover:border-[#1A1A1A] transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-sm">{team.name}</p>
                          <Zap className="w-4 h-4 text-[#EAB308]" />
                        </div>
                        <p className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">{team.specialization}</p>
                        <div className="w-full h-1 bg-[#F5F4F3] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1A1A1A]" style={{ width: `${team.efficiency * 100}%` }} />
                        </div>
                        <p className="text-[8px] text-right mt-1 font-bold text-[#999999]">{Math.round(team.efficiency * 100)}% SUCCESS RATE</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8 bg-[#F5F4F3] p-8 rounded-[32px] border border-[#E0DEDC]">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[#EF4444]">
                      <Shield className="w-5 h-5" />
                      <p className="text-xs font-bold uppercase tracking-widest">Sovereign Authorization Required</p>
                    </div>
                    <p className="text-xs text-[#666666] leading-relaxed">
                      To initiate an active recovery operation, you must secure authorization from either Timothy or Misaki.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => handleAssignTeam(selectedDebt.id, recoveryTeams[0]?.id, 'Timothy')}
                      className="w-full py-4 bg-white border border-[#1A1A1A] text-[#1A1A1A] rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Authorize via Timothy
                    </button>
                    <button 
                      onClick={() => handleAssignTeam(selectedDebt.id, recoveryTeams[0]?.id, 'Misaki')}
                      className="w-full py-4 bg-white border border-[#1A1A1A] text-[#1A1A1A] rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Authorize via Misaki
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Legal Case Modal */}
      <AnimatePresence>
        {showCreateLegal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateLegal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#FDFCFB] rounded-[48px] p-12 shadow-2xl space-y-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="space-y-2">
                <h3 className="text-3xl font-serif">Initiate Legal Action</h3>
                <p className="text-sm text-[#666666]">Define the parameters for executive representation and asset recovery.</p>
              </div>

              <form onSubmit={handleCreateLegal} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Case Designation</label>
                  <input
                    autoFocus
                    type="text"
                    value={newLegalTitle}
                    onChange={(e) => setNewLegalTitle(e.target.value)}
                    placeholder="e.g. New Zealand Asset Withdrawal"
                    className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Action Type</label>
                    <select
                      value={newLegalType}
                      onChange={(e) => setNewLegalType(e.target.value as any)}
                      className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm appearance-none"
                    >
                      <option value="corruption_recovery">Corruption Recovery</option>
                      <option value="asset_withdrawal">Asset Withdrawal</option>
                      <option value="sovereign_litigation">Sovereign Litigation</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Magnitude</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={newLegalMagnitude}
                        onChange={(e) => setNewLegalMagnitude(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                      />
                      <select 
                        value={newLegalCurrency}
                        onChange={(e) => setNewLegalCurrency(e.target.value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-[10px] font-bold"
                      >
                        {['NZD', 'USD', 'EUR', 'GBP', 'JPY', 'D9C'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Case Brief</label>
                  <textarea
                    value={newLegalDescription}
                    onChange={(e) => setNewLegalDescription(e.target.value)}
                    placeholder="Provide details for executive representation..."
                    className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm min-h-[120px] resize-none"
                  />
                </div>

                <div className="p-6 rounded-3xl bg-[#F5F4F3] border border-[#E0DEDC]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999] mb-4">Represented Entities</p>
                  <div className="flex gap-4">
                    {['Timothy', 'Misaki'].map(entity => (
                      <div key={entity} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#F0EFEF]">
                        <UserCheck className="w-4 h-4 text-[#1A1A1A]" />
                        <span className="text-xs font-bold">{entity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#333333] transition-all"
                >
                  Initiate Executive Representation
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* File Document Modal */}
      <AnimatePresence>
        {showCreateDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateDocument(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#FDFCFB] rounded-[48px] p-12 shadow-2xl space-y-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="space-y-2">
                <h3 className="text-3xl font-serif">File Sovereign Evidence</h3>
                <p className="text-sm text-[#666666]">Register a new document in the high-security evidence vault.</p>
              </div>

              <form onSubmit={handleCreateDocument} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Document Designation</label>
                  <input
                    autoFocus
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="e.g. KiwiSaver Balance Certificate"
                    className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Classification</label>
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value as any)}
                      className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm appearance-none"
                    >
                      <option value="sovereign_filing">Sovereign Filing</option>
                      <option value="account_proof">Account Proof</option>
                      <option value="legal_evidence">Legal Evidence</option>
                      <option value="invoice">Invoice</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#999999] font-bold">Secure URL / Reference</label>
                    <input
                      type="text"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-4 rounded-2xl bg-[#F5F4F3] border-none focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-[#F5F4F3] border border-[#E0DEDC] space-y-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999]">Jurisdictional Association (Optional)</p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      {(['legal_case', 'account'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => { setNewDocAssocType(type); setNewDocAssocId(''); }}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                            newDocAssocType === type ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-white text-[#666666] border-[#F0EFEF]"
                          )}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <select
                      value={newDocAssocId}
                      onChange={(e) => setNewDocAssocId(e.target.value)}
                      className="w-full p-4 rounded-2xl bg-white border border-[#F0EFEF] focus:ring-2 focus:ring-[#1A1A1A] transition-all text-sm appearance-none"
                    >
                      <option value="">Global (No Association)</option>
                      {newDocAssocType === 'legal_case' 
                        ? legalCases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)
                        : accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                      }
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#333333] transition-all"
                >
                  Archive Evidence in Vault
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
