import { Users, MessageSquare, Phone, CheckCircle2 } from 'lucide-react';
import type { Lead } from '../lib/api';

interface SummaryCardsProps {
  leads: Lead[];
  isLoading?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ leads, isLoading = false }) => {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const contactedLeads = leads.filter((l) => l.status === 'contacted').length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;

  const cards = [
    {
      id: 'total',
      label: 'Total Leads',
      value: totalLeads,
      icon: Users,
      badge: 'All sources',
      iconBg: 'bg-neutral-100 text-neutral-800',
    },
    {
      id: 'new',
      label: 'New Leads',
      value: newLeads,
      icon: MessageSquare,
      badge: 'Needs response',
      iconBg: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'contacted',
      label: 'Contacted',
      value: contactedLeads,
      icon: Phone,
      badge: 'In conversation',
      iconBg: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'converted',
      label: 'Converted',
      value: convertedLeads,
      icon: CheckCircle2,
      badge: 'Deals won',
      iconBg: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            className="bg-neutral-50/70 border border-neutral-200/70 rounded-2xl p-4 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-300"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-500">{card.label}</span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${card.iconBg}`}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900">
                {isLoading ? (
                  <span className="inline-block w-8 h-7 bg-neutral-200 animate-pulse rounded" />
                ) : (
                  card.value
                )}
              </span>
              <span className="text-[11px] text-neutral-400 font-normal">{card.badge}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
