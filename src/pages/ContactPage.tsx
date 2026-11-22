import React, { useState } from 'react';
import { CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { validateEmail } from '../lib/pricing';

export function ContactPage() {
  const { settings, notify } = useHostNova();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      nextErrors.name = 'Please enter your full name.';
    }
    if (!validateEmail(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!subject.trim() || subject.trim().length < 3) {
      nextErrors.subject = 'Please enter a brief subject.';
    }
    if (!message.trim() || message.trim().length < 10) {
      nextErrors.message = 'Please enter a message of at least 10 characters.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitted(true);
    notify('success', 'Your message has been received. Our team will get back to you shortly.');
  };

  return (
    <div className="bg-[#060B18] py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold tracking-wider text-blue-400 mb-2">
            Contact Us
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Connect with the HostNova team
          </h1>
          <p className="text-slate-400 text-base">
            Have questions about hosting plans, billing durations, or enterprise accounts? Reach out to our global support team below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7 space-y-6">
              <h2 className="text-lg font-bold text-white">Global Support &amp; Office</h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Support Email</div>
                    <div className="text-white font-medium">{settings.companyEmail}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Phone</div>
                    <div className="text-white font-medium">{settings.companyPhone}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">Office Location</div>
                    <div className="text-white font-medium">{settings.companyAddress}</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-4 border-t border-slate-800 leading-relaxed">
                Support specialists are available Monday through Friday for billing, migration, and technical inquiries.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-[#0B1224] border border-slate-800 rounded-2xl p-7 sm:p-8">
              {submitted ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Message Received</h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Thank you, {name}. Your inquiry has been received by the HostNova support team.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setSubject('');
                      setMessage('');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Subject *
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Question about Enterprise hosting"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {errors.subject && <p className="mt-1 text-xs text-rose-400">{errors.subject}</p>}
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your project requirements..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060B18] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    {errors.message && <p className="mt-1 text-xs text-rose-400">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
