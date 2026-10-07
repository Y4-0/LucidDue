"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { 
  Modal, 
  Drawer, 
  FormField, 
  DateInput, 
  CurrencyInput, 
  Select, 
  ConfirmDialog, 
  useToast 
} from "@/components/ui/core";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastComponent } = useToast();

  // Dashboard Data State
  const [metrics, setMetrics] = useState({
    totalOutstanding: 0,
    dueThisWeek: 0,
    overdueInvoices: 0,
    activeClients: 0
  });
  const [clients, setClients] = useState<{ value: string, label: string }[]>([]);
  const [upcomingInvoices, setUpcomingInvoices] = useState<any[]>([]);
  const [actionNeededInvoices, setActionNeededInvoices] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- Add Client State ---
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [showClientConfirm, setShowClientConfirm] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const initialClientForm = { name: "", email: "", company: "", notes: "" };
  const [clientForm, setClientForm] = useState(initialClientForm);
  const isClientDirty = JSON.stringify(clientForm) !== JSON.stringify(initialClientForm);

  // --- Add Invoice State ---
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [showInvoiceConfirm, setShowInvoiceConfirm] = useState(false);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const initialInvoiceForm = { 
    client: "", 
    invoiceNumber: "INV-" + Math.floor(Math.random() * 10000), 
    amount: "", 
    issueDate: new Date().toISOString().split('T')[0], 
    dueDate: "", 
    notes: "" 
  };
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm);
  const isInvoiceDirty = JSON.stringify(invoiceForm) !== JSON.stringify(initialInvoiceForm);

  // Initial Fetch
  useEffect(() => {
    authClient.getSession().then(({ data, error }) => {
       if (error || !data) {
          router.push("/login");
       } else {
          setSession(data);
          fetchDashboardData();
       }
       setLoading(false);
    });
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const res = await authClient.$fetch("http://localhost:3001/api/dashboard", { method: 'GET' });
      if (res.data) {
        setMetrics(res.data.metrics);
        setClients(res.data.clients);
        setUpcomingInvoices(res.data.upcomingInvoices);
        setActionNeededInvoices(res.data.actionNeededInvoices);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  // --- Handlers for Add Client ---
  const closeAddClient = () => {
    if (isClientDirty) setShowClientConfirm(true);
    else setIsAddClientOpen(false);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;
    
    setIsSavingClient(true);
    try {
      await authClient.$fetch("http://localhost:3001/api/clients", {
        method: 'POST',
        body: clientForm
      });
      await fetchDashboardData(); // Refresh list immediately
      setClientForm(initialClientForm);
      setIsAddClientOpen(false);
      showToast("Client added successfully");
    } catch (e) {
      showToast("Failed to save client", "error");
    } finally {
      setIsSavingClient(false);
    }
  };

  // --- Handlers for Add Invoice ---
  const closeAddInvoice = () => {
    if (isInvoiceDirty) setShowInvoiceConfirm(true);
    else setIsAddInvoiceOpen(false);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.client || !invoiceForm.amount || !invoiceForm.dueDate) return;
    if (parseFloat(invoiceForm.amount) <= 0) {
      showToast("Amount must be greater than 0", "error");
      return;
    }
    
    setIsSavingInvoice(true);
    try {
      await authClient.$fetch("http://localhost:3001/api/invoices", {
        method: 'POST',
        body: invoiceForm
      });
      await fetchDashboardData(); // Refresh lists and metrics immediately
      setInvoiceForm({ ...initialInvoiceForm, invoiceNumber: "INV-" + Math.floor(Math.random() * 10000) });
      setIsAddInvoiceOpen(false);
      showToast("Invoice created successfully");
    } catch (e) {
      showToast("Failed to save invoice", "error");
    } finally {
      setIsSavingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-[#6A6A65]">Loading session...</p>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(' ')[0] || "Arjun";
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('en-US', dateOptions);
  const formattedCurrencyZero = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(0);
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-8 md:p-12 font-sans text-[#2C2C2A]">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-serif text-[#2C2C2A] tracking-tight">
              Good evening, {firstName}
            </h1>
            <p className="text-[#6A6A65] mt-2 font-medium">{today}</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setIsAddClientOpen(true)}
              className="px-5 py-2.5 bg-transparent text-[#2C2C2A] font-medium border border-transparent hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
            >
              + Add Client
            </button>
            <button 
              onClick={() => setIsAddInvoiceOpen(true)}
              className="px-5 py-2.5 bg-[#3A4A3F] hover:bg-[#2E3A32] text-white font-medium rounded-lg transition-colors cursor-pointer shadow-sm"
            >
              + New Invoice
            </button>
            <button 
              onClick={handleSignOut} 
              className="px-5 py-2.5 bg-transparent text-[#8A3C3C] hover:bg-[#8A3C3C]/10 font-medium rounded-lg transition-colors ml-2 cursor-pointer"
              title="Sign out"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Outstanding" value={metrics.totalOutstanding > 0 ? formatCurrency(metrics.totalOutstanding) : formattedCurrencyZero} valueColor="text-[#2C2C2A]" />
          <MetricCard title="Due This Week" value={metrics.dueThisWeek > 0 ? formatCurrency(metrics.dueThisWeek) : formattedCurrencyZero} valueColor="text-[#6A6A65]" />
          <MetricCard title="Overdue Invoices" value={metrics.overdueInvoices.toString()} valueColor="text-[#8A3C3C]" />
          <MetricCard title="Active Clients" value={metrics.activeClients.toString()} valueColor="text-[#6A6A65]" />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Needs Attention (2/3) */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#6A6A65]">Action Needed</h2>
            
            {/* Empty State for Action Needed */}
            {actionNeededInvoices.length === 0 ? (
              <div className="bg-[#FFFFFF] border border-[#EFECE6] p-8 md:p-12 rounded-xl flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-[#FDFBF7] rounded-full flex items-center justify-center mb-4 text-[#3A4A3F]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-[#2C2C2A] mb-1">You're all caught up!</h3>
                <p className="text-[#6A6A65]">No invoices need your attention today.</p>
              </div>
            ) : (
              actionNeededInvoices.map(inv => (
                <div key={inv.id} className="bg-[#F9EAEA] border border-[#F4DADA] p-6 md:p-8 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-[#2C2C2A] text-lg">{inv.client?.name}</span>
                      <span className="text-[#6A6A65]">{inv.invoiceNumber}</span>
                    </div>
                    <div className="text-3xl font-medium text-[#2C2C2A] mb-4">{formatCurrency(inv.amount)}</div>
                    <div className="inline-flex px-2.5 py-1 bg-[#F4DADA]/50 border border-[#8A3C3C]/10 text-[#8A3C3C] text-xs font-semibold rounded text-center tracking-wide uppercase">
                      Overdue
                    </div>
                  </div>
                  <button className="whitespace-nowrap px-6 py-3 bg-[#3A4A3F] hover:bg-[#2E3A32] text-white font-medium rounded-lg transition-colors w-full sm:w-auto shadow-sm cursor-pointer">
                    Prepare Follow-up
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Right Column: Upcoming (1/3) */}
          <div className="lg:col-span-1 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#6A6A65]">Coming Up</h2>
            
            <div className="flex flex-col gap-3">
              {upcomingInvoices.length === 0 ? (
                <div className="bg-[#FFFFFF] border border-[#EFECE6] p-6 rounded-xl text-center">
                  <p className="text-sm text-[#6A6A65]">No upcoming invoices this week.</p>
                </div>
              ) : (
                upcomingInvoices.map(inv => (
                  <div key={inv.id} className="bg-[#FFFFFF] border border-[#EFECE6] p-5 rounded-xl group cursor-pointer hover:border-[#3A4A3F]/20 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-semibold text-[#2C2C2A]">{inv.client?.name}</span>
                      <span className="font-semibold text-[#2C2C2A]">{formatCurrency(inv.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[#6A6A65]">Due {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="px-2 py-0.5 bg-[#F0F0EE] text-[#5E5E5A] text-[11px] font-bold tracking-wide uppercase rounded">Upcoming</span>
                      </div>
                      <span className="text-sm font-medium text-[#6A6A65] opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* --- ADD CLIENT MODAL --- */}
      <Modal isOpen={isAddClientOpen} onClose={closeAddClient} title="Add New Client">
        <form onSubmit={handleSaveClient} className="flex flex-col gap-2">
          <FormField 
            label="Client Name" 
            required 
            placeholder="e.g. Acme Corp"
            value={clientForm.name}
            onChange={e => setClientForm({...clientForm, name: e.target.value})}
          />
          <FormField 
            label="Email Address" 
            type="email"
            placeholder="billing@acmecorp.com"
            value={clientForm.email}
            onChange={e => setClientForm({...clientForm, email: e.target.value})}
          />
          <FormField 
            label="Company" 
            placeholder="Acme Corporation LLC"
            value={clientForm.company}
            onChange={e => setClientForm({...clientForm, company: e.target.value})}
          />
          <FormField 
            as="textarea"
            label="Notes" 
            placeholder="Payment terms, special instructions..."
            rows={3}
            value={clientForm.notes}
            onChange={e => setClientForm({...clientForm, notes: e.target.value})}
          />
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#EFECE6]">
            <button type="button" onClick={closeAddClient} className="px-4 py-2 text-[#2C2C2A] font-medium border border-[#EFECE6] rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSavingClient} className="px-5 py-2 bg-[#3A4A3F] hover:bg-[#2E3A32] text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
              {isSavingClient ? "Saving..." : "Save Client"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={showClientConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close this form? Your changes will be lost."
        confirmText="Discard Changes"
        isDestructive
        onConfirm={() => {
          setShowClientConfirm(false);
          setClientForm(initialClientForm);
          setIsAddClientOpen(false);
        }}
        onCancel={() => setShowClientConfirm(false)}
      />

      {/* --- ADD INVOICE DRAWER --- */}
      <Drawer isOpen={isAddInvoiceOpen} onClose={closeAddInvoice} title="Create New Invoice">
        <form onSubmit={handleSaveInvoice} className="flex flex-col h-full">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-[#2C2C2A]">Client <span className="text-[#8A3C3C]">*</span></label>
              <button 
                type="button" 
                className="text-xs font-medium text-[#3A4A3F] hover:underline cursor-pointer"
                onClick={() => setIsAddClientOpen(true)}
              >
                Create new client
              </button>
            </div>
            <Select 
              label=""
              required
              options={clients}
              value={invoiceForm.client}
              onChange={e => setInvoiceForm({...invoiceForm, client: e.target.value})}
            />

            <FormField 
              label="Invoice Number" 
              value={invoiceForm.invoiceNumber}
              onChange={e => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})}
            />
            
            <CurrencyInput 
              label="Amount" 
              required
              min="0.01"
              placeholder="0.00"
              value={invoiceForm.amount}
              onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})}
            />

            <div className="grid grid-cols-2 gap-4">
              <DateInput 
                label="Issue Date" 
                value={invoiceForm.issueDate}
                onChange={e => setInvoiceForm({...invoiceForm, issueDate: e.target.value})}
              />
              <DateInput 
                label="Due Date" 
                required
                value={invoiceForm.dueDate}
                onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
              />
            </div>

            <FormField 
              as="textarea"
              label="Notes" 
              placeholder="Project details, items..."
              rows={4}
              value={invoiceForm.notes}
              onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-[#EFECE6]">
            <button type="button" onClick={closeAddInvoice} className="px-4 py-2 text-[#2C2C2A] font-medium border border-[#EFECE6] rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSavingInvoice} className="px-5 py-2 bg-[#3A4A3F] hover:bg-[#2E3A32] text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
              {isSavingInvoice ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog 
        isOpen={showInvoiceConfirm}
        title="Unsaved Changes"
        message="You have entered data for this invoice. Are you sure you want to close? Your invoice will not be saved."
        confirmText="Discard Invoice"
        isDestructive
        onConfirm={() => {
          setShowInvoiceConfirm(false);
          setInvoiceForm(initialInvoiceForm);
          setIsAddInvoiceOpen(false);
        }}
        onCancel={() => setShowInvoiceConfirm(false)}
      />

      <ToastComponent />
    </div>
  );
}

function MetricCard({ title, value, valueColor }: { title: string, value: string, valueColor: string }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#EFECE6] p-6 rounded-xl flex flex-col justify-between h-[120px]">
      <p className="text-sm font-medium text-[#6A6A65]">{title}</p>
      <p className={`text-3xl font-medium ${valueColor}`}>{value}</p>
    </div>
  );
}
