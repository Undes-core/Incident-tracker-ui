import { useState } from "react";
import type {
  AgentDetailData,
  AgentSkill,
  Autonomy,
  Disposition,
} from "../../api/agents/roster";
import { useUpdateAgent, useUpdateRiskPolicy, useUpdateSkill } from "../../api/agents/mutations";
import { ApiError } from "../../api/client";
import type { RiskLevel } from "../../api/types";
import { CardHeader } from "../shared/CardHeader";
import { RiskBadge } from "../shared/RiskBadge";
import { SegmentedControl } from "../shared/SegmentedControl";
import { SECTION } from "../shared/sectionStyles";
import { ToggleSwitch } from "../shared/ToggleSwitch";

interface AgentDetailProps {
  agent: AgentDetailData;
  onChanged: (agent: AgentDetailData) => void;
}

const AUTONOMY_OPTIONS: ReadonlyArray<{ value: Autonomy; label: string }> = [
  { value: "observe", label: "Observe" },
  { value: "suggest", label: "Suggest" },
  { value: "act_with_approval", label: "Act with approval" },
  { value: "act_autonomously", label: "Act autonomously" },
];

// What each level actually does, in the order they escalate. Written as
// consequences rather than definitions — the operator is choosing an outcome.
const AUTONOMY_HELP: Record<Autonomy, string> = {
  observe: "The agent runs and records its reasoning, and proposes nothing.",
  suggest: "Everything it proposes waits for a person, whatever the risk.",
  act_with_approval: "The per-risk policy below decides, one level at a time.",
  act_autonomously: "Everything runs unattended, subject to the guardrails.",
};

const DISPOSITION_OPTIONS: ReadonlyArray<{ value: Disposition; label: string }> = [
  { value: "auto_run", label: "Auto-run" },
  { value: "ask_first", label: "Ask first" },
  { value: "never", label: "Never" },
];

const DISPOSITION_HELP: Record<Disposition, string> = {
  auto_run: "runs without a human",
  ask_first: "waits in Pending approvals",
  never: "is not proposed at all",
};

const RISK_ORDER: RiskLevel[] = ["HIGH", "MEDIUM", "LOW"];

function useSavingState(onChanged: (agent: AgentDetailData) => void) {
  const [error, setError] = useState<string | null>(null);
  return {
    error,
    clear: () => setError(null),
    onSuccess: (next: AgentDetailData) => {
      setError(null);
      onChanged(next);
    },
    onError: (err: unknown, fallback: string) =>
      setError(err instanceof ApiError ? err.message : fallback),
  };
}

function SkillCard({
  skill,
  agentId,
  onChanged,
}: {
  skill: AgentSkill;
  agentId: string;
  onChanged: (agent: AgentDetailData) => void;
}) {
  // The optimistic value only has to exist while a change is in flight, so it is
  // held as "pending" and the prop is the truth the rest of the time. Mirroring
  // the prop into state instead needed an effect to re-sync on every refetch,
  // which is both a cascading render and a window where the switch disagreed
  // with the server.
  const [pending, setPending] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useUpdateSkill(agentId);
  const enabled = pending ?? skill.enabled;

  function toggle(next: boolean) {
    setError(null);
    setPending(next);
    mutation.mutate(
      { skillId: skill.id, enabled: next },
      {
        onSuccess: (updated) => {
          setPending(null);
          onChanged(updated);
        },
        onError: (err) => {
          setPending(null);
          setError(err instanceof ApiError ? err.message : "Could not change this skill.");
        },
      },
    );
  }

  return (
    <li className="rounded-lg border border-border-soft p-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[13.5px] font-semibold text-foreground">{skill.name}</h4>
            <RiskBadge risk={skill.riskLevel} />
          </div>
          <p className="meta mt-1">
            {[
              skill.serviceName,
              skill.environments.length > 0 ? skill.environments.join(", ") : null,
              skill.actionType,
              `${skill.usage.runs} ${skill.usage.runs === 1 ? "run" : "runs"}` +
                (skill.usage.successPercent !== null
                  ? `, ${skill.usage.successPercent}% ok`
                  : ""),
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
          {skill.description && (
            <p className="mt-2 text-[13px] text-muted-foreground">{skill.description}</p>
          )}
        </div>
        <span className="shrink-0">
          <ToggleSwitch
            label={`${skill.name} enabled`}
            checked={enabled}
            onChange={toggle}
            showStateText={false}
          />
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[12.5px] font-medium text-bad">
          {error}
        </p>
      )}
    </li>
  );
}

export function AgentDetail({ agent, onChanged }: AgentDetailProps) {
  const autonomySaving = useSavingState(onChanged);
  const policySaving = useSavingState(onChanged);
  const autonomyMutation = useUpdateAgent(agent.id);
  const policyMutation = useUpdateRiskPolicy(agent.id);

  const autonomyOptions = AUTONOMY_OPTIONS.map((option) =>
    option.value === "act_autonomously" && !agent.autonomyEnabled
      ? {
          ...option,
          // Disabled and explained, not hidden. An absent option looks like it
          // was never designed; this one is refused for a reason worth reading.
          disabledReason:
            "Off on this server. Acting autonomously removes the human from the loop, " +
            "so it needs AGENT_AUTONOMY_ENABLED set deliberately.",
        }
      : option,
  );

  const enabledSkills = agent.skills.filter((s) => s.enabled).length;
  const context = agent.context.map((c) => `${c.count} ${c.documentType.toLowerCase()}`);

  return (
    <div className="flex flex-col gap-4">
      <section aria-label={`${agent.name} configuration`} className={`${SECTION} shadow-xs`}>
        <CardHeader title={agent.name} meta={`v${agent.version}`} />
        {agent.description && (
          <p className="text-[13.5px] text-muted-foreground">{agent.description}</p>
        )}

        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border-soft pt-3 sm:grid-cols-3">
          <div>
            <dt className="eyebrow">Invoked</dt>
            <dd className="meta mt-0.5 text-foreground">{agent.detail}</dd>
          </div>
          <div>
            <dt className="eyebrow">Context</dt>
            <dd className="meta mt-0.5 text-foreground">
              {context.length > 0 ? context.join(" · ") : "corpus is empty"}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Runs</dt>
            <dd className="meta mt-0.5 text-foreground">
              {agent.runs.total === 0
                ? "never run"
                : `${agent.runs.total} · ${agent.runs.successRatePercent}% ok`}
            </dd>
          </div>
        </dl>

        <p className="mt-3 border-t border-border-soft pt-3 text-[12.5px] text-subtle-foreground">
          {agent.prompt.note}
        </p>
      </section>

      <section aria-label="Autonomy level" className={`${SECTION} shadow-xs`}>
        <CardHeader title="Autonomy level" meta="how far before a human" />
        <SegmentedControl
          label="Autonomy level"
          value={agent.autonomy}
          options={autonomyOptions}
          onChange={(next) => {
            autonomySaving.clear();
            autonomyMutation.mutate(
              { autonomy: next },
              {
                onSuccess: autonomySaving.onSuccess,
                onError: (err) =>
                  autonomySaving.onError(err, "Could not change the autonomy level."),
              },
            );
          }}
        />
        <p className="mt-2.5 text-[13px] text-muted-foreground">
          {AUTONOMY_HELP[agent.autonomy]}
        </p>
        {autonomySaving.error && (
          <p role="alert" className="mt-2 text-[12.5px] font-medium text-bad">
            {autonomySaving.error}
          </p>
        )}

        <div className="mt-4 border-t border-border-soft pt-1">
          {RISK_ORDER.map((level) => {
            const row = agent.riskPolicy.find((p) => p.riskLevel === level);
            const disposition = row?.disposition ?? "ask_first";
            return (
              <div
                key={level}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft py-3 first:border-t-0"
              >
                <span className="flex items-center gap-3">
                  <RiskBadge risk={level} />
                  <span className="text-[13px] text-muted-foreground">
                    {DISPOSITION_HELP[disposition]}
                  </span>
                </span>
                <SegmentedControl
                  label={`${level} risk policy`}
                  value={disposition}
                  options={DISPOSITION_OPTIONS}
                  // Only this row is the risk policy's to decide. At observe or
                  // suggest the level above already answers for every row, so
                  // leaving these live would let an operator set something that
                  // has no effect.
                  disabled={agent.autonomy === "observe" || agent.autonomy === "suggest"}
                  onChange={(next) => {
                    policySaving.clear();
                    policyMutation.mutate(
                      { riskLevel: level, disposition: next },
                      {
                        onSuccess: policySaving.onSuccess,
                        onError: (err) =>
                          policySaving.onError(err, "Could not change this policy."),
                      },
                    );
                  }}
                />
              </div>
            );
          })}
        </div>
        {(agent.autonomy === "observe" || agent.autonomy === "suggest") && (
          <p className="mt-1 text-[12.5px] text-subtle-foreground">
            The autonomy level above already decides every risk level, so these are
            inactive.
          </p>
        )}
        {policySaving.error && (
          <p role="alert" className="mt-2 text-[12.5px] font-medium text-bad">
            {policySaving.error}
          </p>
        )}
      </section>

      {agent.skills.length > 0 && (
        <section aria-label="Skills" className={`${SECTION} shadow-xs`}>
          <CardHeader
            title="Skills"
            meta={`${enabledSkills} of ${agent.skills.length} enabled`}
          />
          <ul className="flex flex-col gap-3">
            {agent.skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                agentId={agent.id}
                onChanged={onChanged}
              />
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-muted-foreground">
            A switched-off skill is not proposed. Runs and success are counted per
            action type, so skills sharing one share these numbers.
          </p>
        </section>
      )}
    </div>
  );
}
