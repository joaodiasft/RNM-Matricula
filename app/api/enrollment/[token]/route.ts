import { NextResponse } from "next/server";
import {
  getEnrollmentByToken,
  patchEnrollment,
} from "@/lib/enrollment-service";
import type { EnrollmentDraft } from "@/lib/validation";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  try {
    const enrollment = await getEnrollmentByToken(token);
    if (!enrollment) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
    const draft = enrollment.draftData
      ? (JSON.parse(enrollment.draftData) as EnrollmentDraft)
      : {};
    return NextResponse.json({
      token,
      status: enrollment.status,
      currentStep: enrollment.currentStep,
      draft,
      completedAt: enrollment.completedAt,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao carregar" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { token } = await params;
  try {
    const body = (await req.json()) as {
      currentStep?: number;
      draft?: EnrollmentDraft;
    };
    const updated = await patchEnrollment(token, body);
    if (!updated) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      currentStep: updated.currentStep,
      status: updated.status,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
