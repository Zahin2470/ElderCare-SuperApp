import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, Send, PhoneCall, RotateCcw, Info } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/AuthContext';
import { ApiError, errorMessage, get, post } from '../../lib/api';

interface Msg { id: number; role: 'user' | 'assistant'; content: string; source?: 'claude' | 'fallback' | 'safety'; safety?: string | null }
interface ChatReply { conversationId: string; reply: string; source: 'claude' | 'fallback' | 'safety'; safety: 'medical_emergency' | 'self_harm' | null }

const T = {
  en: { title: 'Care Assistant', sub: 'Ask about your medicines, readings, meals or activities', hello: "Hello! I'm your care assistant. I can help with your medicine schedule, your latest readings, meals and activities. How can I help today?",
    placeholder: 'Type your question…', send: 'Send', newChat: 'New chat', emergency: 'Call emergency now', disclaimer: "I'm not a doctor and can't diagnose or change medicines. In an emergency, call",
    prompts: ['When is my next medicine?', 'How is my blood pressure?', 'What should I eat for dinner?', 'Any activities this week?'], basic: 'Basic mode: I can answer about your medicines, readings and appointments.' },
  bn: { title: 'কেয়ার অ্যাসিস্ট্যান্ট', sub: 'ওষুধ, রিডিং, খাবার বা কার্যক্রম নিয়ে জিজ্ঞেস করুন', hello: 'নমস্কার! আমি আপনার কেয়ার অ্যাসিস্ট্যান্ট। ওষুধের সময়সূচি, সর্বশেষ রিডিং, খাবার ও কার্যক্রম নিয়ে সাহায্য করতে পারি। আজ কীভাবে সাহায্য করব?',
    placeholder: 'আপনার প্রশ্ন লিখুন…', send: 'পাঠান', newChat: 'নতুন চ্যাট', emergency: 'এখনই জরুরি নম্বরে কল করুন', disclaimer: 'আমি ডাক্তার নই — রোগ নির্ণয় বা ওষুধ পরিবর্তন করতে পারি না। জরুরি অবস্থায় কল করুন',
    prompts: ['আমার পরের ওষুধ কখন?', 'আমার রক্তচাপ কেমন?', 'রাতে কী খাওয়া উচিত?', 'এই সপ্তাহে কী কার্যক্রম আছে?'], basic: 'সীমিত মোড: ওষুধ, রিডিং ও অ্যাপয়েন্টমেন্ট সম্পর্কে উত্তর দিতে পারি।' },
} as const;

let nextId = 1;

export default function CareAssistant() {
  const { user, setLocale } = useAuth();
  const locale = user?.locale ?? 'en';
  const t = T[locale];
  const status = useQuery({ queryKey: ['ai', 'status'], queryFn: () => get<{ mode: 'ai' | 'basic'; emergencyNumber: string }>('/ai/status'), staleTime: Infinity });
  const emergency = status.data?.emergencyNumber ?? '999';

  const [messages, setMessages] = useState<Msg[]>([{ id: 0, role: 'assistant', content: t.hello }]);
  const [conversationId, setConversationId] = useState<string>();
  const [input, setInput] = useState('');
  const [helloLocale, setHelloLocale] = useState(locale);
  const bottom = useRef<HTMLDivElement>(null);

  // Switching language re-greets only while the chat is still untouched.
  useEffect(() => {
    if (helloLocale !== locale && messages.length === 1) { setMessages([{ id: 0, role: 'assistant', content: T[locale].hello }]); setHelloLocale(locale); }
  }, [locale, helloLocale, messages.length]);
  useEffect(() => { bottom.current?.scrollIntoView?.({ behavior: 'smooth' }); }, [messages]);

  const chat = useMutation({
    mutationFn: (message: string) => post<ChatReply>('/ai/chat', { message, conversationId, locale }),
    onSuccess: (r) => { setConversationId(r.conversationId); setMessages((m) => [...m, { id: nextId++, role: 'assistant', content: r.reply, source: r.source, safety: r.safety }]); },
    onError: (e) => setMessages((m) => [...m, { id: nextId++, role: 'assistant', content: e instanceof ApiError && e.status === 429 ? e.message : errorMessage(e, 'Sorry, I could not answer just now. Please try again.') }]),
  });

  const send = (text: string) => {
    const message = text.trim();
    if (!message || chat.isPending) return;
    setMessages((m) => [...m, { id: nextId++, role: 'user', content: message }]);
    setInput('');
    chat.mutate(message);
  };

  const reset = () => { setMessages([{ id: 0, role: 'assistant', content: t.hello }]); setConversationId(undefined); };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-gray-900 flex items-center gap-2"><Bot className="w-7 h-7 text-purple-600" aria-hidden />{t.title}</h1>
          <p className="text-gray-600">{t.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Language" className="inline-flex rounded-lg border overflow-hidden">
            {(['en', 'bn'] as const).map((l) => (
              <button key={l} onClick={() => void setLocale(l)} aria-pressed={locale === l} className={`px-3 py-1.5 text-sm ${locale === l ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-purple-50'}`}>{l === 'en' ? 'English' : 'বাংলা'}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="w-4 h-4 mr-1" aria-hidden />{t.newChat}</Button>
        </div>
      </div>

      {status.data?.mode === 'basic' && <p className="text-sm text-gray-600 flex items-center gap-2"><Info className="w-4 h-4" aria-hidden />{t.basic}</p>}

      <Card className="p-0 overflow-hidden">
        <div className="h-[50vh] overflow-y-auto p-4 space-y-3 bg-gray-50" role="log" aria-live="polite" aria-label="Conversation">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${m.role === 'user' ? 'bg-purple-600 text-white' : m.safety ? 'bg-red-50 border-2 border-red-300 text-red-900' : 'bg-white border text-gray-800'}`}>
                {/* Rendered as plain text — model output is never injected as HTML. */}
                {m.content}
                {m.safety && (
                  <a href={`tel:${emergency}`} className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white px-4 py-3 no-underline hover:bg-red-700">
                    <PhoneCall className="w-5 h-5" aria-hidden />{t.emergency} ({emergency})
                  </a>
                )}
                {m.role === 'assistant' && m.source === 'claude' && <Badge variant="outline" className="mt-2 block w-fit text-[10px]">AI</Badge>}
              </div>
            </div>
          ))}
          {chat.isPending && <div className="flex justify-start"><div className="bg-white border rounded-2xl px-4 py-3 text-gray-500" role="status">…</div></div>}
          <div ref={bottom} />
        </div>

        <div className="p-3 border-t bg-white space-y-2">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">{t.prompts.map((p) => <button key={p} onClick={() => send(p)} className="text-sm px-3 py-1.5 rounded-full border border-purple-200 text-purple-700 hover:bg-purple-50">{p}</button>)}</div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
            <textarea
              value={input} onChange={(e) => setInput(e.target.value.slice(0, 1000))} rows={1} placeholder={t.placeholder} aria-label={t.placeholder}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              className="flex-1 resize-none rounded-lg border px-3 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <Button type="submit" disabled={!input.trim() || chat.isPending} className="h-auto px-5" aria-label={t.send}><Send className="w-5 h-5" /></Button>
          </form>
        </div>
      </Card>
      <p className="text-xs text-gray-500">{t.disclaimer} {emergency}.</p>
    </div>
  );
}
