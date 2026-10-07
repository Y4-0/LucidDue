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
  const [clients, setClients] = useState<any[]>([]);
  const [upcomingInvoices, setUpcomingInvoices] = useState<any[]>([]);
  const [actionNeededInvoices, setActionNeededInvoices] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- Add/Update Client State ---
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isManageClientsOpen, setIsManageClientsOpen] = useState(false);
  const [showClientConfirm, setShowClientConfirm] = useState(false);
  const [showDeleteClientConfirm, setShowDeleteClientConfirm] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const initialClientForm = { name: "", email: "", company: "", notes: "" };
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [originalClientForm, setOriginalClientForm] = useState(initialClientForm);
  const isClientDirty = JSON.stringify(clientForm) !== JSON.stringify(originalClientForm);

  // --- Invoice State ---
  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);
  const [showInvoiceConfirm, setShowInvoiceConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const initialInvoiceForm = { 
    client: "", 
    invoiceNumber: "", 
    amount: "", 
    issueDate: new Date().toISOString().split('T')[0], 
    dueDate: "", 
    notes: "" 
  };
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceForm);
  const [originalInvoiceForm, setOriginalInvoiceForm] = useState(initialInvoiceForm);
  const isInvoiceDirty = JSON.stringify(invoiceForm) !== JSON.stringify(originalInvoiceForm);

  // --- Follow Up State ---
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedFollowUpInvoice, setSelectedFollowUpInvoice] = useState<any>(null);
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);

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

  const openFollowUp = (inv: any) => {
    setSelectedFollowUpInvoice(inv);
    setIsFollowUpOpen(true);
  };

  const handleSendFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingFollowUp(true);
    // Simulate sending an email
    setTimeout(() => {
      setIsSendingFollowUp(false);
      setIsFollowUpOpen(false);
      showToast("Follow-up email sent successfully!");
    }, 1200);
  };

  // --- Handlers for Client ---
  const openNewClient = () => {
    setSelectedClientId(null);
    setClientForm(initialClientForm);
    setOriginalClientForm(initialClientForm);
    setIsAddClientOpen(true);
  };

  const openUpdateClient = (client: any) => {
    setSelectedClientId(client.id);
    const updateForm = {
      name: client.name,
      email: client.email || "",
      company: client.company || "",
      notes: client.notes || ""
    };
    setClientForm(updateForm);
    setOriginalClientForm(updateForm);
    setIsManageClientsOpen(false);
    setIsAddClientOpen(true);
  };

  const closeAddClient = () => {
    if (isClientDirty) setShowClientConfirm(true);
    else setIsAddClientOpen(false);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim()) return;
    
    setIsSavingClient(true);
    try {
      if (selectedClientId) {
        await authClient.$fetch(`http://localhost:3001/api/clients/${selectedClientId}`, {
          method: 'PUT',
          body: clientForm
        });
        showToast("Client updated successfully");
      } else {
        await authClient.$fetch("http://localhost:3001/api/clients", {
          method: 'POST',
          body: clientForm
        });
        showToast("Client added successfully");
      }
      await fetchDashboardData();
      setIsAddClientOpen(false);
    } catch (e) {
      showToast("Failed to save client", "error");
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClientId) return;
    setIsDeletingClient(true);
    try {
      await authClient.$fetch(`http://localhost:3001/api/clients/${selectedClientId}`, {
        method: 'DELETE'
      });
      await fetchDashboardData();
      setShowDeleteClientConfirm(false);
      setIsAddClientOpen(false);
      showToast("Client deleted successfully");
    } catch (e) {
      showToast("Failed to delete client", "error");
    } finally {
      setIsDeletingClient(false);
    }
  };

  // --- Handlers for Invoice ---
  const openNewInvoice = () => {
    setSelectedInvoiceId(null);
    const newForm = { ...initialInvoiceForm, invoiceNumber: "INV-" + Math.floor(Math.random() * 10000) };
    setInvoiceForm(newForm);
    setOriginalInvoiceForm(newForm);
    setIsInvoiceDrawerOpen(true);
  };

  const openUpdateInvoice = (inv: any) => {
    setSelectedInvoiceId(inv.id);
    const updateForm = {
      client: inv.clientId,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount.toString(),
      issueDate: new Date(inv.issueDate).toISOString().split('T')[0],
      dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
      notes: inv.notes || ""
    };
    setInvoiceForm(updateForm);
    setOriginalInvoiceForm(updateForm);
    setIsInvoiceDrawerOpen(true);
  };

  const closeInvoiceDrawer = () => {
    if (isInvoiceDirty) setShowInvoiceConfirm(true);
    else setIsInvoiceDrawerOpen(false);
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
      if (selectedInvoiceId) {
        await authClient.$fetch(`http://localhost:3001/api/invoices/${selectedInvoiceId}`, {
          method: 'PUT',
          body: invoiceForm
        });
        showToast("Invoice updated successfully");
      } else {
        await authClient.$fetch("http://localhost:3001/api/invoices", {
          method: 'POST',
          body: invoiceForm
        });
        showToast("Invoice created successfully");
      }
      await fetchDashboardData();
      setIsInvoiceDrawerOpen(false);
    } catch (e) {
      showToast("Failed to save invoice", "error");
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoiceId) return;
    setIsDeletingInvoice(true);
    try {
      await authClient.$fetch(`http://localhost:3001/api/invoices/${selectedInvoiceId}`, {
        method: 'DELETE'
      });
      await fetchDashboardData();
      setShowDeleteConfirm(false);
      setIsInvoiceDrawerOpen(false);
      showToast("Invoice deleted successfully");
    } catch (e) {
      showToast("Failed to delete invoice", "error");
    } finally {
      setIsDeletingInvoice(false);
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

  // Map clients to options format for Select component
  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));

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
          
          <div className="flex gap-4 items-center flex-wrap">
            {clients.length > 0 && (
              <button 
                onClick={() => setIsManageClientsOpen(true)}
                className="px-5 py-2.5 bg-transparent text-[#2C2C2A] font-medium border border-[#EFECE6] hover:bg-black/5 hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"
              >
                Manage Clients
              </button>
            )}
            <button 
              onClick={openNewClient}
              className="px-5 py-2.5 bg-transparent text-[#2C2C2A] font-medium border border-transparent hover:bg-black/5 hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"
            >
              + Add Client
            </button>
            <button 
              onClick={openNewInvoice}
              className="px-5 py-2.5 bg-[#3A4A3F] hover:bg-[#2E3A32] text-white font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
            >
              + New Invoice
            </button>
            <button 
              onClick={handleSignOut} 
              className="px-5 py-2.5 bg-transparent text-[#8A3C3C] hover:bg-[#8A3C3C]/10 font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 ml-2 cursor-pointer"
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
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => openUpdateInvoice(inv)}
                      className="px-6 py-3 bg-transparent border border-[#EFECE6] hover:bg-white text-[#2C2C2A] font-medium rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 w-full sm:w-auto cursor-pointer shadow-sm hover:shadow"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => openFollowUp(inv)}
                      className="whitespace-nowrap px-6 py-3 bg-[#3A4A3F] hover:bg-[#2E3A32] text-white font-medium rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 w-full sm:w-auto shadow-sm hover:shadow cursor-pointer"
                    >
                      Follow-up
                    </button>
                  </div>
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
                  <div key={inv.id} className="bg-[#FFFFFF] border border-[#EFECE6] p-5 rounded-xl group hover:border-[#3A4A3F]/20 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-semibold text-[#2C2C2A] truncate max-w-[150px]">{inv.client?.name}</span>
                      <span className="font-semibold text-[#2C2C2A]">{formatCurrency(inv.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[#6A6A65]">Due {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="px-2 py-0.5 bg-[#F0F0EE] text-[#5E5E5A] text-[11px] font-bold tracking-wide uppercase rounded">Upcoming</span>
                      </div>
                      <button 
                        onClick={() => openUpdateInvoice(inv)}
                        className="text-sm font-medium text-[#6A6A65] hover:text-[#2C2C2A] cursor-pointer"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* --- MANAGE CLIENTS MODAL --- */}
      <Modal isOpen={isManageClientsOpen} onClose={() => setIsManageClientsOpen(false)} title="Manage Clients">
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {clients.map(client => (
            <div key={client.id} className="flex justify-between items-center p-3 border border-[#EFECE6] rounded-lg bg-white">
              <div>
                <p className="font-medium text-[#2C2C2A]">{client.name}</p>
                {client.email && <p className="text-xs text-[#6A6A65] mt-1">{client.email}</p>}
              </div>
              <button 
                onClick={() => openUpdateClient(client)}
                className="px-3 py-1.5 text-xs font-medium text-[#2C2C2A] bg-black/5 hover:bg-black/10 rounded cursor-pointer transition-colors"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-[#EFECE6]">
          <button onClick={() => setIsManageClientsOpen(false)} className="px-4 py-2 text-[#2C2C2A] font-medium border border-[#EFECE6] rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </Modal>

      {/* --- ADD/UPDATE CLIENT MODAL --- */}
      <Modal isOpen={isAddClientOpen} onClose={closeAddClient} title={selectedClientId ? "Update Client" : "Add New Client"}>
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
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#EFECE6]">
            <div>
              {selectedClientId && (
                <button 
                  type="button" 
                  onClick={() => setShowDeleteClientConfirm(true)}
                  className="px-4 py-2 text-[#8A3C3C] font-medium hover:bg-[#8A3C3C]/10 rounded-lg transition-colors cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={closeAddClient} className="px-4 py-2 text-[#2C2C2A] font-medium border border-[#EFECE6] rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={isSavingClient} className="px-5 py-2 bg-[#3A4A3F] hover:bg-[#2E3A32] text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                {isSavingClient ? "Saving..." : (selectedClientId ? "Update" : "Save Client")}
              </button>
            </div>
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

      <ConfirmDialog 
        isOpen={showDeleteClientConfirm}
        title="Delete Client"
        message="Are you sure you want to delete this client? This will also delete all invoices associated with them. This action cannot be undone."
        confirmText={isDeletingClient ? "Deleting..." : "Delete Client"}
        isDestructive
        onConfirm={handleDeleteClient}
        onCancel={() => setShowDeleteClientConfirm(false)}
      />

      {/* --- INVOICE DRAWER --- */}
      <Drawer isOpen={isInvoiceDrawerOpen} onClose={closeInvoiceDrawer} title={selectedInvoiceId ? "Update Invoice" : "Create New Invoice"}>
        <form onSubmit={handleSaveInvoice} className="flex flex-col h-full">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-[#2C2C2A]">Client <span className="text-[#8A3C3C]">*</span></label>
              <button 
                type="button" 
                className="text-xs font-medium text-[#3A4A3F] hover:underline cursor-pointer transition-all"
                onClick={() => { setIsInvoiceDrawerOpen(false); openNewClient(); }}
              >
                Create new client
              </button>
            </div>
            <Select 
              label=""
              required
              options={clientOptions}
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
          
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-[#EFECE6]">
            <div>
              {selectedInvoiceId && (
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-[#8A3C3C] font-medium hover:bg-[#8A3C3C]/10 rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={closeInvoiceDrawer} className="px-4 py-2 text-[#2C2C2A] font-medium border border-[#EFECE6] hover:bg-black/5 hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={isSavingInvoice} className="px-5 py-2 bg-[#3A4A3F] hover:bg-[#2E3A32] text-white font-medium rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow hover:shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                {isSavingInvoice ? "Saving..." : (selectedInvoiceId ? "Update" : "Create")}
              </button>
            </div>
          </div>
        </form>
      </Drawer>

      {/* --- FOLLOW UP DRAWER --- */}
      <Drawer isOpen={isFollowUpOpen} onClose={() => setIsFollowUpOpen(false)} title="Send Follow-up">
        {selectedFollowUpInvoice && (
          <form onSubmit={handleSendFollowUp} className="flex flex-col h-full">
            <div className="flex-1 space-y-5">
              
              <div className="bg-[#FFFFFF] border border-[#EFECE6] p-4 rounded-lg flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs text-[#6A6A65] font-semibold uppercase tracking-wider mb-0.5">To Client</p>
                  <p className="font-medium text-[#2C2C2A]">{selectedFollowUpInvoice.client?.name}</p>
                  <p className="text-sm text-[#6A6A65]">{selectedFollowUpInvoice.client?.email || "No email recorded"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6A6A65] font-semibold uppercase tracking-wider mb-0.5">Amount Due</p>
                  <p className="font-medium text-[#8A3C3C]">{formatCurrency(selectedFollowUpInvoice.amount)}</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <FormField 
                  label="Subject" 
                  defaultValue={`Following up: Invoice ${selectedFollowUpInvoice.invoiceNumber}`}
                  readOnly
                  className="bg-black/5 font-medium"
                />
                <FormField 
                  as="textarea"
                  label="Message Template" 
                  rows={8}
                  defaultValue={`Hi ${selectedFollowUpInvoice.client?.name},\n\nI hope you're having a great week.\n\nI'm just writing to follow up on invoice ${selectedFollowUpInvoice.invoiceNumber} for ${formatCurrency(selectedFollowUpInvoice.amount)}, which was due on ${new Date(selectedFollowUpInvoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.\n\nPlease let me know if you have any questions or if you need me to resend the invoice.\n\nBest regards,\n${firstName}`}
                />
              </div>

            </div>
            
            <div className="flex justify-end items-center pt-6 mt-6 border-t border-[#EFECE6] gap-3">
              <button type="button" onClick={() => setIsFollowUpOpen(false)} className="px-4 py-2 text-[#2C2C2A] font-medium border border-[#EFECE6] hover:bg-black/5 hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer">
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSendingFollowUp || !selectedFollowUpInvoice.client?.email} 
                className="flex items-center gap-2 px-5 py-2 bg-[#3A4A3F] hover:bg-[#2E3A32] text-white font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 shadow hover:shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:active:scale-100"
              >
                {isSendingFollowUp ? (
                  <>Sending...</>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                    </svg>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Drawer>

      <ConfirmDialog 
        isOpen={showInvoiceConfirm}
        title="Unsaved Changes"
        message="You have entered data for this invoice. Are you sure you want to close? Your invoice will not be saved."
        confirmText="Discard Changes"
        isDestructive
        onConfirm={() => {
          setShowInvoiceConfirm(false);
          setInvoiceForm(initialInvoiceForm);
          setIsInvoiceDrawerOpen(false);
        }}
        onCancel={() => setShowInvoiceConfirm(false)}
      />

      <ConfirmDialog 
        isOpen={showDeleteConfirm}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText={isDeletingInvoice ? "Deleting..." : "Delete Invoice"}
        isDestructive
        onConfirm={handleDeleteInvoice}
        onCancel={() => setShowDeleteConfirm(false)}
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
