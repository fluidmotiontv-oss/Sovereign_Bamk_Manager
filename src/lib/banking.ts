import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  runTransaction,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { getDragon9Time } from './utils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'unknown', // Simplified for utility
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Account {
  id: string;
  ownerId: string;
  name: string;
  balance: number;
  currency: string;
  type: 'savings' | 'checking' | 'sovereign_vault' | 'digital_wallet' | 'ecosystem_vault';
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  category?: 'income' | 'expense' | 'transfer' | 'sovereign_tax';
  incomeStreamId?: string;
  description: string;
  timestamp: any;
  dragon9Timestamp: string;
}

export interface IncomeStream {
  id: string;
  ownerId: string;
  name: string;
  frequency: 'one-time' | 'recurring';
  expectedAmount: number;
  currency: string;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
}

export interface Debt {
  id: string;
  ownerId: string;
  debtorName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'active_recovery' | 'recovered' | 'defaulted';
  assignedTeamId?: string;
  authorizedBy?: string;
  createdAt: string;
}

export interface RecoveryTeam {
  id: string;
  name: string;
  specialization: string;
  efficiency: number;
}

export interface LegalCase {
  id: string;
  ownerId: string;
  title: string;
  type: 'corruption_recovery' | 'asset_withdrawal' | 'sovereign_litigation';
  status: 'active' | 'disputed' | 'resolved';
  representedEntities: string[];
  magnitude: number;
  currency: string;
  description: string;
  createdAt: string;
}

export interface LegalCorrespondence {
  id: string;
  caseId: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
}

export interface EvidenceDocument {
  id: string;
  ownerId: string;
  name: string;
  type: 'account_proof' | 'legal_evidence' | 'invoice' | 'sovereign_filing';
  associatedId?: string;
  associatedType?: 'account' | 'legal_case';
  url: string;
  status: 'draft' | 'verified' | 'filed';
  createdAt: string;
}

export function subscribeToAccounts(userId: string, callback: (accounts: Account[]) => void) {
  const q = query(collection(db, 'accounts'), where('ownerId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
    callback(accounts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'accounts');
  });
}

export function subscribeToIncomeStreams(userId: string, callback: (streams: IncomeStream[]) => void) {
  const q = query(collection(db, 'income_streams'), where('ownerId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const streams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncomeStream));
    callback(streams);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'income_streams');
  });
}

export function subscribeToDebts(userId: string, callback: (debts: Debt[]) => void) {
  const q = query(collection(db, 'debts'), where('ownerId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt));
    callback(debts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'debts');
  });
}

export function subscribeToRecoveryTeams(callback: (teams: RecoveryTeam[]) => void) {
  return onSnapshot(collection(db, 'recovery_teams'), (snapshot) => {
    const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecoveryTeam));
    callback(teams);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'recovery_teams');
  });
}

export function subscribeToTransactions(accountId: string, callback: (txs: Transaction[]) => void) {
  const q = query(
    collection(db, `accounts/${accountId}/transactions`), 
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    callback(txs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `accounts/${accountId}/transactions`);
  });
}

export async function createAccount(userId: string, name: string, type: Account['type'], currency: string = 'USD') {
  try {
    await addDoc(collection(db, 'accounts'), {
      ownerId: userId,
      name,
      balance: 0,
      currency,
      type,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'accounts');
  }
}

export async function createIncomeStream(userId: string, name: string, frequency: IncomeStream['frequency'], expectedAmount: number, currency: string) {
  try {
    await addDoc(collection(db, 'income_streams'), {
      ownerId: userId,
      name,
      frequency,
      expectedAmount,
      currency,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'income_streams');
  }
}

export async function createDebt(userId: string, debtorName: string, amount: number, currency: string) {
  try {
    await addDoc(collection(db, 'debts'), {
      ownerId: userId,
      debtorName,
      amount,
      currency,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'debts');
  }
}

export async function assignRecoveryTeam(debtId: string, teamId: string, authorizedBy: 'Timothy' | 'Misaki') {
  try {
    await updateDoc(doc(db, 'debts', debtId), {
      assignedTeamId: teamId,
      status: 'active_recovery',
      authorizedBy
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `debts/${debtId}`);
  }
}

export async function seedRecoveryTeams() {
  const teams = [
    { name: "Ironclad Resolve", specialization: "High-Value Corporate", efficiency: 0.95 },
    { name: "Shadow Sentinels", specialization: "International Sovereign", efficiency: 0.88 },
    { name: "Kyoto Enforcement", specialization: "Tech & IP Recovery", efficiency: 0.92 }
  ];
  
  try {
    for (const team of teams) {
      await addDoc(collection(db, 'recovery_teams'), team);
    }
  } catch (error) {
    console.error("Failed to seed recovery teams:", error);
  }
}

export async function seedInitialCases(userId: string) {
  const initialCases = [
    {
      title: "New Zealand KiwiSaver Withdrawal",
      type: "asset_withdrawal",
      magnitude: 25000,
      currency: "NZD",
      representedEntities: ["Timothy"],
      description: "Formal request for withdrawal of KiwiSaver funds for international asset reallocation.",
      status: "active"
    },
    {
      title: "New Zealand Corruption Recovery",
      type: "corruption_recovery",
      magnitude: 75000,
      currency: "NZD",
      representedEntities: ["Timothy", "Misaki"],
      description: "Recovery of outstanding invoices related to New Zealand operations and corruption litigation.",
      status: "active"
    }
  ];

  try {
    for (const c of initialCases) {
      await addDoc(collection(db, 'legal_cases'), {
        ...c,
        ownerId: userId,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Failed to seed initial cases:", error);
  }
}

export function subscribeToLegalCases(userId: string, callback: (cases: LegalCase[]) => void) {
  const q = query(collection(db, 'legal_cases'), where('ownerId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LegalCase));
    callback(cases);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'legal_cases');
  });
}

export function subscribeToCorrespondence(caseId: string, callback: (msgs: LegalCorrespondence[]) => void) {
  const q = query(collection(db, `legal_cases/${caseId}/correspondence`), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LegalCorrespondence));
    callback(msgs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `legal_cases/${caseId}/correspondence`);
  });
}

export function subscribeToDocuments(userId: string, callback: (docs: EvidenceDocument[]) => void) {
  const q = query(collection(db, 'documents'), where('ownerId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EvidenceDocument));
    callback(docs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'documents');
  });
}

export async function createDocument(
  userId: string,
  name: string,
  type: EvidenceDocument['type'],
  url: string,
  associatedId?: string,
  associatedType?: EvidenceDocument['associatedType']
) {
  try {
    await addDoc(collection(db, 'documents'), {
      ownerId: userId,
      name,
      type,
      url,
      associatedId: associatedId || null,
      associatedType: associatedType || null,
      status: 'draft',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'documents');
  }
}

export async function createLegalCase(
  userId: string, 
  title: string, 
  type: LegalCase['type'], 
  magnitude: number, 
  currency: string, 
  representedEntities: string[],
  description: string
) {
  try {
    await addDoc(collection(db, 'legal_cases'), {
      ownerId: userId,
      title,
      type,
      magnitude,
      currency,
      representedEntities,
      description,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'legal_cases');
  }
}

export async function sendLegalCorrespondence(
  caseId: string,
  sender: string,
  recipient: string,
  subject: string,
  body: string
) {
  try {
    await addDoc(collection(db, `legal_cases/${caseId}/correspondence`), {
      caseId,
      sender,
      recipient,
      subject,
      body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `legal_cases/${caseId}/correspondence`);
  }
}

export async function executeTransaction(
  userId: string, 
  accountId: string, 
  amount: number, 
  type: 'credit' | 'debit',
  description: string,
  category: Transaction['category'] = 'expense',
  incomeStreamId?: string
) {
  const accountRef = doc(db, 'accounts', accountId);
  const txCollectionRef = collection(db, `accounts/${accountId}/transactions`);

  try {
    await runTransaction(db, async (transaction) => {
      const accountDoc = await transaction.get(accountRef);
      if (!accountDoc.exists()) throw new Error("Account does not exist");

      const currentBalance = accountDoc.data().balance;
      const currency = accountDoc.data().currency;
      const newBalance = type === 'credit' ? currentBalance + amount : currentBalance - amount;

      if (type === 'debit' && newBalance < 0) throw new Error("Insufficient sovereign funds");

      transaction.update(accountRef, { balance: newBalance });
      
      const txDocRef = doc(txCollectionRef);
      transaction.set(txDocRef, {
        accountId,
        userId,
        amount,
        currency,
        type,
        category,
        incomeStreamId: incomeStreamId || null,
        description,
        timestamp: serverTimestamp(),
        dragon9Timestamp: getDragon9Time()
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `accounts/${accountId}/transactions`);
  }
}

export async function processIncomeDistribution(userId: string, streams: IncomeStream[], accounts: Account[]) {
  for (const stream of streams) {
    if (stream.status !== 'active') continue;

    // Find first matching account by currency
    const targetAccount = accounts.find(a => a.currency === stream.currency);
    
    if (targetAccount) {
      try {
        await executeTransaction(
          userId,
          targetAccount.id,
          stream.expectedAmount,
          'credit',
          `Income: ${stream.name}`,
          'income',
          stream.id
        );
        
        // Update last processed timestamp
        await updateDoc(doc(db, 'income_streams', stream.id), {
          lastProcessedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Failed to pipe income stream ${stream.id}:`, error);
      }
    } else {
      console.warn(`No matching account found for currency ${stream.currency} for stream ${stream.name}`);
    }
  }
}
