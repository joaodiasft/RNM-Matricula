"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Section,
  btnPrimaryClass,
  btnGhostClass,
  inputAdminClass,
} from "@/components/admin/ui";
import {
  CLASSES,
  GRADES,
  CONCLUDED_GRADE,
  getAvailableClasses,
  isFundamentalGrade,
  SUBJECT_LABELS,
  type Subject,
} from "@/lib/courses";
import {
  calculatePricing,
  formatBRL,
  MODALITY_LABELS,
  PLAN_LABELS,
  PAYMENT_LABELS,
  type Modality,
  type Plan,
  type PaymentMethod,
} from "@/lib/pricing";
import { maskPhone } from "@/lib/validation";

type ClassAvail = { seatsLeft: number; full: boolean };
const PAYMENT_FORMS = ["PIX", "Dinheiro", "Cartão", "Transferência", "Boleto", "Outro"];

const labelCls = "block text-xs font-semibold text-muted";

export default function MatriculaPresencialPage() {
  const router = useRouter();

  // Aluno
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [address, setAddress] = useState("");
  const [referralSource, setReferralSource] = useState("");

  // Responsáveis
  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [motherName, setMotherName] = useState("");
  const [motherPhone, setMotherPhone] = useState("");
  const [principalGuardian, setPrincipalGuardian] = useState<"pai" | "mae">("pai");

  // Turmas
  const [availability, setAvailability] = useState<Record<string, ClassAvail>>({});
  const [showMedio, setShowMedio] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({}); // subject -> classCode

  // Plano / pagamento
  const [modality, setModality] = useState("");
  const [plan, setPlan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);

  const [payStatus, setPayStatus] = useState("");
  const [payMonth, setPayMonth] = useState("");
  const [payForm, setPayForm] = useState("");
  const [payPaidOn, setPayPaidOn] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, ClassAvail> = {};
        for (const c of d.classes || []) {
          map[c.code] = { seatsLeft: c.seatsLeft, full: c.full };
        }
        setAvailability(map);
      })
      .catch(() => {});
  }, []);

  const isFundamental = isFundamentalGrade(grade);

  const available = useMemo(() => {
    const base = getAvailableClasses(grade);
    if (isFundamental && showMedio) {
      const codes = new Set(base.map((c) => c.code));
      return [...base, ...CLASSES.filter((c) => c.level === "medio" && !codes.has(c.code))];
    }
    return base;
  }, [grade, isFundamental, showMedio]);

  const subjectsInClasses = useMemo(() => {
    const set = new Set<Subject>();
    available.forEach((c) => set.add(c.subject));
    return ["redacao", "exatas", "matematica"].filter((s) =>
      set.has(s as Subject)
    ) as Subject[];
  }, [available]);

  const courses = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, code]) => code)
        .map(([subject, classCode]) => ({ subject: subject as Subject, classCode })),
    [selected]
  );

  const pricing = useMemo(() => {
    if (!modality || !plan || !paymentMethod || courses.length === 0) return null;
    return calculatePricing({
      modality: modality as Modality,
      plan: plan as Plan,
      paymentMethod: paymentMethod as PaymentMethod,
      subjects: courses.map((c) => c.subject),
    });
  }, [modality, plan, paymentMethod, courses]);

  const pickClass = (subject: Subject, code: string) =>
    setSelected((prev) => ({
      ...prev,
      [subject]: prev[subject] === code ? "" : code,
    }));

  const submit = async () => {
    setError(null);
    if (!fullName.trim()) return setError("Informe o nome do aluno.");
    if (!phone.trim()) return setError("Informe o telefone.");
    if (!grade) return setError("Informe a série.");
    if (courses.length === 0) return setError("Selecione pelo menos uma turma.");
    if (!modality || !plan || !paymentMethod) {
      return setError("Escolha modalidade, plano e forma de pagamento.");
    }

    setSaving(true);
    const res = await fetch("/api/admin/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        birthDateIso: birthDate || null,
        email: email || null,
        phone,
        grade,
        school: school || null,
        cpf: cpf || null,
        rg: rg || null,
        address: address || null,
        referralSource: referralSource || null,
        fatherName: fatherName || null,
        fatherPhone: fatherPhone || null,
        motherName: motherName || null,
        motherPhone: motherPhone || null,
        principalGuardian,
        courses,
        modality,
        plan,
        paymentMethod,
        autoRenew: plan === "mensal" ? autoRenew : false,
        payment: {
          status: payStatus || null,
          month: payMonth || null,
          form: payForm || null,
          paidOn: payPaidOn || null,
        },
        sendConfirmationEmail: sendEmail,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!res.ok) {
      setError(data.error || "Não foi possível criar a matrícula.");
      return;
    }
    // Sucesso → abre a matrícula criada (mostra acessos, permite copiar WhatsApp).
    router.push(`/admin/matriculas/${data.enrollmentId}`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-ink">
          Nova matrícula (presencial)
        </h1>
        <p className="mt-1 text-sm text-muted">
          Preencha os dados do aluno atendido no balcão. A matrícula é criada já
          concluída, com número e acessos — sem precisar de código por e-mail.
        </p>
      </div>

      <div className="space-y-4">
        <Section title="Dados do aluno">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={`${labelCls} sm:col-span-2`}>
              Nome completo *
              <input className={`${inputAdminClass()} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className={labelCls}>
              Nascimento
              <input type="date" className={`${inputAdminClass()} mt-1`} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </label>
            <label className={labelCls}>
              Telefone / WhatsApp *
              <input className={`${inputAdminClass()} mt-1`} value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} inputMode="tel" />
            </label>
            <label className={`${labelCls} sm:col-span-2`}>
              E-mail
              <input type="email" className={`${inputAdminClass()} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className={labelCls}>
              Série *
              <select className={`${inputAdminClass()} mt-1`} value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">—</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
                <option value={CONCLUDED_GRADE}>{CONCLUDED_GRADE}</option>
              </select>
            </label>
            <label className={`${labelCls} sm:col-span-2`}>
              Escola
              <input className={`${inputAdminClass()} mt-1`} value={school} onChange={(e) => setSchool(e.target.value)} />
            </label>
            <label className={labelCls}>
              CPF
              <input className={`${inputAdminClass()} mt-1`} value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </label>
            <label className={labelCls}>
              RG
              <input className={`${inputAdminClass()} mt-1`} value={rg} onChange={(e) => setRg(e.target.value)} />
            </label>
            <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
              Endereço
              <input className={`${inputAdminClass()} mt-1`} value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
            <label className={`${labelCls} sm:col-span-2 lg:col-span-3`}>
              Como conheceu
              <input className={`${inputAdminClass()} mt-1`} value={referralSource} onChange={(e) => setReferralSource(e.target.value)} />
            </label>
          </div>
        </Section>

        <Section title="Responsáveis (se menor de idade)">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>
              Nome do pai
              <input className={`${inputAdminClass()} mt-1`} value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
            </label>
            <label className={labelCls}>
              Telefone do pai
              <input className={`${inputAdminClass()} mt-1`} value={fatherPhone} onChange={(e) => setFatherPhone(maskPhone(e.target.value))} inputMode="tel" />
            </label>
            <label className={labelCls}>
              Nome da mãe
              <input className={`${inputAdminClass()} mt-1`} value={motherName} onChange={(e) => setMotherName(e.target.value)} />
            </label>
            <label className={labelCls}>
              Telefone da mãe
              <input className={`${inputAdminClass()} mt-1`} value={motherPhone} onChange={(e) => setMotherPhone(maskPhone(e.target.value))} inputMode="tel" />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="text-xs font-semibold text-muted">Responsável principal:</span>
            <label className="flex items-center gap-1.5 font-semibold">
              <input type="radio" name="principal" checked={principalGuardian === "pai"} onChange={() => setPrincipalGuardian("pai")} className="accent-[var(--brand)]" />
              Pai
            </label>
            <label className="flex items-center gap-1.5 font-semibold">
              <input type="radio" name="principal" checked={principalGuardian === "mae"} onChange={() => setPrincipalGuardian("mae")} className="accent-[var(--brand)]" />
              Mãe
            </label>
          </div>
        </Section>

        <Section title="Turmas">
          {!grade ? (
            <p className="text-sm text-muted">Informe a série do aluno para ver as turmas.</p>
          ) : (
            <>
              {isFundamental && (
                <label className="mb-4 flex cursor-pointer items-center gap-2 rounded-xl border border-brand/25 bg-brand-soft/40 px-4 py-3 text-sm">
                  <input type="checkbox" checked={showMedio} onChange={(e) => setShowMedio(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                  <span className="font-bold text-ink">Ver também turmas do Ensino Médio</span>
                </label>
              )}
              <div className="space-y-5">
                {subjectsInClasses.map((subject) => (
                  <div key={subject}>
                    <p className="mb-2 font-display text-base font-bold text-ink">
                      {SUBJECT_LABELS[subject]}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {available
                        .filter((c) => c.subject === subject)
                        .map((c) => {
                          const on = selected[subject] === c.code;
                          const avail = availability[c.code];
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => pickClass(subject, c.code)}
                              className={`rounded-xl border px-3 py-3 text-left transition ${
                                on ? "border-brand bg-brand-soft/80 ring-2 ring-brand/25" : "border-line bg-white hover:border-brand/40"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 items-center rounded-lg bg-ink px-2 text-xs font-extrabold text-white">{c.code}</span>
                                <span className="text-sm font-bold text-ink">{c.day}</span>
                                {avail?.full && (
                                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-bold text-danger">lotada</span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted">{c.schedule} · {c.label}</p>
                              {avail && !avail.full && (
                                <p className="mt-1 text-xs font-bold text-brand">{avail.seatsLeft} vaga(s)</p>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        <Section title="Plano e pagamento">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelCls}>
              Modalidade *
              <select className={`${inputAdminClass()} mt-1`} value={modality} onChange={(e) => setModality(e.target.value)}>
                <option value="">—</option>
                {(Object.keys(MODALITY_LABELS) as Modality[]).map((m) => (
                  <option key={m} value={m}>{MODALITY_LABELS[m]}</option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              Plano *
              <select className={`${inputAdminClass()} mt-1`} value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="">—</option>
                {(Object.keys(PLAN_LABELS) as Plan[]).map((p) => (
                  <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              Forma de pagamento *
              <select className={`${inputAdminClass()} mt-1`} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="">—</option>
                {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((p) => (
                  <option key={p} value={p}>{PAYMENT_LABELS[p]}</option>
                ))}
              </select>
            </label>
            {plan === "mensal" && (
              <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
                <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                Rematrícula automática
              </label>
            )}
          </div>

          {pricing && (
            <div className="mt-4 flex flex-wrap gap-4 rounded-xl border border-brand/20 bg-brand-soft/50 px-4 py-3 text-sm">
              <span>Mensal: <strong className="text-brand">{formatBRL(pricing.monthlyValue)}</strong></span>
              <span>Total do plano: <strong className="text-brand">{formatBRL(pricing.planTotal)}</strong></span>
              <span>Taxa: <strong className="text-brand">{pricing.feeWaived ? "isenta" : formatBRL(pricing.enrollmentFee)}</strong></span>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelCls}>
              Situação do pagamento
              <select className={`${inputAdminClass()} mt-1`} value={payStatus} onChange={(e) => setPayStatus(e.target.value)}>
                <option value="">—</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </label>
            <label className={labelCls}>
              Mês de referência
              <input type="month" className={`${inputAdminClass()} mt-1`} value={payMonth} onChange={(e) => setPayMonth(e.target.value)} />
            </label>
            <label className={labelCls}>
              Como pagou
              <select className={`${inputAdminClass()} mt-1`} value={payForm} onChange={(e) => setPayForm(e.target.value)}>
                <option value="">—</option>
                {PAYMENT_FORMS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              Dia que pagou
              <input type="date" className={`${inputAdminClass()} mt-1`} value={payPaidOn} onChange={(e) => setPayPaidOn(e.target.value)} />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
            Enviar e-mail de confirmação com os acessos (se houver e-mail)
          </label>
        </Section>

        {error && (
          <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={submit} disabled={saving} className={btnPrimaryClass()}>
            {saving ? "Criando matrícula…" : "Criar matrícula"}
          </button>
          <Link href="/admin/dashboard" className={btnGhostClass()}>
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}
