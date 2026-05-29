import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Modal } from '../../components/ui/Modal';
import { SERVICE_CATEGORIES, formatCurrency, formatDate } from '../../data/mockData';
import { useAppStore } from '../../store/useAppStore';
import type { Service } from '../../types';
import { CheckCircle, XCircle, Eye, Briefcase, Star, MapPin, Clock } from 'lucide-react';

type TabFilter = 'all' | 'pending_review' | 'active' | 'inactive';

const statusBadgeService = (status: Service['status']) => {
  if (status === 'active') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Active</span>;
  }
  if (status === 'pending_review') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">Pending Review</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Inactive</span>;
};

const getCategoryName = (categorySlug: string) => {
  const cat = SERVICE_CATEGORIES.find(c => c.slug === categorySlug || c.id === categorySlug || c.name === categorySlug);
  return cat ? `${cat.icon} ${cat.name}` : categorySlug;
};

export const AdminServices: React.FC = () => {
  const { services, updateService } = useAppStore();

  const [tab, setTab] = useState<TabFilter>('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const counts = {
    all: services.length,
    pending_review: services.filter(s => s.status === 'pending_review').length,
    active: services.filter(s => s.status === 'active').length,
    inactive: services.filter(s => s.status === 'inactive').length,
  };

  const filtered = tab === 'all' ? services : services.filter(s => s.status === tab);

  const approveService = (id: string) => {
    updateService(id, { status: 'active' });
    setSelectedService(prev => prev && prev.id === id ? { ...prev, status: 'active' } : prev);
  };

  const deactivateService = (id: string) => {
    updateService(id, { status: 'inactive' });
    setSelectedService(prev => prev && prev.id === id ? { ...prev, status: 'inactive' } : prev);
  };

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending_review', label: 'Pending Review' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
  ];

  return (
    <AppLayout title="Services">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">Service Listings</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold">
                {services.length}
              </span>
              {counts.pending_review > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold animate-pulse">
                  {counts.pending_review} pending
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">Manage service provider listings on AskIndia</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                tab === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Services grid */}
        {filtered.length === 0 ? (
          <div className="card py-20 text-center text-slate-400">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-25" />
            <p className="font-semibold text-slate-500 text-lg">
              {services.length === 0
                ? 'No service listings yet'
                : `No ${tab === 'all' ? '' : tab.replace('_', ' ')} services`}
            </p>
            <p className="text-sm mt-2 max-w-sm mx-auto">
              {services.length === 0
                ? 'Service providers will appear here once they register and list their services on AskIndia.'
                : 'Try switching to a different tab to see other services.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(service => (
              <div key={service.id} className="card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                {/* Service icon header */}
                <div className={`h-28 bg-gradient-to-br ${service.imageColor} flex items-center justify-center text-5xl`}>
                  {service.imageIcon}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  {/* Status badge */}
                  <div className="flex items-start justify-between mb-2">
                    {statusBadgeService(service.status)}
                    {service.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">
                        <Star className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>

                  {/* Title & provider */}
                  <h3 className="font-semibold text-slate-900 text-sm mt-1 line-clamp-2">{service.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{service.providerName}</p>

                  {/* Category */}
                  <p className="text-xs text-slate-400 mt-1">{getCategoryName(service.category)}</p>

                  {/* Price */}
                  <p className="font-bold text-brand-700 mt-2">
                    {formatCurrency(service.price)}
                    <span className="font-normal text-slate-500 text-xs ml-1">
                      / {service.priceType === 'hourly' ? 'hr' : service.priceType === 'fixed' ? 'fixed' : 'starting'}
                    </span>
                  </p>

                  {/* Cities */}
                  {service.availableCities && service.availableCities.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-slate-500 truncate">
                        {service.availableCities.slice(0, 2).join(', ')}
                        {service.availableCities.length > 2 && ` +${service.availableCities.length - 2}`}
                      </p>
                    </div>
                  )}

                  {/* Delivery time */}
                  {service.deliveryTime && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <p className="text-xs text-slate-500">{service.deliveryTime}</p>
                    </div>
                  )}

                  {/* Rating */}
                  {service.reviewCount > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-slate-600 font-medium">{service.rating.toFixed(1)}</span>
                      <span className="text-xs text-slate-400">({service.reviewCount})</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-3 flex gap-2">
                    <button
                      onClick={() => setSelectedService(service)}
                      className="flex-1 btn-secondary text-xs py-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </button>
                    {service.status === 'pending_review' && (
                      <button
                        onClick={() => approveService(service.id)}
                        className="flex-1 btn-success text-xs py-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </button>
                    )}
                    {service.status === 'active' && (
                      <button
                        onClick={() => deactivateService(service.id)}
                        className="flex-1 btn-danger text-xs py-1.5"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Deactivate
                      </button>
                    )}
                    {service.status === 'inactive' && (
                      <button
                        onClick={() => approveService(service.id)}
                        className="flex-1 btn-success text-xs py-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Detail Modal */}
      <Modal isOpen={!!selectedService} onClose={() => setSelectedService(null)} title="Service Details" size="lg">
        {selectedService && (
          <div className="space-y-5">
            {/* Header */}
            <div className={`flex items-center gap-5 p-5 rounded-xl bg-gradient-to-br ${selectedService.imageColor}`}>
              <div className="text-5xl">{selectedService.imageIcon}</div>
              <div>
                <p className="text-xl font-bold text-white drop-shadow">{selectedService.title}</p>
                <p className="text-white/80 text-sm mt-0.5">{selectedService.providerName}</p>
                <div className="mt-2">{statusBadgeService(selectedService.status)}</div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Category', value: getCategoryName(selectedService.category) },
                { label: 'Provider', value: selectedService.providerName },
                { label: 'Price', value: `${formatCurrency(selectedService.price)} / ${selectedService.priceType}` },
                { label: 'Delivery Time', value: selectedService.deliveryTime || '—' },
                { label: 'Rating', value: selectedService.reviewCount > 0 ? `${selectedService.rating.toFixed(1)} (${selectedService.reviewCount} reviews)` : 'No reviews yet' },
                { label: 'Featured', value: selectedService.featured ? 'Yes' : 'No' },
                { label: 'Listed On', value: formatDate(selectedService.createdAt) },
                { label: 'Status', value: selectedService.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                  <p className="font-semibold text-slate-900 text-sm">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1 font-semibold uppercase">Description</p>
              <p className="text-sm text-slate-700">{selectedService.description}</p>
            </div>

            {/* Available Cities */}
            {selectedService.availableCities && selectedService.availableCities.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-2 font-semibold uppercase">Available Cities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedService.availableCities.map(city => (
                    <span key={city} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedService.tags && selectedService.tags.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-semibold uppercase">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selectedService.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSelectedService(null)} className="btn-secondary">Close</button>
              {selectedService.status === 'pending_review' && (
                <>
                  <button onClick={() => deactivateService(selectedService.id)} className="btn-danger">
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                  <button onClick={() => approveService(selectedService.id)} className="btn-success">
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                </>
              )}
              {selectedService.status === 'active' && (
                <button onClick={() => deactivateService(selectedService.id)} className="btn-danger">
                  <XCircle className="h-4 w-4" /> Deactivate
                </button>
              )}
              {selectedService.status === 'inactive' && (
                <button onClick={() => approveService(selectedService.id)} className="btn-success">
                  <CheckCircle className="h-4 w-4" /> Activate
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};
