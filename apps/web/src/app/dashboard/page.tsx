"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { QRCodeSVG } from "qrcode.react";
import { Settings as SettingsIcon } from "lucide-react";
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

  // --- Settings & 2FA State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorUri, setTwoFactorUri] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string>("");
  const [hasPassword, setHasPassword] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);

  useEffect(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 20;
    if (newPassword.match(/[A-Z]/)) score += 20;
    if (newPassword.match(/[a-z]/)) score += 20;
    if (newPassword.match(/[0-9]/)) score += 20;
    if (newPassword.match(/[^A-Za-z0-9]/)) score += 20;
    setPasswordScore(score);
  }, [newPassword]);

  useEffect(() => {
    // Check initial dark mode state
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    if (passwordScore < 80) {
      showToast("Please choose a stronger password.", "error");
      return;
    }
    setIsSettingPassword(true);
    try {
      const res = await authClient.$fetch("http://localhost:3001/api/set-password", {
        method: "POST",
        body: { password: newPassword },
      });
      if (res.data?.success) {
        setHasPassword(true);
        setTwoFactorPassword(newPassword);
        showToast("Password set successfully! You can now setup 2FA.");
      } else {
        showToast("Failed to set password", "error");
      }
    } catch (err) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPassword && !twoFactorPassword) {
      showToast("Please enter your password", "error");
      return;
    }
    
    setIsSettingUp2FA(true);
    try {
      const payload = { password: hasPassword ? twoFactorPassword : "" };
      const res = await authClient.twoFactor.enable(payload);
      if (res.data?.totpURI) {
        setTwoFactorUri(res.data.totpURI);
        if (res.data.backupCodes) {
           setBackupCodes(res.data.backupCodes.join(", "));
        }
      } else if (res.error) {
        showToast(res.error.message || "Failed to generate 2FA", "error");
      }
    } catch (e: any) {
      showToast("Error generating 2FA. Please try again.", "error");
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode) return;
    
    try {
      const res = await authClient.twoFactor.verifyTotp({ code: twoFactorCode });
      if (res.data) {
        showToast("Two-Factor Authentication enabled successfully!");
        setIs2FAEnabled(true);
        setTwoFactorUri("");
        setTwoFactorCode("");
      } else if (res.error) {
        showToast("Invalid authentication code", "error");
      }
    } catch (e: any) {
      showToast("Failed to verify code", "error");
    }
  };

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
        if (res.data.hasPassword !== undefined) {
          setHasPassword(res.data.hasPassword);
        }
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
      <div className="min-h-screen bg-pearl flex items-center justify-center">
        <p className="text-stone">Loading session...</p>
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
    <div className="min-h-screen bg-pearl p-8 md:p-12 font-sans text-onyx">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-4xl font-serif text-onyx tracking-tight">
              Good evening, {firstName}
            </h1>
            <p className="text-stone mt-2 font-medium">{today}</p>
          </div>
          
          <div className="flex gap-4 items-center flex-wrap">
            {clients.length > 0 && (
              <button 
                onClick={() => setIsManageClientsOpen(true)}
                className="px-5 py-2.5 bg-transparent text-onyx font-medium border border-oatmeal hover:bg-onyx/5 hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"
              >
                Manage Clients
              </button>
            )}
            <button 
              onClick={openNewClient}
              className="px-5 py-2.5 bg-transparent text-onyx font-medium border border-transparent hover:bg-onyx/5 hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer"
            >
              + Add Client
            </button>
            <button 
              onClick={openNewInvoice}
              className="px-5 py-2.5 bg-forest hover:bg-forest-dark text-pure-white font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
            >
              + New Invoice
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="p-2.5 bg-transparent text-stone hover:text-onyx hover:bg-onyx/5 font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 ml-2 cursor-pointer"
              title="Settings"
            >
              <SettingsIcon size={22} />
            </button>
          </div>
        </header>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Outstanding" value={metrics.totalOutstanding > 0 ? formatCurrency(metrics.totalOutstanding) : formattedCurrencyZero} valueColor="text-onyx" />
          <MetricCard title="Due This Week" value={metrics.dueThisWeek > 0 ? formatCurrency(metrics.dueThisWeek) : formattedCurrencyZero} valueColor="text-stone" />
          <MetricCard title="Overdue Invoices" value={metrics.overdueInvoices.toString()} valueColor="text-crimson" />
          <MetricCard title="Active Clients" value={metrics.activeClients.toString()} valueColor="text-stone" />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Needs Attention (2/3) */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone">Action Needed</h2>
            
            {/* Empty State for Action Needed */}
            {actionNeededInvoices.length === 0 ? (
              <div className="bg-white border border-oatmeal p-8 md:p-12 rounded-xl flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-pearl rounded-full flex items-center justify-center mb-4 text-forest">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-onyx mb-2">You're all caught up!</h3>
                <p className="text-stone mb-6">No invoices need your attention right now. Great job keeping on top of things!</p>
                <div className="flex gap-4">
                  <button onClick={openNewClient} className="px-4 py-2 bg-transparent border border-oatmeal text-onyx text-sm font-medium rounded-lg hover:bg-onyx/5 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer">
                    Add a Client
                  </button>
                  <button onClick={openNewInvoice} className="px-4 py-2 bg-forest text-pure-white text-sm font-medium rounded-lg hover:bg-forest-dark hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer shadow-sm">
                    Create Invoice
                  </button>
                </div>
              </div>
            ) : (
              actionNeededInvoices.map(inv => (
                <div key={inv.id} className="bg-danger-bg border border-danger-border p-6 md:p-8 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-onyx text-lg">{inv.client?.name}</span>
                      <span className="text-stone">{inv.invoiceNumber}</span>
                    </div>
                    <div className="text-3xl font-medium text-onyx mb-4">{formatCurrency(inv.amount)}</div>
                    <div className="inline-flex px-2.5 py-1 bg-danger-border/50 border border-crimson/10 text-crimson text-xs font-semibold rounded text-center tracking-wide uppercase">
                      Overdue
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => openUpdateInvoice(inv)}
                      className="px-6 py-3 bg-transparent border border-oatmeal hover:bg-white text-onyx font-medium rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 w-full sm:w-auto cursor-pointer shadow-sm hover:shadow"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => openFollowUp(inv)}
                      className="whitespace-nowrap px-6 py-3 bg-forest hover:bg-forest-dark text-pure-white font-medium rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 w-full sm:w-auto shadow-sm hover:shadow cursor-pointer"
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
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone">Coming Up</h2>
            
            <div className="flex flex-col gap-3">
              {upcomingInvoices.length === 0 ? (
                <div className="bg-white border border-oatmeal p-8 rounded-xl text-center flex flex-col items-center">
                  <div className="w-10 h-10 bg-pearl rounded-full flex items-center justify-center mb-3 text-stone">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-onyx mb-1">No upcoming invoices</p>
                  <p className="text-xs text-stone mb-4">Keep the momentum going!</p>
                  <button 
                    onClick={openNewInvoice}
                    className="text-xs font-semibold text-forest hover:text-forest-dark cursor-pointer transition-colors"
                  >
                    + Create New Invoice
                  </button>
                </div>
              ) : (
                upcomingInvoices.map(inv => (
                  <div key={inv.id} className="bg-white border border-oatmeal p-5 rounded-xl group hover:border-forest/20 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-semibold text-onyx truncate max-w-[150px]">{inv.client?.name}</span>
                      <span className="font-semibold text-onyx">{formatCurrency(inv.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-stone">Due {new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="px-2 py-0.5 bg-ash text-graphite text-[11px] font-bold tracking-wide uppercase rounded">Upcoming</span>
                      </div>
                      <button 
                        onClick={() => openUpdateInvoice(inv)}
                        className="text-sm font-medium text-stone hover:text-onyx cursor-pointer"
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
            <div key={client.id} className="flex justify-between items-center p-3 border border-oatmeal rounded-lg bg-white">
              <div>
                <p className="font-medium text-onyx">{client.name}</p>
                {client.email && <p className="text-xs text-stone mt-1">{client.email}</p>}
              </div>
              <button 
                onClick={() => openUpdateClient(client)}
                className="px-3 py-1.5 text-xs font-medium text-onyx bg-onyx/5 hover:bg-onyx/10 rounded cursor-pointer transition-colors"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t border-oatmeal">
          <button onClick={() => setIsManageClientsOpen(false)} className="px-4 py-2 text-onyx font-medium border border-oatmeal rounded-lg hover:bg-onyx/5 transition-colors cursor-pointer">
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
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-oatmeal">
            <div>
              {selectedClientId && (
                <button 
                  type="button" 
                  onClick={() => setShowDeleteClientConfirm(true)}
                  className="px-4 py-2 text-crimson font-medium hover:bg-crimson/10 rounded-lg transition-colors cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={closeAddClient} className="px-4 py-2 text-onyx font-medium border border-oatmeal rounded-lg hover:bg-onyx/5 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={isSavingClient} className="px-5 py-2 bg-forest hover:bg-forest-dark text-pure-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
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
              <label className="text-sm font-semibold text-onyx">Client <span className="text-crimson">*</span></label>
              <button 
                type="button" 
                className="text-xs font-medium text-forest hover:underline cursor-pointer transition-all"
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
          
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-oatmeal">
            <div>
              {selectedInvoiceId && (
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-crimson font-medium hover:bg-crimson/10 rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={closeInvoiceDrawer} className="px-4 py-2 text-onyx font-medium border border-oatmeal hover:bg-onyx/5 hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={isSavingInvoice} className="px-5 py-2 bg-forest hover:bg-forest-dark text-pure-white font-medium rounded-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shadow hover:shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
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
              
              <div className="bg-white border border-oatmeal p-4 rounded-lg flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs text-stone font-semibold uppercase tracking-wider mb-0.5">To Client</p>
                  <p className="font-medium text-onyx">{selectedFollowUpInvoice.client?.name}</p>
                  <p className="text-sm text-stone">{selectedFollowUpInvoice.client?.email || "No email recorded"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone font-semibold uppercase tracking-wider mb-0.5">Amount Due</p>
                  <p className="font-medium text-crimson">{formatCurrency(selectedFollowUpInvoice.amount)}</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <FormField 
                  label="Subject" 
                  defaultValue={`Following up: Invoice ${selectedFollowUpInvoice.invoiceNumber}`}
                  readOnly
                  className="bg-onyx/5 font-medium"
                />
                <FormField 
                  as="textarea"
                  label="Message Template" 
                  rows={8}
                  defaultValue={`Hi ${selectedFollowUpInvoice.client?.name},\n\nI hope you're having a great week.\n\nI'm just writing to follow up on invoice ${selectedFollowUpInvoice.invoiceNumber} for ${formatCurrency(selectedFollowUpInvoice.amount)}, which was due on ${new Date(selectedFollowUpInvoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.\n\nPlease let me know if you have any questions or if you need me to resend the invoice.\n\nBest regards,\n${firstName}`}
                />
              </div>

            </div>
            
            <div className="flex justify-end items-center pt-6 mt-6 border-t border-oatmeal gap-3">
              <button type="button" onClick={() => setIsFollowUpOpen(false)} className="px-4 py-2 text-onyx font-medium border border-oatmeal hover:bg-onyx/5 hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer">
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSendingFollowUp || !selectedFollowUpInvoice.client?.email} 
                className="flex items-center gap-2 px-5 py-2 bg-forest hover:bg-forest-dark text-pure-white font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 shadow hover:shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:active:scale-100"
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

      {/* --- SETTINGS DRAWER --- */}
      <Drawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
        <div className="flex flex-col h-full space-y-8">
          
          {/* Theme Settings */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone mb-4 border-b border-oatmeal pb-2">Appearance</h3>
            <div className="flex items-center justify-between p-4 bg-white border border-oatmeal rounded-xl shadow-sm">
              <div>
                <p className="font-medium text-onyx">Dark Mode</p>
                <p className="text-sm text-stone">Switch to a darker theme</p>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${isDarkMode ? 'bg-forest' : 'bg-stone/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className="flex-1">
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone mb-4 border-b border-oatmeal pb-2">Security</h3>
            
            <div className="bg-white border border-oatmeal rounded-xl shadow-sm p-5 space-y-4">
              <div>
                <p className="font-medium text-onyx">Two-Factor Authentication (2FA)</p>
                <p className="text-sm text-stone mb-4">Make your account as secure as it gets by requiring a code from your authenticator app.</p>
                
                {session?.user?.twoFactorEnabled || is2FAEnabled ? (
                  <div className="inline-flex px-3 py-1.5 bg-forest/10 border border-forest/20 text-forest text-xs font-bold rounded text-center tracking-wide uppercase">
                    2FA is Enabled
                  </div>
                ) : (
                  <>
                    {!hasPassword ? (
                      <form onSubmit={handleSetPassword} className="space-y-3 bg-pearl p-4 border border-oatmeal rounded-lg">
                        <p className="text-sm font-medium text-onyx mb-2">You signed up with Google. To enable 2FA, please set a password first.</p>
                        <FormField 
                          label="New Password"
                          type="password"
                          required
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Must be at least 8 characters"
                        />
                        {newPassword.length > 0 && (
                          <div className="mt-1">
                            <div className="h-1.5 w-full bg-oatmeal rounded-full overflow-hidden flex">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  passwordScore < 40 ? 'bg-crimson w-1/4' : 
                                  passwordScore < 80 ? 'bg-amber-400 w-2/4' : 
                                  passwordScore < 100 ? 'bg-sage w-3/4' : 
                                  'bg-forest w-full'
                                }`}
                              />
                            </div>
                            <p className={`text-xs mt-1 font-medium ${
                              passwordScore < 40 ? 'text-crimson' : 
                              passwordScore < 80 ? 'text-amber-500' : 
                              'text-forest'
                            }`}>
                              {passwordScore < 40 ? 'Weak' : 
                               passwordScore < 80 ? 'Fair' : 
                               passwordScore < 100 ? 'Good' : 'Strong'}
                            </p>
                          </div>
                        )}
                        <FormField 
                          label="Confirm Password"
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Type password again"
                        />
                        <button 
                          type="submit" 
                          disabled={isSettingPassword}
                          className="w-full px-4 py-2.5 bg-forest hover:bg-forest-dark text-pure-white font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 shadow cursor-pointer disabled:opacity-70"
                        >
                          {isSettingPassword ? "Saving..." : "Set Password"}
                        </button>
                      </form>
                    ) : !twoFactorUri ? (
                      <form onSubmit={handleEnable2FA} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <FormField 
                            label="Enter your password to setup"
                            type="password"
                            required
                            value={twoFactorPassword}
                            onChange={e => setTwoFactorPassword(e.target.value)}
                            placeholder="Password"
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={isSettingUp2FA}
                          className="mb-4 px-4 py-2.5 bg-forest hover:bg-forest-dark text-pure-white font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-70"
                        >
                          {isSettingUp2FA ? "..." : "Setup 2FA"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerify2FA} className="space-y-4 bg-pearl p-4 border border-oatmeal rounded-lg">
                        <p className="text-sm font-medium text-onyx text-center">Scan this QR Code in your Authenticator App (Google Authenticator, Authy)</p>
                        <div className="flex justify-center bg-white p-2 rounded-lg border border-oatmeal w-fit mx-auto">
                          <QRCodeSVG value={twoFactorUri} size={150} />
                        </div>
                        <FormField 
                          label="Enter 6-digit code from app"
                          type="text"
                          required
                          value={twoFactorCode}
                          onChange={e => setTwoFactorCode(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                        />
                        <button 
                          type="submit" 
                          className="w-full px-4 py-2.5 bg-forest hover:bg-forest-dark text-pure-white font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 shadow cursor-pointer"
                        >
                          Verify & Enable
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 mt-auto border-t border-oatmeal pb-4">
             <button 
              onClick={handleSignOut} 
              className="w-full px-5 py-3 bg-danger-bg hover:bg-danger-border/50 border border-danger-border text-crimson font-medium hover:-translate-y-0.5 active:scale-95 rounded-lg transition-all duration-200 cursor-pointer text-center"
            >
              Sign Out of Account
            </button>
          </div>
        </div>
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
    <div className="bg-white border border-oatmeal p-6 rounded-xl flex flex-col justify-between h-[120px]">
      <p className="text-sm font-medium text-stone">{title}</p>
      <p className={`text-3xl font-medium ${valueColor}`}>{value}</p>
    </div>
  );
}
