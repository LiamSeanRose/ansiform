/**
 * Composition / "build" page (issue #26) — the shaped multi-task session.
 *
 * A tray of independent task instances: pick tasks, fill each (its own Form with
 * its own error summary + managed focus from #4), see each one's own
 * section-delimited device-CLI preview with its fidelity badge (#5), and route
 * each to a scope. The instances are composed into a real `group_vars/`+
 * `host_vars/` **file tree** (#26 core), with key collisions surfaced **visibly**
 * — never a silent merge.
 *
 * Spine: this is a vars-generator, not a config-push tool. Nothing is persisted
 * (no localStorage), and **no field value is ever URL-encoded** — the only thing
 * a link may carry is the task *selection* (slugs), so a coworker can be sent a
 * "fill these" link (#88); values stay out of the URL entirely. No telemetry.
 * Secret values are masked before reaching the preview and never promoted to a
 * shared store — each instance owns its own value model. Downloads go out as
 * Blobs (#12).
 */
import { useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import type { MessageKey } from '../i18n';
import type { FormSchema, FormValues, ScalarValue } from '../core';
import type { TaskScope } from '../core/tasks/types';
import { Form, initialValues, secretFieldNames, type FormMessages, type Translate } from '../components/form';
import { networkWarningMessages } from '../components/form/warning-messages';
import { PreviewPane, renderPreview, withFidelityFloor, type PreviewMessages } from '../core/preview';
import { downloadText, downloadBlob, copyText, SurveyDownloadButton, VarsDiff, RunRecipe, type VarsDiffMessages, type RunRecipeMessages } from '../components/output';
import { parseSharedTasks, buildShareQuery } from '../core/build/share-link';
import { composeTree } from '../core/output/compose';
import { parseVarsYaml } from '../core/output/vars-diff';
import { buildInventory, INVENTORY_FILENAME } from '../core/output/inventory';
import { buildRunRecipe } from '../core/output/run-recipe';
import { buildCombinedSurveySpec } from '../core/output/survey-spec';
import { makeZip } from '../core/output/zip';
import { createSeedRegistry } from '../core/filters/seed';
import { getTaskModule, listTaskSummaries, taskMessages, type TaskModule } from '../tasks/registry';

const registry = createSeedRegistry();
const SECRET_MASK = '********';

interface Instance {
  id: number;
  slug: string;
  scope: TaskScope;
  values: FormValues;
}

/** Build a fresh, empty-valued instance for a known task slug. */
function makeInstance(slug: string, id: number): Instance | null {
  const mod = getTaskModule(slug);
  if (!mod) return null;
  const scope: TaskScope = mod.definition.defaultScope ?? { kind: 'group', name: 'all' };
  return { id, slug, scope: { ...scope }, values: initialValues(mod.definition.schema) };
}

/**
 * Seed the tray from a `?tasks=` deep link (#88) — selection only. Only
 * allowlisted slugs (the registered tasks) are honoured; every other query param
 * is ignored, so no field value can ride in through the URL. Each seeded instance
 * starts with its schema's blank/default values, exactly like an Add-button add.
 */
function seedInstancesFromSearch(search: string): Instance[] {
  const allowed = listTaskSummaries().map((s) => s.slug);
  return parseSharedTasks(search, allowed)
    .map((slug, i) => makeInstance(slug, i + 1))
    .filter((inst): inst is Instance => inst !== null);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export function BuildPage() {
  const { t, locale } = useTranslation();
  const [searchParams] = useSearchParams();
  // Seed once, on mount, from the shared selection (#88) — slugs only, no values.
  const [instances, setInstances] = useState<Instance[]>(() =>
    seedInstancesFromSearch(searchParams.toString()),
  );
  const [nextId, setNextId] = useState(() => instances.length + 1);
  const [pick, setPick] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const pickerId = useId();

  const summaries = listTaskSummaries();

  const formMessages: FormMessages = {
    requiredLabel: t('form.requiredLabel'),
    errorSummaryHeading: t('form.errorSummaryHeading'),
    submitLabel: t('form.submitLabel'),
    errors: {
      required: 'form.error.required',
      pattern: 'form.error.pattern',
      min: 'form.error.min',
      max: 'form.error.max',
      notANumber: 'form.error.notANumber',
      incomplete: 'form.error.incomplete',
    },
  };
  const previewMessages: PreviewMessages = {
    regionLabel: t('preview.regionLabel'),
    heading: t('build.previewHeading'),
    degradedNotice: t('preview.degradedNotice'),
    empty: t('preview.empty'),
  };
  // Per-file merge-into-existing-file diff (#82): each composed file can be
  // diffed against the operator's current version of that same path.
  const varsDiffMessages: VarsDiffMessages = {
    summaryLabel: t('output.varsDiff.summary'),
    description: t('output.varsDiff.description'),
    pasteLabel: t('output.varsDiff.pasteLabel'),
    pasteHelp: t('output.varsDiff.pasteHelp'),
    placeholder: t('output.varsDiff.placeholder'),
    addedLabel: t('output.varsDiff.added'),
    changedLabel: t('output.varsDiff.changed'),
    unchangedLabel: t('output.varsDiff.unchanged'),
    currentLabel: t('output.varsDiff.current'),
    noChanges: t('output.varsDiff.noChanges'),
    blockHeading: t('output.varsDiff.blockHeading'),
    blockNote: t('output.varsDiff.blockNote'),
    copyLabel: t('output.varsDiff.copyLabel'),
    copiedStatus: t('output.varsDiff.copied'),
    copyFailedStatus: t('output.varsDiff.copyFailed'),
    errorTooLarge: t('output.varsDiff.errorTooLarge'),
    errorParse: t('output.varsDiff.errorParse'),
    errorShape: t('output.varsDiff.errorShape'),
    includeKey: t('output.varsDiff.includeKey'),
    noneSelected: t('output.varsDiff.noneSelected'),
  };

  const addTask = () => {
    const inst = makeInstance(pick, nextId);
    if (!inst) return;
    setInstances((prev) => [...prev, inst]);
    setNextId((n) => n + 1);
  };

  // Copy a "fill these tasks" link — the current selection (slugs) only. The link
  // builder is fed slugs and an allowlist, so no field value can be encoded (#88).
  const copyShareLink = async () => {
    const query = buildShareQuery(
      instances.map((inst) => inst.slug),
      summaries.map((s) => s.slug),
    );
    const base =
      typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const ok = await copyText(base + query);
    setShareStatus(ok ? 'copied' : 'failed');
  };

  const updateInstance = (id: number, patch: Partial<Instance>) =>
    setInstances((prev) => prev.map((inst) => (inst.id === id ? { ...inst, ...patch } : inst)));
  const removeInstance = (id: number) =>
    setInstances((prev) => prev.filter((inst) => inst.id !== id));

  const tree = useMemo(() => {
    const composable = instances
      .map((inst) => {
        const mod = getTaskModule(inst.slug);
        return mod ? { schema: mod.definition.schema, values: inst.values, scope: inst.scope } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return composeTree(composable);
  }, [instances]);

  // Inventory skeleton (#81): the group/host structure that makes the composed
  // var files take effect. Derived from the same instances the tree is, so the
  // scaffold matches the files exactly. Empty string ⇒ nothing to place.
  const inventory = useMemo(
    () => buildInventory(instances.filter((inst) => getTaskModule(inst.slug)).map((inst) => inst.scope)),
    [instances],
  );

  // Run recipe (#83): where the composed files sit + the ansible-playbook command,
  // tailored from the scopes entered. Built from the same files/inventory shown,
  // so the guidance matches the set exactly. Null ⇒ nothing to wire yet.
  const runRecipe = useMemo(
    () =>
      buildRunRecipe({
        files: tree.files.map((f) => f.path),
        scopes: instances.filter((inst) => getTaskModule(inst.slug)).map((inst) => inst.scope),
        inventory: inventory ? INVENTORY_FILENAME : undefined,
      }),
    [tree, inventory, instances],
  );
  const runRecipeMessages: RunRecipeMessages = {
    heading: t('output.runRecipe.heading'),
    intro: t('output.runRecipe.intro'),
    layoutLabel: t('output.runRecipe.layoutLabel'),
    commandLabel: t('output.runRecipe.commandLabel'),
    copyLabel: t('output.runRecipe.copyLabel'),
    copiedStatus: t('output.runRecipe.copied'),
    copyFailedStatus: t('output.runRecipe.copyFailed'),
  };

  // One AWX/AAP survey spec spanning the composed set (#33), schema-only.
  const surveySpec = useMemo(
    () =>
      buildCombinedSurveySpec(
        instances
          .map((inst) => getTaskModule(inst.slug)?.definition.schema)
          .filter((s): s is FormSchema => s !== undefined),
      ),
    [instances],
  );

  return (
    <section className="page page--build" aria-labelledby="build-title">
      <h1 id="build-title">{t('build.title')}</h1>
      <p className="lede">{t('build.lede')}</p>

      <div className="build__picker">
        <label htmlFor={pickerId}>{t('build.addLabel')}</label>{' '}
        <select id={pickerId} value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">—</option>
          {summaries.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.title}
            </option>
          ))}
        </select>{' '}
        <button type="button" className="build__add" onClick={addTask} disabled={!pick}>
          {t('build.addButton')}
        </button>
      </div>

      {instances.length > 0 && (
        <div className="build__share">
          <button type="button" className="build__share-link" onClick={copyShareLink}>
            {t('build.shareLink')}
          </button>{' '}
          <span className="build__share-status" role="status" aria-live="polite">
            {shareStatus === 'copied'
              ? t('build.shareCopied')
              : shareStatus === 'failed'
                ? t('build.shareCopyFailed')
                : ''}
          </span>
          <p className="build__share-help muted">{t('build.shareHelp')}</p>
        </div>
      )}

      {instances.length === 0 ? (
        <p className="muted">{t('build.empty')}</p>
      ) : (
        <ol className="build__instances">
          {instances.map((inst) => {
            const mod = getTaskModule(inst.slug);
            if (!mod) return null;
            return (
              <li key={inst.id}>
                <InstanceCard
                  instance={inst}
                  mod={mod}
                  globalT={t}
                  locale={locale}
                  formMessages={formMessages}
                  previewMessages={previewMessages}
                  scopeCopy={{
                    legend: t('build.scopeLegend'),
                    kindLabel: t('build.scopeKindLabel'),
                    group: t('build.scopeKindGroup'),
                    host: t('build.scopeKindHost'),
                    nameLabel: t('build.scopeNameLabel'),
                    remove: t('build.removeTask'),
                  }}
                  onValues={(values) => updateInstance(inst.id, { values })}
                  onScope={(scope) => updateInstance(inst.id, { scope })}
                  onRemove={() => removeInstance(inst.id)}
                />
              </li>
            );
          })}
        </ol>
      )}

      <section className="build__output" aria-labelledby="build-output-heading">
        <div className="build__output-header">
          <h2 id="build-output-heading">{t('build.outputHeading')}</h2>
          {tree.files.length > 0 && (
            <button
              type="button"
              className="build__download-all"
              onClick={() => {
                const entries = tree.files.map((f) => ({ path: f.path, content: f.content }));
                if (inventory) entries.push({ path: INVENTORY_FILENAME, content: inventory });
                downloadBlob(new Blob([makeZip(entries)], { type: 'application/zip' }), 'ansible-vars.zip');
              }}
            >
              {t('output.downloadLabel')} (.zip)
            </button>
          )}
          {inventory && (
            <button
              type="button"
              className="build__download-all"
              onClick={() => downloadText(inventory, INVENTORY_FILENAME, 'text/plain')}
            >
              {t('build.downloadInventory')}
            </button>
          )}
          {surveySpec.spec.length > 0 && (
            <SurveyDownloadButton
              spec={surveySpec}
              label={t('output.awxSurveySpec.label')}
              className="build__download-all"
            />
          )}
        </div>
        {tree.files.length === 0 ? (
          <p className="muted">{t('build.outputEmpty')}</p>
        ) : (
          tree.files.map((file) => (
            <div className="build__file" key={file.path}>
              <div className="build__file-header">
                <code className="build__file-path">{file.path}</code>{' '}
                <button
                  type="button"
                  className="build__download"
                  onClick={() => downloadText(file.content, file.path, 'text/yaml')}
                  aria-label={t('build.downloadFileNamed', { path: file.path })}
                >
                  {t('output.downloadLabel')}
                </button>
              </div>
              {file.collisions.length > 0 && (
                <p className="build__collision" role="status">
                  {t('build.collision', { keys: file.collisions.join(', ') })}
                </p>
              )}
              <pre className="build__yaml" tabIndex={0} aria-label={file.path}>
                {file.content}
              </pre>
              <VarsDiff generated={parseVarsYaml(file.content).vars} messages={varsDiffMessages} />
            </div>
          ))
        )}
        {inventory && (
          <div className="build__file">
            <div className="build__file-header">
              <code className="build__file-path">{INVENTORY_FILENAME}</code>{' '}
              <button
                type="button"
                className="build__download"
                onClick={() => downloadText(inventory, INVENTORY_FILENAME, 'text/plain')}
                aria-label={t('build.downloadFileNamed', { path: INVENTORY_FILENAME })}
              >
                {t('output.downloadLabel')}
              </button>
            </div>
            <p className="build__inventory-note muted">{t('build.inventoryNote')}</p>
            <pre className="build__yaml" tabIndex={0} aria-label={INVENTORY_FILENAME}>
              {inventory}
            </pre>
          </div>
        )}
        {runRecipe && <RunRecipe recipe={runRecipe} messages={runRecipeMessages} />}
      </section>
    </section>
  );
}

interface ScopeCopy {
  legend: string;
  kindLabel: string;
  group: string;
  host: string;
  nameLabel: string;
  remove: string;
}

function InstanceCard({
  instance,
  mod,
  globalT,
  locale,
  formMessages,
  previewMessages,
  scopeCopy,
  onValues,
  onScope,
  onRemove,
}: {
  instance: Instance;
  mod: TaskModule;
  globalT: (key: MessageKey, vars?: Record<string, string | number>) => string;
  locale: string;
  formMessages: FormMessages;
  previewMessages: PreviewMessages;
  scopeCopy: ScopeCopy;
  onValues: (values: FormValues) => void;
  onScope: (scope: TaskScope) => void;
  onRemove: () => void;
}) {
  const ids = useId();
  const { schema, template } = mod.definition;
  const taskCopy = taskMessages(mod, locale as Parameters<typeof taskMessages>[1]);
  const tt: Translate = (key, vars) =>
    key in taskCopy ? interpolate(taskCopy[key], vars) : globalT(key as MessageKey, vars);

  const secrets = useMemo(() => secretFieldNames(schema), [schema]);
  const initial = useMemo(() => initialValues(schema), [schema]);
  // Advisory network-validation copy (#86) for this instance's form fields.
  // Cheap (a handful of t() calls); built inline since `tt` changes each render.
  const warnings = networkWarningMessages(tt);

  const preview = useMemo(() => {
    let scope: FormValues = instance.values;
    if (secrets.size > 0) {
      scope = { ...instance.values };
      for (const name of secrets) {
        const v = scope[name];
        if (v !== undefined && v !== '') scope[name] = SECRET_MASK as ScalarValue;
      }
    }
    // Honesty floor (#40): a task that declares one (e.g. a non-line-CLI platform)
    // never claims exact here either — the build tray degrades like the workbench.
    return withFidelityFloor(
      renderPreview(template, scope, registry),
      mod.definition.fidelityFloor,
    );
  }, [template, instance.values, secrets, mod.definition.fidelityFloor]);

  return (
    <div className="build__instance">
      <div className="build__instance-header">
        <h2 className="build__instance-title">{mod.definition.title}</h2>
        <button
          type="button"
          className="build__remove"
          onClick={onRemove}
          aria-label={globalT('build.removeTaskNamed', { title: mod.definition.title })}
        >
          {scopeCopy.remove}
        </button>
      </div>

      <fieldset className="build__scope">
        <legend>{scopeCopy.legend}</legend>
        <label htmlFor={`${ids}-kind`}>{scopeCopy.kindLabel}</label>{' '}
        <select
          id={`${ids}-kind`}
          value={instance.scope.kind}
          onChange={(e) => onScope({ ...instance.scope, kind: e.target.value as TaskScope['kind'] })}
        >
          <option value="group">{scopeCopy.group}</option>
          <option value="host">{scopeCopy.host}</option>
        </select>{' '}
        <label htmlFor={`${ids}-name`}>{scopeCopy.nameLabel}</label>{' '}
        <input
          id={`${ids}-name`}
          type="text"
          value={instance.scope.name}
          onChange={(e) => onScope({ ...instance.scope, name: e.target.value })}
        />
      </fieldset>

      <div className="build__instance-body">
        <Form
          schema={schema}
          t={tt}
          messages={formMessages}
          warningMessages={warnings}
          initialValues={initial}
          onChange={onValues}
        />
        <PreviewPane result={preview} messages={previewMessages} />
      </div>
    </div>
  );
}
