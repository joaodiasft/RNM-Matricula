"use client";

import {
  getGroupsForClassCodes,
  GROUP_ACCESS_POLICY,
  type ClassGroupInfo,
} from "@/lib/class-groups";
import { getClassByCode } from "@/lib/courses";

type Props = {
  classCodes: string[];
  /** compact = cards menores (ex.: tela final) */
  compact?: boolean;
  /** Se true, mostra botão de convite quando houver URL */
  showInviteAction?: boolean;
};

export function ClassGroupsPanel({
  classCodes,
  compact = false,
  showInviteAction = false,
}: Props) {
  const groups = getGroupsForClassCodes(classCodes);
  if (groups.length === 0) return null;

  return (
    <section
      className={
        compact
          ? "space-y-3"
          : "overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)]"
      }
    >
      {!compact && (
        <div className="border-b border-line bg-gradient-to-r from-[#ff008e]/12 to-transparent px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
            Comunicação
          </p>
          <h3 className="font-display mt-1 text-xl font-bold text-ink">
            Grupos de avisos
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Cada turma tem um grupo oficial de avisos no WhatsApp. É por lá que
            saem materiais, horários e comunicados.
          </p>
        </div>
      )}

      {compact && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Grupos de avisos
          </p>
          <p className="mt-1 text-sm text-muted">
            Entrada liberada após a confirmação do pagamento.
          </p>
        </div>
      )}

      <ul className={compact ? "space-y-2.5" : "divide-y divide-line"}>
        {groups.map((g) => (
          <GroupRow
            key={g.classCode}
            group={g}
            compact={compact}
            showInviteAction={showInviteAction}
          />
        ))}
      </ul>

      <div
        className={
          compact
            ? "rounded-2xl border border-warning/30 bg-warning-soft px-3.5 py-3 text-sm leading-relaxed text-ink"
            : "border-t border-line bg-warning-soft/70 px-5 py-4 text-sm leading-relaxed text-ink"
        }
      >
        <p className="font-bold text-ink">Como funciona a entrada</p>
        <p className="mt-1 text-ink-soft">{GROUP_ACCESS_POLICY}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-ink-soft">
          <li>Conclua a matrícula e envie o registro no WhatsApp da escola.</li>
          <li>Efetue o pagamento conforme combinado com a secretaria.</li>
          <li>Após a confirmação, seu pedido no grupo é aprovado.</li>
        </ol>
      </div>
    </section>
  );
}

function GroupRow({
  group,
  compact,
  showInviteAction,
}: {
  group: ClassGroupInfo;
  compact: boolean;
  showInviteAction: boolean;
}) {
  const info = getClassByCode(group.classCode);
  const hasLink = Boolean(group.inviteUrl);

  return (
    <li
      className={
        compact
          ? "rounded-2xl border border-line bg-bg-subtle px-3.5 py-3"
          : "px-5 py-4"
      }
    >
      <div className="flex items-start gap-3">
        <span className="brand-gradient mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white">
          {group.classCode}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{group.groupName}</p>
          {info && (
            <p className="mt-0.5 text-sm text-muted">
              {info.day} · {info.schedule}
            </p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {group.description}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
              Aprovação após pagamento
            </span>
            {!hasLink && (
              <span className="rounded-full bg-bg-subtle px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted ring-1 ring-line">
                Link em breve
              </span>
            )}
          </div>

          {showInviteAction && hasLink && (
            <a
              href={group.inviteUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-gradient mt-3 inline-flex min-h-[40px] items-center rounded-xl px-4 text-sm font-bold text-white"
            >
              Solicitar entrada no grupo
            </a>
          )}
          {showInviteAction && !hasLink && (
            <p className="mt-2 text-xs text-muted">
              O link deste grupo será liberado pela secretaria após o pagamento.
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
