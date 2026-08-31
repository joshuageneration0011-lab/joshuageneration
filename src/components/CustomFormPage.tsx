import React, { useState, useEffect } from 'react';
import { api, resolveApiUrl } from '../utils/api';
import type { CustomForm, FormField } from '../types';
import { CheckCircle2, ArrowRight, AlertCircle, Send, Sparkles, Home } from 'lucide-react';

interface CustomFormPageProps {
  slug: string;
  onNavigateHome?: () => void;
}

export default function CustomFormPage({ slug, onNavigateHome }: CustomFormPageProps) {
  const [form, setForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success Pop-up state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    enableRedirect: boolean;
    redirectButtonLabel: string;
    redirectUrl: string;
    successMessage: string;
  } | null>(null);

  useEffect(() => {
    async function loadForm() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getForm(slug);
        setForm(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load form.');
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadForm();
    }
  }, [slug]);

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, isChecked: boolean) => {
    setAnswers(prev => {
      const current = Array.isArray(prev[fieldId]) ? [...prev[fieldId]] : [];
      if (isChecked) {
        if (!current.includes(option)) current.push(option);
      } else {
        const idx = current.indexOf(option);
        if (idx > -1) current.splice(idx, 1);
      }
      return {
        ...prev,
        [fieldId]: current
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validate required fields
    for (const field of form.fields) {
      if (field.required) {
        const val = answers[field.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          setSubmitError(`Please fill out the required field: "${field.label}"`);
          return;
        }
      }
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await api.submitForm(form.id, answers);
      setSubmissionResult(res);
      setShowSuccessModal(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompletionRedirect = () => {
    if (submissionResult?.redirectUrl) {
      window.open(submissionResult.redirectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#0b1329] border-t-transparent animate-spin mx-auto" />
          <p className="text-gray-600 text-sm font-medium">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Form Not Found</h2>
            <p className="text-sm text-gray-500 mt-2">{error || 'This form does not exist or is no longer active.'}</p>
          </div>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold transition-all cursor-pointer shadow-md"
            >
              <Home className="w-4 h-4" /> Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle warm ambient background accents */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-b from-amber-100/50 via-blue-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        {/* Banner image if available */}
        {form.banner_image_url && (
          <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-lg h-48 sm:h-64 relative bg-white">
            <img
              src={resolveApiUrl(form.banner_image_url)}
              alt={form.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Form Header Card */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-10 shadow-md space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Official Form
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">{form.title}</h1>
          {form.description && (
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{form.description}</p>
          )}
        </div>

        {/* Form Error Banner */}
        {submitError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3 animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{submitError}</span>
          </div>
        )}

        {/* Form Fields Body */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-10 shadow-md space-y-8">
          {form.fields.map((field: FormField, index: number) => {
            const fieldValue = answers[field.id] || '';

            return (
              <div key={field.id} className="space-y-3 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
                <label className="block text-sm font-bold text-gray-900">
                  {index + 1}. {field.label}
                  {field.required && <span className="text-amber-600 ml-1.5 font-bold">*</span>}
                </label>

                {field.helpText && (
                  <p className="text-xs text-gray-500">{field.helpText}</p>
                )}

                {/* Short Text Input */}
                {field.type === 'text' && (
                  <input
                    type="text"
                    required={field.required}
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder || 'Your answer'}
                    className="w-full px-4.5 py-3.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:bg-white focus:border-[#0b1329] focus:ring-1 focus:ring-[#0b1329] transition-all"
                  />
                )}

                {/* Paragraph / Long Text */}
                {field.type === 'paragraph' && (
                  <textarea
                    rows={4}
                    required={field.required}
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder || 'Your answer'}
                    className="w-full px-4.5 py-3.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:bg-white focus:border-[#0b1329] focus:ring-1 focus:ring-[#0b1329] transition-all resize-y"
                  />
                )}

                {/* Email */}
                {field.type === 'email' && (
                  <input
                    type="email"
                    required={field.required}
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder || 'name@example.com'}
                    className="w-full px-4.5 py-3.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:bg-white focus:border-[#0b1329] focus:ring-1 focus:ring-[#0b1329] transition-all"
                  />
                )}

                {/* Phone */}
                {field.type === 'phone' && (
                  <input
                    type="tel"
                    required={field.required}
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder || '+1 234 567 8900'}
                    className="w-full px-4.5 py-3.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:bg-white focus:border-[#0b1329] focus:ring-1 focus:ring-[#0b1329] transition-all"
                  />
                )}

                {/* Number */}
                {field.type === 'number' && (
                  <input
                    type="number"
                    required={field.required}
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder || '0'}
                    className="w-full px-4.5 py-3.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:bg-white focus:border-[#0b1329] focus:ring-1 focus:ring-[#0b1329] transition-all"
                  />
                )}

                {/* Date */}
                {field.type === 'date' && (
                  <input
                    type="date"
                    required={field.required}
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4.5 py-3.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:bg-white focus:border-[#0b1329] focus:ring-1 focus:ring-[#0b1329] transition-all"
                  />
                )}

                {/* Select / Dropdown */}
                {field.type === 'select' && (
                  <select
                    required={field.required}
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4.5 py-3.5 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:bg-white focus:border-[#0b1329] focus:ring-1 focus:ring-[#0b1329] transition-all"
                  >
                    <option value="">-- Choose an option --</option>
                    {(field.options || []).map((opt, i) => (
                      <option key={i} value={opt} className="bg-white text-gray-900">{opt}</option>
                    ))}
                  </select>
                )}

                {/* Radio Options */}
                {field.type === 'radio' && (
                  <div className="space-y-2.5 pt-1">
                    {(field.options || []).map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100/80 cursor-pointer transition-all">
                        <input
                          type="radio"
                          name={`field_${field.id}`}
                          required={field.required && !fieldValue}
                          checked={fieldValue === opt}
                          onChange={() => handleInputChange(field.id, opt)}
                          className="w-4 h-4 text-[#0b1329] focus:ring-[#0b1329] border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-800">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkboxes */}
                {field.type === 'checkbox' && (
                  <div className="space-y-2.5 pt-1">
                    {(field.options || []).map((opt, i) => {
                      const checked = Array.isArray(fieldValue) && fieldValue.includes(opt);
                      return (
                        <label key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100/80 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                            className="w-4 h-4 rounded text-[#0b1329] focus:ring-[#0b1329] border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-800">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl font-extrabold text-base text-white bg-[#0b1329] hover:bg-[#152347] transition-all duration-300 hover:scale-[1.005] active:scale-95 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Submit Form
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Completion Pop-up Modal */}
      {showSuccessModal && submissionResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full shadow-2xl p-8 text-center space-y-6 relative overflow-hidden">
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold text-gray-900">Registration Successful! 🎉</h2>
              <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
                {submissionResult.successMessage}
              </p>
            </div>

            {/* Optional Redirect Button */}
            {submissionResult.enableRedirect && submissionResult.redirectUrl ? (
              <div className="pt-2 space-y-4">
                <button
                  onClick={handleCompletionRedirect}
                  className="w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <span>{submissionResult.redirectButtonLabel || 'CLICK HERE TO COMPLETE REGISTRATION'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-[11px] text-gray-400">Click the button above to complete your final step.</p>
              </div>
            ) : (
              <div className="pt-4">
                {onNavigateHome && (
                  <button
                    onClick={onNavigateHome}
                    className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Return to Homepage
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
