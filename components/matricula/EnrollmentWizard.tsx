"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AUTOSAVE_DEBOUNCE_MS,
  LOCAL_STORAGE_KEY,
} from "@/lib/company";
import type { EnrollmentDraft } from "@/lib/validation";
import { calcAgeFromBr } from "@/lib/validation";
import { nextStep, prevStep, stepDisplayIndex } from "@/lib/steps";
import { ProgressBar } from "./ProgressBar";
import { FloatingSummary } from "./FloatingSummary";
import { ResumeModal } from "./ResumeModal";
import { StepStudent } from "./steps/StepStudent";
import { StepGuardians } from "./steps/StepGuardians";
import { StepCourses } from "./steps/StepCourses";
import { StepCourseInfo } from "./steps/StepCourseInfo";
import { StepModality } from "./steps/StepModality";
import { StepPlan } from "./steps/StepPlan";
import { StepPayment } from "./steps/StepPayment";
import { StepAutoRenew } from "./steps/StepAutoRenew";
import { StepNotices } from "./steps/StepNotices";
import { StepReview } from "./steps/StepReview";
import { StepWhatsApp } from "./steps/StepWhatsApp";

type SessionState = {
  token: string;
  currentStep: number;
  draft: EnrollmentDraft;
  status: string;
};

export function EnrollmentWizard() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResume, setShowResume] = useState(false);
  const [pendingResume, setPendingResume] = useState<SessionState | null>(null);
  const [completed, setCompleted] = useState<{
    whatsappUrl: string;
    studentName: string;
  } | null>(null);
  const [direction, setDirection] = useState(1);
  const [, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const age = useMemo(
    () => (session?.draft.birthDateBr ? calcAgeFromBr(session.draft.birthDateBr) : null),
    [session?.draft.birthDateBr]
  );

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { token?: string };
        if (parsed.token) {
          const res = await fetch(`/api/enrollment/${parsed.token}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "concluida") {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            } else {
              const existing: SessionState = {
                token: parsed.token,
                currentStep: data.currentStep || 1,
                draft: data.draft || {},
                status: data.status,
              };
              const hasProgress =
                Boolean(data.draft?.fullName) || data.currentStep > 1;
              if (hasProgress) {
                setPendingResume(existing);
                setShowResume(true);
                setLoading(false);
                return;
              }
              setSession(existing);
              setLoading(false);
              return;
            }
          }
        }
      }

      const res = await fetch("/api/enrollment", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao iniciar");
      const data = await res.json();
      const fresh: SessionState = {
        token: data.token,
        currentStep: 1,
        draft: {},
        status: "em_andamento",
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ token: data.token }));
      setSession(fresh);
    } catch (e) {
      console.error(e);
      setError(
        "Não foi possível iniciar a matrícula. Verifique a conexão e tente de novo."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const persist = useCallback(
    async (next: SessionState, immediate = false) => {
      const run = async () => {
        setSaving(true);
        try {
          await fetch(`/api/enrollment/${next.token}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentStep: next.currentStep,
              draft: next.draft,
            }),
          });
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({ token: next.token })
          );
        } catch (e) {
          console.error(e);
        } finally {
          setSaving(false);
        }
      };

      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (immediate) {
        await run();
      } else {
        saveTimer.current = setTimeout(run, AUTOSAVE_DEBOUNCE_MS);
      }
    },
    []
  );

  const updateDraft = useCallback(
    (partial: Partial<EnrollmentDraft>) => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = { ...prev, draft: { ...prev.draft, ...partial } };
        startTransition(() => {
          void persist(next);
        });
        return next;
      });
    },
    [persist]
  );

  const goTo = useCallback(
    (step: number, dir = 1) => {
      setDirection(dir);
      setSession((prev) => {
        if (!prev) return prev;
        const next = { ...prev, currentStep: step };
        void persist(next, true);
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [persist]
  );

  const goNext = () => {
    if (!session) return;
    const n = nextStep(session.currentStep, age);
    if (n) goTo(n, 1);
  };

  const goPrev = () => {
    if (!session) return;
    const p = prevStep(session.currentStep, age);
    if (p) goTo(p, -1);
  };

  if (loading) {
    return (
      <div className="rounded-[var(--radius)] bg-bg-elevated p-8 text-center shadow-[var(--shadow)]">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Preparando sua matrícula…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius)] border border-danger/30 bg-bg-elevated p-6 text-center">
        <p className="text-danger">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            void bootstrap();
          }}
          className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <StepWhatsApp
        studentName={completed.studentName}
        whatsappUrl={completed.whatsappUrl}
        draft={session?.draft ?? {}}
      />
    );
  }

  if (!session) return null;

  const progress = stepDisplayIndex(session.currentStep, age);
  const step = session.currentStep;

  return (
    <>
      {showResume && pendingResume && (
        <ResumeModal
          onContinue={() => {
            setSession(pendingResume);
            setShowResume(false);
            setPendingResume(null);
          }}
          onRestart={async () => {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setShowResume(false);
            setPendingResume(null);
            setLoading(true);
            const res = await fetch("/api/enrollment", { method: "POST" });
            const data = await res.json();
            const fresh: SessionState = {
              token: data.token,
              currentStep: 1,
              draft: {},
              status: "em_andamento",
            };
            localStorage.setItem(
              LOCAL_STORAGE_KEY,
              JSON.stringify({ token: data.token })
            );
            setSession(fresh);
            setLoading(false);
          }}
        />
      )}

      <ProgressBar
        current={progress.current}
        total={progress.total}
        label={progress.label}
        saving={saving}
      />

      <FloatingSummary draft={session.draft} />

      <div className="relative mt-4 overflow-hidden rounded-[var(--radius)] bg-bg-elevated p-5 shadow-[var(--shadow)] sm:p-7">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {step === 1 && (
              <StepStudent
                draft={session.draft}
                age={age}
                onChange={updateDraft}
                onNext={goNext}
              />
            )}
            {step === 2 && (
              <StepGuardians
                draft={session.draft}
                onChange={updateDraft}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 3 && (
              <StepCourses
                draft={session.draft}
                onChange={updateDraft}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 4 && (
              <StepCourseInfo
                draft={session.draft}
                onChange={updateDraft}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 5 && (
              <StepModality
                draft={session.draft}
                onChange={updateDraft}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 6 && (
              <StepPlan
                draft={session.draft}
                onChange={updateDraft}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 7 && (
              <StepPayment
                draft={session.draft}
                onChange={updateDraft}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 8 && (
              <StepAutoRenew
                draft={session.draft}
                onChange={updateDraft}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 9 && (
              <StepNotices
                draft={session.draft}
                onChange={updateDraft}
                onNext={goNext}
                onBack={goPrev}
              />
            )}
            {step === 10 && (
              <StepReview
                draft={session.draft}
                token={session.token}
                onChange={updateDraft}
                onBack={goPrev}
                onCompleted={(payload) => {
                  localStorage.removeItem(LOCAL_STORAGE_KEY);
                  setCompleted(payload);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
