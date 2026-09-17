import { useState } from 'react';
import { Send, Phone, User, MessageSquare, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { sendDemoInbound } from '../lib/api';
import type { DemoInboundPayload, DemoInboundResponse } from '../lib/api';

interface DemoInboundFormProps {
  onSuccess: () => void;
}

export const DemoInboundForm: React.FC<DemoInboundFormProps> = ({ onSuccess }) => {
  const [phone, setPhone] = useState('+919876543210');
  const [name, setName] = useState('Rahul Sharma');
  const [message, setMessage] = useState('Hello MindClub team, I would like details about your upcoming batch.');
  const [interestType, setInterestType] = useState('Wellness Coaching');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<DemoInboundResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    if (!phone.trim() || !name.trim() || !message.trim()) {
      setErrorMessage('Phone, Name, and Message are required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DemoInboundPayload = {
        phone: phone.trim(),
        name: name.trim(),
        message: message.trim(),
        interestType: interestType.trim() || undefined,
      };

      const res = await sendDemoInbound(payload);
      setSuccessInfo(res);
      
      // Clear form inputs
      setMessage('');
      setInterestType('');

      // Trigger automatic refresh of leads list
      onSuccess();

      // Auto-dismiss success notification after 6 seconds
      setTimeout(() => {
        setSuccessInfo(null);
      }, 6000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to send demo message. Please check connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSample = (sampleType: 'mindclub' | 'inquiry' | 'urgent') => {
    if (sampleType === 'mindclub') {
      setName('Aarav Mehta');
      setPhone('+919812345678');
      setMessage('Hi MindClub, I would like to book a 1-on-1 counseling session this Saturday.');
      setInterestType('1-on-1 Counseling');
    } else if (sampleType === 'inquiry') {
      setName('Priya Patel');
      setPhone('+919798765432');
      setMessage('Can you share the pricing structure for the mindfulness masterclass?');
      setInterestType('Mindfulness Masterclass');
    } else {
      setName('Vikram Sen');
      setPhone('+919871122334');
      setMessage('Urgent: please connect me with a representative regarding our group booking.');
      setInterestType('Corporate Workshop');
    }
  };

  return (
    <div className="bg-neutral-50/50 border border-neutral-200/70 rounded-3xl p-6 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
            Inbound Simulator
          </span>
          <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">
            Simulate Inbound WhatsApp Message
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Fill sample:</span>
          <button
            type="button"
            onClick={() => handleQuickSample('mindclub')}
            className="px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-black hover:border-neutral-400 transition-colors text-[11px]"
          >
            Counseling
          </button>
          <button
            type="button"
            onClick={() => handleQuickSample('inquiry')}
            className="px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:text-black hover:border-neutral-400 transition-colors text-[11px]"
          >
            Masterclass
          </button>
        </div>
      </div>

      {successInfo && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-sm flex items-start gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-emerald-950">Inbound WhatsApp enquiry processed successfully!</p>
            <p className="text-xs text-emerald-700 mt-1">
              Contact: <span className="font-semibold">{successInfo.data?.contact.name || 'Saved'}</span> ({successInfo.data?.contact.phone}) • Lead status: <span className="font-semibold">{successInfo.data?.lead.status || 'new'}</span> • Message stored
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Error submitting message</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              WhatsApp Phone <span className="text-neutral-400 font-normal">(with country code)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              Contact Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Mehta"
                className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              Inbound Message Text
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none text-neutral-400">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <textarea
                required
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What program details are you looking for?"
                className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 transition-all resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
              Interest / Program
            </label>
            <input
              type="text"
              value={interestType}
              onChange={(e) => setInterestType(e.target.value)}
              placeholder="e.g. Coaching"
              className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 transition-all"
            />
            <p className="text-[10px] text-neutral-400 mt-1">Optional lead title tag</p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-3 text-black text-base font-medium group bg-neutral-100 hover:bg-neutral-200/90 active:scale-[0.99] px-5 py-2.5 rounded-full transition-all border border-black/5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:scale-105">
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 translate-x-[1px]" />
              )}
            </span>
            <span>{isSubmitting ? 'Simulating Inbound...' : 'Send WhatsApp Demo Enquiry'}</span>
          </button>

          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Directly calls /api/demo/inbound-message
          </span>
        </div>
      </form>
    </div>
  );
};
