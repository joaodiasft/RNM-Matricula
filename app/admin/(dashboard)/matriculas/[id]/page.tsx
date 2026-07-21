"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MODALITY_LABELS,
  PAYMENT_LABELS,
  PLAN_LABELS,
  type Modality,
  type PaymentMethod,
  type Plan,
} from "@/lib/pricing";
import { SUBJECT_LABELS } from "@/lib/courses";

export default function EnrollmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/enrollments/${id}`)
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (!res.ok) throw new Error("Não encontrado");
        setData(await res.json());
      })
      .catch(() => setError("Não foi possível carregar"));
  }, [id]);

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

  if (error) return <p className="text-danger">{error}</p>;
  if (!data) return <p className="text-muted">Carregando…</p>;

  const enrollment = data.enrollment as {
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
    currentStep: number;
  };
  const student = data.student as {
    fullName: string | null;
    birthDate: string | null;
    email: string | null;
    phone: string | null;
    grade: string | null;
    school: string | null;
    cpf: string | null;
    rg: string | null;
    address: string | null;
  } | null;
  const guardian = data.guardian as {
    fatherName: string | null;
    fatherPhone: string | null;
    motherName: string | null;
    motherPhone: string | null;
  } | null;
  const courses = data.courses as { subject: string; classCode: string }[];

  return (
    <div>
      <Link href="/admin/dashboard" className="text-sm text-brand">
        ← Voltar
      </Link>
      <h1 className="font-display mt-3 text-3xl">
        {student?.fullName || "Matrícula"}
      </h1>
      <p className="mt-1 text-sm text-muted">Status: {enrollment.status}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-bg-elevated p-5">
          <h2 className="font-semibold text-brand">Aluno</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="E-mail" value={student?.email} />
            <Row label="Telefone" value={student?.phone} />
            <Row label="Nascimento" value={student?.birthDate} />
            <Row label="Série" value={student?.grade} />
            <Row label="Escola" value={student?.school} />
            <Row label="CPF" value={student?.cpf} />
            <Row label="RG" value={student?.rg} />
            <Row label="Endereço" value={student?.address} />
          </dl>
        </section>

        <section className="rounded-2xl bg-bg-elevated p-5">
          <h2 className="font-semibold text-brand">Responsáveis</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row
              label="Pai"
              value={[guardian?.fatherName, guardian?.fatherPhone]
                .filter(Boolean)
                .join(" · ")}
            />
            <Row
              label="Mãe"
              value={[guardian?.motherName, guardian?.motherPhone]
                .filter(Boolean)
                .join(" · ")}
            />
          </dl>
        </section>

        <section className="rounded-2xl bg-bg-elevated p-5 md:col-span-2">
          <h2 className="font-semibold text-brand">Matrícula</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Row
              label="Cursos"
              value={courses
                .map(
                  (c) =>
                    `${SUBJECT_LABELS[c.subject as keyof typeof SUBJECT_LABELS] ?? c.subject} ${c.classCode}`
                )
                .join(", ")}
            />
            <Row
              label="Modalidade"
              value={
                enrollment.modality
                  ? MODALITY_LABELS[enrollment.modality as Modality]
                  : "—"
              }
            />
            <Row
              label="Plano"
              value={
                enrollment.plan
                  ? PLAN_LABELS[enrollment.plan as Plan]
                  : "—"
              }
            />
            <Row
              label="Pagamento"
              value={
                enrollment.paymentMethod
                  ? PAYMENT_LABELS[enrollment.paymentMethod as PaymentMethod]
                  : "—"
              }
            />
            <Row label="Mensalidade" value={enrollment.monthlyValue} />
            <Row label="Total plano" value={enrollment.planTotal} />
            <Row label="Taxa matrícula" value={enrollment.enrollmentFee} />
            <Row
              label="Rematrícula automática"
              value={enrollment.autoRenew ? "Sim" : "Não"}
            />
            <Row
              label="Concluída em"
              value={
                enrollment.completedAt
                  ? new Date(enrollment.completedAt).toLocaleString("pt-BR")
                  : "—"
              }
            />
            <Row label="Declaração" value={enrollment.declarationName} />
            <Row label="IP" value={enrollment.declarationIp} />
          </dl>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={erase}
          className="rounded-xl border border-danger px-4 py-2.5 text-sm font-semibold text-danger"
        >
          Apagar dados (LGPD)
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}
