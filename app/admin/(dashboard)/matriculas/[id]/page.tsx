"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "@/lib/pricing";
import { getClassByCode, SUBJECT_LABELS } from "@/lib/courses";
import {
  ContactActions,
  FieldRow,
  Section,
  StatusBadge,
  btnGhostClass,
  btnPrimaryClass,
  formatDate,
  formatDateTime,
  formatMoney,
  inputAdminClass,
} from "@/components/admin/ui";

type Enrollment = {
  id: string;
  status: string;
  modality: string | null;
  plan: string | null;
  paymentMethod: string | null;
  autoRenew: boolean | null;
  monthlyValue: string | null;
  planTotal: string | null;
  enrollmentFee: string | null;
  declarationName: string | null;
  declarationIp: string | null;
  declarationAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
  currentStep: number;
  emailVerified: boolean | null;
  obligationStatus: string | null;
  obligationDeadline: string | null;
  obligationDivulged: boolean | null;
  obligationBroughtStudent: boolean | null;
  referralCodeUsed: string | null;
  lastActivityAt: string | null;
  courseInfoAck: boolean | null;
  finalNoticesAck: string | null;
  editToken: string | null;
};

type Student = {
  fullName: string | null;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  grade: string | null;
  school: string | null;
  cpf: string | null;
  rg: string | null;
  address: string | null;
  referralSource: string | null;
  lgpdConsent: boolean | null;
};

type Guardian = {
  fatherName: string | null;
  fatherPhone: string | null;
  motherName: string | null;
  motherPhone: string | null;
};

type Course = {
  subject: string;
  classCode: string;
  onWaitlist: boolean | null;
};

export default function EnrollmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [referrals, setReferrals] = useState<
    { code: string; referredEnrollmentId: string | null }[]
  >([]);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // editable fields
  const [status, setStatus] = useState("");
  const [modality, setModality] = useState("");
  const [plan, setPlan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [obligationStatus, setObligationStatus] = useState("");
  const [obligationDeadline, setObligationDeadline] = useState("");
  const [obligationDivulged, setObligationDivulged] = useState(false);
  const [obligationBroughtStudent, setObligationBroughtStudent] =
    useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/enrollments/${id}`);
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!res.ok) {
      setError("Não foi possível carregar");
      return;
    }
    const data = await res.json();
    const e = data.enrollment as Enrollment;
    setEnrollment(e);
    setStudent(data.student);
    setGuardian(data.guardian);
    setCourses(data.courses || []);
    setReferrals(data.referrals || []);
    setDraft(data.draft);
    setStatus(e.status);
    setModality(e.modality || "");
    setPlan(e.plan || "");
    setPaymentMethod(e.paymentMethod || "");
    setAutoRenew(Boolean(e.autoRenew));
    setObligationStatus(e.obligationStatus || "pendente");
    setObligationDeadline(e.obligationDeadline || "");
    setObligationDivulged(Boolean(e.obligationDivulged));
    setObligationBroughtStudent(Boolean(e.obligationBroughtStudent));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/enrollments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        modality: modality || null,
        plan: plan || null,
        paymentMethod: paymentMethod || null,
        autoRenew: plan === "mensal" ? autoRenew : false,
        obligationStatus,
        obligationDeadline: obligationDeadline || null,
        obligationDivulged,
        obligationBroughtStudent,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Falha ao salvar");
      return;
    }
    setMessage("Alterações salvas");
    void load();
  };

  const erase = async () => {
    if (
      !confirm(
        "Apagar definitivamente os dados deste aluno (LGPD)? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/enrollments/${id}`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/admin/dashboard");
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger-soft p-6 text-danger">
        {error}
        <div className="mt-4">
          <Link href="/admin/dashboard" className="font-semibold underline">
            Voltar às matrículas
          </Link>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return <p className="text-muted">Carregando matrícula…</p>;
  }

  const showObligation =
    modality === "desconto" || modality === "desconto_parcial";
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://rnm-matricula.jmdias2901.workers.dev";
  const editUrl = enrollment.editToken
    ? `${appUrl}/editar/${enrollment.editToken}`
    : null;

  return (
    <div>
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
      >
        ← Voltar às matrículas
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={enrollment.status} />
            {enrollment.emailVerified && (
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">
                E-mail verificado
              </span>
            )}
            {enrollment.status === "em_andamento" && (
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand-deep">
                Passo {enrollment.currentStep}/10
              </span>
            )}
          </div>
          <h1 className="font-display mt-2 text-3xl font-extrabold text-ink">
            {student?.fullName || "Matrícula sem nome"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Criada {formatDateTime(enrollment.createdAt)}
            {enrollment.completedAt
              ? ` · concluída ${formatDateTime(enrollment.completedAt)}`
              : ""}
          </p>
          <ContactActions
            phone={student?.phone}
            email={student?.email}
            name={student?.fullName}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/export?id=${enrollment.id}`}
            className={btnGhostClass()}
          >
            Exportar CSV
          </a>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={btnPrimaryClass()}
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`mt-4 rounded-xl px-3 py-2.5 text-sm font-medium ${
            message.includes("salvas")
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}
          role="status"
        >
          {message}
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section title="Aluno">
          <dl>
            <FieldRow label="Nome">{student?.fullName}</FieldRow>
            <FieldRow label="E-mail">{student?.email}</FieldRow>
            <FieldRow label="Telefone">{student?.phone}</FieldRow>
            <FieldRow label="Nascimento">
              {student?.birthDate
                ? formatDate(student.birthDate)
                : "—"}
            </FieldRow>
            <FieldRow label="Série">{student?.grade}</FieldRow>
            <FieldRow label="Escola">{student?.school}</FieldRow>
            <FieldRow label="CPF">{student?.cpf}</FieldRow>
            <FieldRow label="RG">{student?.rg}</FieldRow>
            <FieldRow label="Endereço">{student?.address}</FieldRow>
            <FieldRow label="Como conheceu">
              {student?.referralSource || "—"}
            </FieldRow>
            <FieldRow label="LGPD">
              {student?.lgpdConsent ? "Consentimento registrado" : "Não marcado"}
            </FieldRow>
          </dl>
        </Section>

        <Section title="Responsáveis">
          <dl>
            <FieldRow label="Pai">
              {[guardian?.fatherName, guardian?.fatherPhone]
                .filter(Boolean)
                .join(" · ") || "—"}
            </FieldRow>
            <FieldRow label="Mãe">
              {[guardian?.motherName, guardian?.motherPhone]
                .filter(Boolean)
                .join(" · ") || "—"}
            </FieldRow>
          </dl>
          {(guardian?.fatherPhone || guardian?.motherPhone) && (
            <div className="mt-3 space-y-2">
              {guardian?.fatherPhone && (
                <div>
                  <p className="text-xs text-muted">Contato do pai</p>
                  <ContactActions
                    phone={guardian.fatherPhone}
                    name={guardian.fatherName}
                  />
                </div>
              )}
              {guardian?.motherPhone && (
                <div>
                  <p className="text-xs text-muted">Contato da mãe</p>
                  <ContactActions
                    phone={guardian.motherPhone}
                    name={guardian.motherName}
                  />
                </div>
              )}
            </div>
          )}
        </Section>

        <Section title="Turmas" className="lg:col-span-2">
          {courses.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma turma vinculada ainda.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {courses.map((c) => {
                const info = getClassByCode(c.classCode);
                return (
                  <li
                    key={`${c.classCode}-${c.subject}`}
                    className="rounded-xl border border-line bg-bg-subtle px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-ink">
                        {SUBJECT_LABELS[
                          c.subject as keyof typeof SUBJECT_LABELS
                        ] ?? c.subject}{" "}
                        · {c.classCode}
                      </p>
                      {c.onWaitlist && (
                        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning">
                          Lista de espera
                        </span>
                      )}
                    </div>
                    {info && (
                      <p className="mt-1 text-sm text-muted">
                        {info.day} · {info.schedule}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/admin/turmas"
            className="mt-3 inline-block text-xs font-semibold text-brand hover:underline"
          >
            Gerenciar vagas e turmas →
          </Link>
        </Section>

        <Section title="Valores e pagamento">
          <dl>
            <FieldRow label="Mensalidade">
              {formatMoney(enrollment.monthlyValue)}
            </FieldRow>
            <FieldRow label="Total do plano">
              {formatMoney(enrollment.planTotal)}
            </FieldRow>
            <FieldRow label="Taxa de matrícula">
              {formatMoney(enrollment.enrollmentFee)}
            </FieldRow>
            <FieldRow label="Código indicação usado">
              {enrollment.referralCodeUsed || "—"}
            </FieldRow>
            {referrals.length > 0 && (
              <FieldRow label="Códigos gerados">
                {referrals
                  .map(
                    (r) =>
                      `${r.code}${r.referredEnrollmentId ? " (usado)" : ""}`
                  )
                  .join(", ")}
              </FieldRow>
            )}
          </dl>
        </Section>

        <Section title="Declaração e verificação">
          <dl>
            <FieldRow label="Nome na declaração">
              {enrollment.declarationName || "—"}
            </FieldRow>
            <FieldRow label="Assinado em">
              {formatDateTime(enrollment.declarationAt)}
            </FieldRow>
            <FieldRow label="IP">{enrollment.declarationIp || "—"}</FieldRow>
            <FieldRow label="E-mail verificado">
              {enrollment.emailVerified ? "Sim" : "Não"}
            </FieldRow>
            <FieldRow label="Última atividade">
              {formatDateTime(enrollment.lastActivityAt)}
            </FieldRow>
            {editUrl && (
              <FieldRow label="Link de edição do aluno">
                <a
                  href={editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-brand hover:underline"
                >
                  {editUrl}
                </a>
              </FieldRow>
            )}
          </dl>
        </Section>

        <Section title="Editar matrícula" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold text-muted">
                Status
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputAdminClass()}
              >
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
                <option value="abandonada">Abandonada</option>
                <option value="alerta_duplicidade">Duplicidade</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold text-muted">
                Modalidade
              </span>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className={inputAdminClass()}
              >
                <option value="">—</option>
                {(Object.keys(MODALITY_LABELS) as Modality[]).map((m) => (
                  <option key={m} value={m}>
                    {MODALITY_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold text-muted">
                Plano
              </span>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className={inputAdminClass()}
              >
                <option value="">—</option>
                {(Object.keys(PLAN_LABELS) as Plan[]).map((p) => (
                  <option key={p} value={p}>
                    {PLAN_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-semibold text-muted">
                Forma de pagamento
              </span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={inputAdminClass()}
              >
                <option value="">—</option>
                {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((p) => (
                  <option key={p} value={p}>
                    {PAYMENT_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            {plan === "mensal" && (
              <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                Rematrícula automática
              </label>
            )}
          </div>

          {showObligation && (
            <div className="mt-5 rounded-xl border border-warning/25 bg-warning-soft/40 p-4">
              <h3 className="text-sm font-bold text-ink">Obrigações da modalidade</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">
                    Status
                  </span>
                  <select
                    value={obligationStatus}
                    onChange={(e) => setObligationStatus(e.target.value)}
                    className={inputAdminClass()}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="cumprida">Cumprida</option>
                    <option value="parcial">Parcial</option>
                    <option value="nao_cumprida">Não cumprida</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-semibold text-muted">
                    Prazo
                  </span>
                  <input
                    type="date"
                    value={obligationDeadline}
                    onChange={(e) => setObligationDeadline(e.target.value)}
                    className={inputAdminClass()}
                  />
                </label>
                <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={obligationDivulged}
                    onChange={(e) => setObligationDivulged(e.target.checked)}
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  Divulgou
                </label>
                <label className="flex items-center gap-2 pt-6 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={obligationBroughtStudent}
                    onChange={(e) =>
                      setObligationBroughtStudent(e.target.checked)
                    }
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  Trouxe aluno
                </label>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className={btnPrimaryClass()}
            >
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
            <Link href="/admin/operacoes" className={btnGhostClass()}>
              Ir para Operações
            </Link>
          </div>
        </Section>

        {draft && Object.keys(draft).length > 0 && (
          <Section title="Rascunho do formulário" className="lg:col-span-2">
            <p className="mb-3 text-xs text-muted">
              Dados salvos automaticamente enquanto o aluno preenchia (útil para
              matrículas em andamento ou abandonadas).
            </p>
            <div className="max-h-72 overflow-auto rounded-xl bg-bg-subtle p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(draft, null, 2)}
              </pre>
            </div>
          </Section>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-danger/25 bg-danger-soft/40 p-5">
        <h2 className="font-semibold text-danger">Zona sensível — LGPD</h2>
        <p className="mt-1 text-sm text-muted">
          Remove aluno, responsáveis e matrícula de forma permanente.
        </p>
        <button
          type="button"
          onClick={erase}
          className="mt-4 rounded-xl border border-danger px-4 py-2.5 text-sm font-bold text-danger transition hover:bg-danger hover:text-white"
        >
          Apagar dados (LGPD)
        </button>
      </div>
    </div>
  );
}
