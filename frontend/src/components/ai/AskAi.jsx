import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUp,
  Loader2,
  MapPinned,
  MessageSquareText,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

import { formatCurrency } from '../../lib/format.js';
import { aiHealth, aiSuggest } from '../../api/aiSuggest.api.js';
import { useAuthStore } from '../../store/authStore.js';
import { ActivityIcon } from '../ui/ActivityIcon.jsx';

/**
 * Triplie — the floating assistant, bottom-right on every route.
 *
 * It talks to the LangGraph service in AI/ (FastAPI, :8000), which is a real
 * agent rather than a single completion: the graph detects the language, routes
 * the message to a conversational branch or a planning one, loads the
 * referenced trip out of Mongo, reasons over the stops and the budget already
 * on it, and retries itself when its own output fails validation. It can take
 * several seconds, and the widget says "Thinking" rather than pretending to
 * stream, because the graph returns once, at the end.
 *
 * Four things are deliberate:
 *
 *   · **Two shapes of answer.** `intent: 'chat'` comes back as prose and
 *     nothing else — a greeting, "who are you", "how do I share a trip". Only
 *     `intent: 'plan'` renders the typed cards with costs. Before the graph
 *     routed on intent, every message went down the catalog branch, so "who are
 *     you?" was answered with four cities and a price list.
 *
 *   · **Route awareness.** The trip id is read off the URL and sent with the
 *     prompt, so asking "what else should I do here?" inside a trip is answered
 *     against that trip's actual cities and budget. Ask it from the landing
 *     page and you get general advice, correctly.
 *
 *   · **The service being down is a state, not an error.** A fresh checkout has
 *     no Python process running. The panel checks `/health` when it opens and
 *     shows how to start it, rather than letting the user type a question into
 *     a box that will fail.
 *
 *   · **It never blocks the page.** The launcher is a fixed button, the panel
 *     is `position: fixed`, and a request in flight is abortable — closing the
 *     panel cancels it.
 */

const AGENT = 'Triplie';

const SEEDS = [
  'Plan me 3 days in Kyoto under ₹40,000',
  'What should I add to my trip that I have missed?',
  'Where can I cut costs without losing the good parts?',
  'What can you do?',
];

/** `/trips/68f…` and `/trips/68f…/build` both yield the id; `/trips/new` does not. */
const tripIdFrom = (pathname) => {
  const match = pathname.match(/^\/trips\/([a-f0-9]{24})(?:\/|$)/i);
  return match ? match[1] : null;
};

export const AskAi = () => {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(null); // null = not checked yet
  const [prompt, setPrompt] = useState('');
  const [pending, setPending] = useState(false);
  const [turns, setTurns] = useState([]);

  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const tripId = tripIdFrom(pathname);

  // Probe the service when the panel opens, not at app boot — a widget nobody
  // opens should not cost a request on every page load.
  useEffect(() => {
    if (!open) return;
    let live = true;
    aiHealth().then((ok) => live && setOnline(ok));
    return () => {
      live = false;
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Pin to the newest turn as it arrives.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, pending]);

  // Closing mid-request cancels it rather than leaving a fetch to land on an
  // unmounted panel.
  const close = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPending(false);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const send = async (text) => {
    const question = (text ?? prompt).trim();
    if (!question || pending) return;

    setPrompt('');
    setTurns((current) => [...current, { role: 'user', text: question }]);
    setPending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const answer = await aiSuggest({
        prompt: question,
        userId: user?._id,
        tripId,
        signal: controller.signal,
      });
      setTurns((current) => [...current, { role: 'ai', ...answer }]);
      setOnline(true);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setTurns((current) => [
        ...current,
        { role: 'error', text: error.message || 'The AI service did not answer.' },
      ]);
    } finally {
      abortRef.current = null;
      setPending(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ask ${AGENT}`}
        className="group fixed right-5 bottom-5 z-[60] inline-flex h-11 items-center gap-2 rounded-full bg-brand-500 pr-4 pl-3.5 text-[13px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(20,30,22,0.7)] transition-all hover:bg-brand-600 active:scale-[0.97]"
      >
        <Sparkles className="size-4 transition-transform group-hover:rotate-12" aria-hidden />
        Ask {AGENT}
      </button>
    );
  }

  return (
    <aside
      role="dialog"
      aria-label={`Ask ${AGENT}`}
      // Sized against svh/vw so it can never exceed the viewport: full-bleed
      // with a 1rem margin on a phone, a 26rem column on a desktop.
      className="fixed inset-x-3 bottom-3 z-[60] flex h-[min(40rem,calc(100svh-1.5rem))] flex-col overflow-hidden rounded-xl border border-line-strong bg-surface shadow-[0_24px_64px_-28px_rgba(8,12,9,0.7)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[26rem]"
    >
      {/* ---- Header ------------------------------------------------------ */}
      <header className="shrink-0 bg-brand-500 px-4 py-3 text-canvas">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/15">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight font-semibold">{AGENT}</p>
            <p className="mt-0.5 truncate text-[11px] text-white/60">
              TRIPORA&rsquo;s travel assistant · LangGraph
            </p>
          </div>

          {turns.length > 0 && (
            <button
              type="button"
              onClick={() => setTurns([])}
              aria-label="Clear the conversation"
              className="grid size-7 place-items-center rounded-md text-white/60 transition-colors hover:bg-white/15 hover:text-white"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={close}
            aria-label={`Close ${AGENT}`}
            className="grid size-7 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {/* What the agent can actually see. Without this the answers look
            arbitrary — the same question gives different results on /trips/:id
            than on the landing page, and nothing on screen explains why. */}
        <p className="mt-2.5 flex w-fit items-center gap-1.5 rounded border border-white/20 bg-white/10 px-2 py-1 text-[10.5px] font-medium text-white/85">
          <MapPinned className="size-3" aria-hidden />
          {tripId ? 'Reading the trip you have open' : 'General advice — open a trip for specifics'}
        </p>
      </header>

      {/* ---- Transcript --------------------------------------------------- */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-canvas p-3.5">
        {online === false && <OfflineNotice />}

        {turns.length === 0 && online !== false && (
          <div>
            <p className="text-[13px] leading-relaxed text-ink-700">
              I&rsquo;m {AGENT}. Ask about a city, a budget, or the trip you have open — planning
              questions come back as suggestions with real costs attached, everything else as a
              straight answer.
            </p>
            <p className="eyebrow mt-4 text-ink-300">Try one</p>
            <ul className="mt-2 grid gap-1.5">
              {SEEDS.map((seed) => (
                <li key={seed}>
                  <button
                    type="button"
                    onClick={() => send(seed)}
                    disabled={online === null}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-[12.5px] leading-snug text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-ink-900 disabled:opacity-50"
                  >
                    {seed}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {turns.map((turn, index) => (
          <Turn key={index} turn={turn} />
        ))}

        {pending && (
          <p className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[12px] text-ink-500">
            <Loader2 className="size-3.5 animate-spin text-brand-500" aria-hidden />
            {AGENT} is thinking…
          </p>
        )}
      </div>

      {/* ---- Composer ----------------------------------------------------- */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="flex shrink-0 items-end gap-2 border-t border-line bg-surface p-2.5"
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter breaks the line — the convention every
            // chat UI has trained people into.
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
          placeholder={online === false ? `${AGENT} is offline` : `Ask ${AGENT} anything…`}
          disabled={online === false}
          className="max-h-24 min-h-9 flex-1 resize-none rounded-lg border border-line-strong bg-surface px-3 py-2 text-[12.5px] text-ink-900 transition-colors outline-none placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || !prompt.trim() || online === false}
          aria-label="Send"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-40"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowUp className="size-4" aria-hidden />
          )}
        </button>
      </form>
    </aside>
  );
};

/* --------------------------------------------------------------------------
   Pieces
-------------------------------------------------------------------------- */

const OfflineNotice = () => (
  <div className="rounded-lg border border-dashed border-line-dashed bg-inset p-3">
    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-900">
      <AlertTriangle className="size-3.5 text-ember-500" aria-hidden />
      {AGENT} is not running
    </p>
    <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-500">
      The agent is a separate Python process. Start it in a third terminal:
    </p>
    <pre className="mt-2 overflow-x-auto rounded border border-line bg-surface p-2 font-mono text-[10.5px] leading-relaxed text-ink-700">
      cd AI{'\n'}pip install -r requirements.txt{'\n'}uvicorn app.main:app --reload --port 8000
    </pre>
  </div>
);

const Turn = ({ turn }) => {
  if (turn.role === 'user') {
    return (
      <p className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-brand-500 px-3 py-2 text-[12.5px] leading-snug text-white">
        {turn.text}
      </p>
    );
  }

  if (turn.role === 'error') {
    return (
      <p className="flex items-start gap-1.5 rounded-lg border border-ember-100 bg-ember-50 px-3 py-2 text-[12px] leading-snug text-ember-700">
        <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
        {turn.text}
      </p>
    );
  }

  // A conversational turn is prose and only prose. It gets the full width and
  // paragraph spacing, because "what can you do?" answered inside a bubble
  // sized for a one-line summary reads as a truncated result rather than an
  // answer. `reply` is only ever set on this branch; `summary` is the planning
  // branch's lead-in, so the fallback covers an older service that predates the
  // split.
  const isChat = turn.intent === 'chat';
  const prose = isChat ? turn.reply || turn.summary : turn.summary;

  if (isChat) {
    return (
      <div className="max-w-full space-y-2 rounded-lg rounded-bl-sm border border-line bg-inset px-3 py-2.5">
        {String(prose || '')
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((paragraph, index) => (
            <p key={index} className="text-[12.5px] leading-relaxed text-ink-900">
              {paragraph}
            </p>
          ))}
        <LanguageTag code={turn.languageCode} />
      </div>
    );
  }

  return (
    <div className="w-fit max-w-[92%] space-y-2">
      {prose && (
        <p className="rounded-lg rounded-bl-sm border border-line bg-inset px-3 py-2 text-[12.5px] leading-relaxed text-ink-900">
          {prose}
        </p>
      )}

      {turn.suggestions?.length > 0 && (
        <ul className="grid gap-1.5">
          {turn.suggestions.map((item, index) => (
            <li
              key={`${item.title}-${index}`}
              className="rounded-lg border border-line bg-surface p-2.5"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded bg-brand-50 text-brand-600">
                  <ActivityIcon type={item.type} className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-tight font-semibold text-ink-900">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-[11.5px] leading-snug text-ink-500">
                      {item.description}
                    </p>
                  )}
                </div>
                {typeof item.estimatedCost === 'number' && item.estimatedCost > 0 && (
                  <span className="shrink-0 text-[11px] font-semibold text-ink-700 tabular-nums">
                    {formatCurrency(item.estimatedCost)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <LanguageTag code={turn.languageCode} />
    </div>
  );
};

/**
 * A non-Latin answer is a feature of the graph (it detects the prompt's
 * language and replies in it), so label it rather than letting it look like a
 * bug. `en-IN` is the default, and labelling the default would be noise.
 */
const LanguageTag = ({ code }) =>
  code && code !== 'en-IN' ? (
    <p className="flex items-center gap-1 text-[10px] text-ink-300">
      <MessageSquareText className="size-3" aria-hidden />
      {code}
    </p>
  ) : null;
