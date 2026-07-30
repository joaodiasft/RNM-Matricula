"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AUTOSAVE_DEBOUNCE_MS,
  LOCAL_STORAGE_KEY,
} from "@/lib/company";
import type { EnrollmentDraft } from "@/lib/validation";
import { calcAgeFromBr } from "@/lib/validation";
import { nextStep, prevStep, stepDisplayIndex, needsModalityDutyStep } from "@/lib/steps";
import {
  draftScholarshipKind,
  isFullScholarship,
} from "@/lib/scholarship";
import { ProgressBar } from "./ProgressBar";
import { FloatingSummary } from "./FloatingSummary";
import { ResumeModal } from "./ResumeModal";
import { ImportantNoticeModal } from "./ImportantNoticeModal";
import { StepStudent } from "./steps/StepStudent";
import { StepGuardians } from "./steps/StepGuardians";
import { StepCourses } from "./steps/StepCourses";
import { StepCourseInfo } from "./steps/StepCourseInfo";
import { StepModality } from "./steps/StepModality";
import { StepModalityDuty } from "./steps/StepModalityDuty";
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
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResume, setShowResume] = useState(false);
  const [showImportantNotice, setShowImportantNotice] = useState(true);
  const [pendingResume, setPendingResume] = useState<SessionState | null>(null);
  const [completed, setCompleted] = useState<{
    whatsappUrl: string;
    studentName: string;
    referralCode?: string | null;
  } | null>(null);
  const [direction, setDirection] = useState(1);
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
        setSaved(false);
        try {
          const res = await fetch(`/api/enrollment/${next.token}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              currentStep: next.currentStep,
              draft: next.draft,
            }),
          });
          if (!res.ok) {
            console.error("[persist]", res.status, await res.text().catch(() => ""));
            return;
          }
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({ token: next.token })
          );
          setSaved(true);
        } catch (e) {
          // Rede/HMR: não derruba a UI — o rascunho continua local.
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
        const draft = { ...prev.draft, ...partial };
        // Remove chaves explicitamente undefined (ex.: limpar modalidade).
        for (const key of Object.keys(partial) as (keyof EnrollmentDraft)[]) {
          if (partial[key] === undefined) {
            delete draft[key];
          }
        }
        return { ...prev, draft };
      });
    },
    []
  );

  // Persiste (autosave com debounce) sempre que o rascunho muda — fora do
  // updater de estado, para não chamar efeitos durante a renderização.
  useEffect(() => {
    if (session) void persist(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.draft]);

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

  // Sessões antigas: pula passos ocultos (rematrícula / pagamento / compromissos).
  // Depende só dos campos relevantes — NÃO de `session` inteiro, senão cada
  // autosave reentra no efeito e gera loop de goTo → persist → Failed to fetch.
  useEffect(() => {
    if (!session) return;
    const step = session.currentStep;
    const plan = session.draft.plan;
    const scholarship = isFullScholarship(draftScholarshipKind(session.draft));
    const modality = session.draft.modality;
    const opts = { age, plan, scholarship, modality };

    if (step === 11 && !needsModalityDutyStep(modality)) {
      const n = nextStep(5, opts);
      if (n != null) goTo(n, 1);
      return;
    }
    if (step === 8 && plan !== "mensal") {
      goTo(9, 1);
      return;
    }
    if (step === 7 && scholarship) {
      const n = nextStep(7, { ...opts, scholarship: true });
      if (n != null && n !== step) goTo(n, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intencional: só reage a step/plan/bolsa/modalidade
  }, [
    session?.currentStep,
    session?.draft.plan,
    session?.draft.scholarshipValid,
    session?.draft.scholarshipKind,
    session?.draft.modality,
    age,
    goTo,
  ]);

  const goNext = () => {
    if (!session) return;
    const scholarship = isFullScholarship(draftScholarshipKind(session.draft));
    const n = nextStep(session.currentStep, {
      age,
      plan: session.draft.plan,
      scholarship,
      modality: session.draft.modality,
    });
    if (!n) return;

    if (session.currentStep === 6 && scholarship) {
      setDirection(1);
      setSession((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          currentStep: n,
          draft: {
            ...prev.draft,
            paymentMethod: "isento" as const,
            waivedFee: true,
          },
        };
        void persist(next, true);
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    goTo(n, 1);
  };

  const goPrev = () => {
    if (!session) return;
    const p = prevStep(session.currentStep, {
      age,
      plan: session.draft.plan,
      scholarship: isFullScholarship(draftScholarshipKind(session.draft)),
      modality: session.draft.modality,
    });
    if (p) goTo(p, -1);
  };

  if (loading) {
    return (
      <div className="card p-10 text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-brand-soft border-t-brand" />
        <p className="mt-4 text-sm font-medium text-muted">
          Preparando sua matrícula…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger/30 bg-danger-soft/40 p-7 text-center">
        <p className="font-medium text-danger">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            void bootstrap();
          }}
          className="brand-gradient mt-5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:brightness-105 active:scale-[0.98]"
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
        referralCode={completed.referralCode}
      />
    );
  }

  // Aviso importante na entrada da matrícula (antes de retomar / preencher)
  if (showImportantNotice && (session || (showResume && pendingResume))) {
    return (
      <ImportantNoticeModal onContinue={() => setShowImportantNotice(false)} />
    );
  }

  // Modal de retomar DEVE renderizar mesmo sem session ainda
  // (antes o `if (!session) return null` engolia a tela inteira).
  if (showResume && pendingResume) {
    return (
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
          try {
            const res = await fetch("/api/enrollment", { method: "POST" });
            if (!res.ok) throw new Error("Falha ao reiniciar");
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
          } catch (e) {
            console.error(e);
            setError(
              "Não foi possível iniciar a matrícula. Verifique a conexão e tente de novo."
            );
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  }

  if (!session) {
    return (
      <div className="card border-danger/30 bg-danger-soft/40 p-7 text-center">
        <p className="font-medium text-danger">
          Não foi possível carregar a matrícula.
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            void bootstrap();
          }}
          className="brand-gradient mt-5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-brand)] transition hover:brightness-105 active:scale-[0.98]"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const progress = stepDisplayIndex(session.currentStep, {
    age,
    plan: session.draft.plan,
    scholarship: isFullScholarship(draftScholarshipKind(session.draft)),
    modality: session.draft.modality,
  });
  const step = session.currentStep;

  return (
    <>
      <ProgressBar
        current={progress.current}
        total={progress.total}
        label={progress.label}
        saving={saving}
        saved={saved}
      />

      <FloatingSummary draft={session.draft} />

      <div className="card relative mt-3 overflow-hidden p-5 sm:mt-4 sm:p-7">
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
                token={session.token}
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
            {step === 11 && (
              <StepModalityDuty
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
            {step === 8 && session.draft.plan === "mensal" && (
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
                onEdit={(s) => goTo(s, -1)}
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
