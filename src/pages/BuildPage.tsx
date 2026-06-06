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
 * (no localStorage), nothing is URL-encoded, no telemetry. Secret values are
 * masked before reaching the preview and never promoted to a shared store —
 * each instance owns its own value model. Downloads go out as Blobs (#12).
 */
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import type { MessageKey } from '../i18n';
import type { FormValues, ScalarValue } from '../core';
import type { TaskScope } from '../core/tasks/types';
import { Form, initialValues, secretFieldNames, type FormMessages, type Translate } from '../components/form';
import { PreviewPane, renderPreview, type PreviewMessages } from '../core/preview';
import { downloadText, downloadBlob } from '../components/output';
import { composeTree } from '../core/output/compose';
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

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export function BuildPage() {
  const { t, locale } = useTranslation();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [nextId, setNextId] = useState(1);
  const [pick, setPick] = useState('');
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

  const addTask = () => {
    const mod = getTaskModule(pick);
    if (!mod) return;
    const scope: TaskScope = mod.definition.defaultScope ?? { kind: 'group', name: 'all' };
    setInstances((prev) => [
      ...prev,
      { id: nextId, slug: pick, scope: { ...scope }, values: initialValues(mod.definition.schema) },
    ]);
    setNextId((n) => n + 1);
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

  return (
    <section className="page page--build" aria-labelledby="build-title">
      <p>
        <Link to="/">{t('task.backToHome')}</Link>
      </p>
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
              onClick={() =>
                downloadBlob(
                  new Blob([makeZip(tree.files.map((f) => ({ path: f.path, content: f.content })))], {
                    type: 'application/zip',
                  }),
                  'ansible-vars.zip',
                )
              }
            >
              {t('output.downloadLabel')} (.zip)
            </button>
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
            </div>
          ))
        )}
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

  const preview = useMemo(() => {
    let scope: FormValues = instance.values;
    if (secrets.size > 0) {
      scope = { ...instance.values };
      for (const name of secrets) {
        const v = scope[name];
        if (v !== undefined && v !== '') scope[name] = SECRET_MASK as ScalarValue;
      }
    }
    return renderPreview(template, scope, registry);
  }, [template, instance.values, secrets]);

  return (
    <div className="build__instance">
      <div className="build__instance-header">
        <h2 className="build__instance-title">{mod.definition.title}</h2>
        <button type="button" className="build__remove" onClick={onRemove}>
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
          initialValues={initial}
          onChange={onValues}
        />
        <PreviewPane result={preview} messages={previewMessages} />
      </div>
    </div>
  );
}
