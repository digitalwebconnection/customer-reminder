import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, Mail, Building, BellRing, Edit2, Archive, ExternalLink, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import CustomerModal from '../components/CustomerModal';
import ReminderModal from '../components/ReminderModal';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedCustomerForReminder, setSelectedCustomerForReminder] = useState(null);

  const fetchCustomers = async (searchTerm = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/customers${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`);
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleArchive = async (id, name) => {
    if (!window.confirm(`Archive ${name}? Customer can be restored anytime.`)) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers(search);
    } catch (err) {
      alert('Failed to archive customer');
    }
  };

  const openScheduleCall = (customer) => {
    setSelectedCustomerForReminder(customer);
    setReminderModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setCustomerModalOpen(true);
  };

  const openCreate = () => {
    setEditingCustomer(null);
    setCustomerModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Customer Directory</h2>
          <p className="text-sm text-slate-400">
            Australian clients & contacts. Click phone numbers to call via <code>tel:</code> link.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/25 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 shadow-inner">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, Australian phone (+61 4...), company, or email..."
          className="bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none w-full"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading customer directory...</div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            {search ? 'No matching customers found' : 'No customers yet'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            {search ? 'Try adjusting your search criteria.' : 'Create your first Australian customer to start scheduling follow-up call reminders.'}
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div
              key={c._id}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm transition-all hover:border-indigo-500/30 hover:shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/customers/${c._id}`}
                      className="text-base font-semibold text-white hover:text-indigo-400 transition flex items-center gap-1.5 group"
                    >
                      <span>{c.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                    </Link>
                    {c.company && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-500" />
                        <span>{c.company}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(c)}
                      title="Edit customer details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchive(c._id, c.name)}
                      title="Archive customer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-mono text-slate-200">{c.phone}</span>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 text-[11px] font-medium transition flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>

                  {c.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 px-1 truncate">
                      <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <a href={`mailto:${c.email}`} className="hover:text-indigo-300 transition truncate">
                        {c.email}
                      </a>
                    </div>
                  )}

                  {c.notes && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40 text-xs text-slate-400 line-clamp-2">
                      {c.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <Link
                  to={`/customers/${c._id}`}
                  className="text-xs font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  View Timeline &rarr;
                </Link>

                <button
                  type="button"
                  onClick={() => openScheduleCall(c)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition flex items-center gap-1.5"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Schedule Call</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CustomerModal
        isOpen={customerModalOpen}
        customerToEdit={editingCustomer}
        onClose={() => setCustomerModalOpen(false)}
        onSaved={() => fetchCustomers(search)}
      />

      <ReminderModal
        isOpen={reminderModalOpen}
        preselectedCustomer={selectedCustomerForReminder}
        onClose={() => setReminderModalOpen(false)}
        onSaved={() => fetchCustomers(search)}
      />
    </div>
  );
}
