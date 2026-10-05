"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  ArchiveRestore,
  Bell,
  Bot,
  Brain,
  Cpu,
  EyeOff,
  FileText,
  Gauge,
  GlobeLock,
  Image,
  Info,
  Languages,
  Layers3,
  MessageSquare,
  Monitor,
  Moon,
  Pencil,
  Plug,
  Plus,
  SlidersHorizontal,
  Sun,
  ThermometerSun,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { ThemePreference } from "@/hooks/useTheme";
import type { Locale, LocalePlugin } from "@/lib/i18n/types";
import { formatRelativeTime } from "@/lib/i18n/format";
import { readArchivedSessionIds, writeArchivedSessionIds } from "@/lib/archived-sessions";
import { sidebarSessionTitle } from "@/lib/codex-sidebar-search";
import type { ProjectPreference } from "@/lib/project-registry";
import type { SessionInfo } from "@/lib/types";
import { ModelsConfig } from "./ModelsConfig";
import { ModelScopePanel } from "./ModelScopePanel";
import type { ModelsDraftController } from "./models-config/models-config-types";
import type { SettingsSectionController } from "./resource-settings/resource-settings-types";
import { PluginsConfig } from "./PluginsConfig";
import { SkillsConfig } from "./SkillsConfig";
import { SubagentsConfig } from "./SubagentsConfig";
import { RemoteAccessConfig, type RemoteDraftController } from "./RemoteAccessConfig";
import { DialogShell } from "./DialogShell";
import {
  isThinkingExpandedByDefault,
  setThinkingExpandedByDefault,
} from "@/lib/thinking-expansion-preference";

type SettingsSection = "general" | "remote" | "archived" | "models" | "skills" | "plugins" | "subagents";

// Pi 0.86's cache-warming profiles (CACHE_WARMING_MODES); "idle" also warms between agent runs.
type CacheWarmingMode = "off" | "streaming" | "idle";

const CACHE_WARMING_OPTIONS: CacheWarmingMode[] = ["off", "streaming", "idle"];

const CACHE_WARMING_LABELS: Record<CacheWarmingMode, string> = {
  off: "settings.cacheWarmingOff",
  streaming: "settings.cacheWarmingStreaming",
  idle: "settings.cacheWarmingIdle",
};

interface Props {
  cwd: string | null;
  sessionId: string | null;
  themePreference: ThemePreference;
  onThemeChange: (preference: ThemePreference) => void;
  locale: Locale;
  supportedLocales: LocalePlugin[];
  onLocaleChange: (locale: Locale) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  tokenSpeedEnabled: boolean;
  onTokenSpeedToggle: () => void;
  hideActivity: boolean;
  onHideActivityToggle: () => void;
  quoteSelectionEnabled: boolean;
  onQuoteSelectionChange: (enabled: boolean) => void;
  onClose: () => void;
  onModelsChanged: () => void;
  onSessionReloaded: () => void;
  onProjectsChanged: () => void;
  onRegisterSettingsBack: (handler: () => boolean) => void;
}

function SectionIcon({ section }: { section: SettingsSection }) {
  const icons = {
    general: SlidersHorizontal,
    remote: GlobeLock,
    archived: Archive,
    models: Cpu,
    skills: Layers3,
    plugins: Plug,
    subagents: Bot,
  };
  const Icon = icons[section];
  return <Icon size={16} strokeWidth={1.8} aria-hidden="true" />;
}

export function SettingsPage({
  cwd,
  sessionId,
  themePreference,
  onThemeChange,
  locale,
  supportedLocales,
  onLocaleChange,
  soundEnabled,
  onSoundToggle,
  tokenSpeedEnabled,
  onTokenSpeedToggle,
  hideActivity,
  onHideActivityToggle,
  quoteSelectionEnabled,
  onQuoteSelectionChange,
  onClose,
  onModelsChanged,
  onSessionReloaded,
  onProjectsChanged,
  onRegisterSettingsBack,
}: Props) {
  const { t } = useI18n();
  const [section, setSection] = useState<SettingsSection>("general");
  const [projects, setProjects] = useState<ProjectPreference[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [archivedSessionIds, setArchivedSessionIds] = useState<Set<string>>(() => new Set());
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [restoringProjects, setRestoringProjects] = useState<Set<string>>(new Set());
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [modelsController, setModelsController] = useState<ModelsDraftController | null>(null);
  const [skillsController, setSkillsController] = useState<SettingsSectionController | null>(null);
  const [pluginsController, setPluginsController] = useState<SettingsSectionController | null>(null);
  const [remoteController, setRemoteController] = useState<RemoteDraftController | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [pendingExit, setPendingExit] = useState<(() => void) | null>(null);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);
  const [cacheWarmingMode, setCacheWarmingMode] = useState<CacheWarmingMode | null>(null);
  const [imageAutoResize, setImageAutoResize] = useState<boolean | null>(null);

  useEffect(() => {
    setThinkingExpanded(isThinkingExpandedByDefault());
  }, []);

  // Cache warming lives in pi's global settings, not in browser storage.
  useEffect(() => {
    let cancelled = false;
    const query = cwd ? `?cwd=${encodeURIComponent(cwd)}` : "";
    fetch(`/api/cache-warming${query}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { mode?: CacheWarmingMode } | null) => {
        if (!cancelled && data?.mode) setCacheWarmingMode(data.mode);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cwd]);

  useEffect(() => {
    let cancelled = false;
    const query = cwd ? `?cwd=${encodeURIComponent(cwd)}` : "";
    fetch(`/api/image-resize${query}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { enabled?: boolean } | null) => {
        if (!cancelled && typeof data?.enabled === "boolean") setImageAutoResize(data.enabled);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cwd]);

  const handleCacheWarmingChange = useCallback((mode: CacheWarmingMode) => {
    setCacheWarmingMode(mode);
    // The route also applies the mode to live sessions, so no restart is needed.
    fetch("/api/cache-warming", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, cwd: cwd ?? undefined }),
    }).catch(() => {});
  }, [cwd]);

  const handleImageAutoResizeChange = useCallback(() => {
    if (imageAutoResize === null) return;
    const enabled = !imageAutoResize;
    setImageAutoResize(enabled);
    fetch("/api/image-resize", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, cwd: cwd ?? undefined }),
    }).then((response) => {
      if (!response.ok) setImageAutoResize(!enabled);
    }).catch(() => setImageAutoResize(!enabled));
  }, [cwd, imageAutoResize]);

  const close = useCallback(() => {
    onModelsChanged();
    onClose();
  }, [onClose, onModelsChanged]);

  // One exit-request path: every Settings close/navigation action goes through
  // here so unsaved custom model drafts are never lost silently.
  const requestCloseOrNavigate = useCallback((action: () => void) => {
    if (modelsController?.dirty || remoteController?.dirty) {
      setPendingExit(() => action);
      setDiscardDialogOpen(true);
    } else {
      action();
    }
  }, [modelsController, remoteController]);

  const handleDiscardConfirm = useCallback(() => {
    const action = pendingExit;
    setDiscardDialogOpen(false);
    setPendingExit(null);
    setModelsController(null);
    setRemoteController(null);
    modelsController?.discard();
    remoteController?.discard();
    action?.();
  }, [modelsController, pendingExit, remoteController]);

  const activeController = section === "models"
    ? modelsController
    : section === "skills"
      ? skillsController
      : section === "plugins"
        ? pluginsController
        : section === "remote"
          ? remoteController
          : null;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (discardDialogOpen) return; // native <dialog> handles its own Escape
      if (activeController?.handleBack()) return;
      requestCloseOrNavigate(close);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeController, close, discardDialogOpen, requestCloseOrNavigate]);

  const handleSettingsBack = useCallback((): boolean => {
    if (activeController?.handleBack()) return true;
    if (modelsController?.dirty || remoteController?.dirty) {
      setPendingExit(() => close);
      setDiscardDialogOpen(true);
      return true;
    }
    return false;
  }, [activeController, close, modelsController, remoteController]);

  useEffect(() => {
    onRegisterSettingsBack(handleSettingsBack);
  }, [onRegisterSettingsBack, handleSettingsBack]);

  const loadProjects = useCallback(async (clearError = true) => {
    setProjectsLoading(true);
    if (clearError) setProjectsError(null);
    try {
      const [projectsResponse, sessionsResponse] = await Promise.all([
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/sessions", { cache: "no-store" }),
      ]);
      if (!projectsResponse.ok) throw new Error(`HTTP ${projectsResponse.status}`);
      const projectData = await projectsResponse.json() as { projects: ProjectPreference[] };
      setProjects(projectData.projects);
      if (sessionsResponse.ok) {
        const sessionData = await sessionsResponse.json() as { sessions: SessionInfo[] };
        setSessions(sessionData.sessions);
      }
      setArchivedSessionIds(readArchivedSessionIds());
    } catch (cause) {
      setProjectsError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === "archived") void loadProjects();
  }, [loadProjects, section]);

  const restoreProject = useCallback(async (path: string) => {
    if (restoringProjects.has(path)) return;
    setRestoringProjects((current) => new Set(current).add(path));
    setProjectsError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, update: { archived: false } }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setProjects((current) => current.map((project) => project.path === path ? { ...project, archived: false } : project));
      onProjectsChanged();
    } catch (cause) {
      setProjectsError(cause instanceof Error ? cause.message : String(cause));
      void loadProjects(false);
    } finally {
      setRestoringProjects((current) => {
        const next = new Set(current);
        next.delete(path);
        return next;
      });
    }
  }, [loadProjects, onProjectsChanged, restoringProjects]);

  const restoreSession = useCallback((id: string) => {
    setArchivedSessionIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      writeArchivedSessionIds(next);
      return next;
    });
    onProjectsChanged();
  }, [onProjectsChanged]);

  const sections: { id: SettingsSection; label: string; disabled: boolean }[] = [
    { id: "general", label: t("settings.general"), disabled: false },
    { id: "archived", label: t("sidebar.archived"), disabled: false },
    { id: "models", label: t("common.models"), disabled: false },
    { id: "skills", label: t("common.skills"), disabled: !cwd },
    { id: "plugins", label: t("common.plugins"), disabled: !cwd },
    { id: "subagents", label: t("common.subagents"), disabled: !cwd },
    { id: "remote", label: t("remote.nav"), disabled: false },
  ];

  let content: ReactNode;
  if (section === "general") {
    const themes: { id: ThemePreference; label: string; Icon: typeof Sun }[] = [
      { id: "light", label: t("settings.themeLight"), Icon: Sun },
      { id: "dark", label: t("settings.themeDark"), Icon: Moon },
      { id: "auto", label: t("settings.themeSystem"), Icon: Monitor },
    ];
    content = (
      <div className="settings-form-page">
        <div className="settings-form-heading">
          <SlidersHorizontal size={18} aria-hidden="true" />
          <div><h3>{t("settings.general")}</h3><p>{t("settings.generalDescription")}</p></div>
        </div>
        <section className="settings-form-section">
          <div className="settings-form-label"><Sun size={16} aria-hidden="true" /><div><strong>{t("settings.appearance")}</strong><span>{t("settings.appearanceDescription")}</span></div></div>
          <div className="settings-segmented" role="radiogroup" aria-label={t("settings.appearance")}>
            {themes.map(({ id, label, Icon }) => (
              <button key={id} type="button" role="radio" aria-checked={themePreference === id} data-active={themePreference === id} onClick={() => onThemeChange(id)}>
                <Icon size={15} aria-hidden="true" /><span>{label}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="settings-form-section">
          <label className="settings-form-label" htmlFor="settings-language"><Languages size={16} aria-hidden="true" /><div><strong>{t("common.language")}</strong><span>{t("settings.languageDescription")}</span></div></label>
          <select id="settings-language" value={locale} onChange={(event) => onLocaleChange(event.target.value as Locale)}>
            {supportedLocales.map((plugin) => <option key={plugin.id} value={plugin.id}>{plugin.label}</option>)}
          </select>
        </section>
        <section className="settings-form-section">
          <div className="settings-form-label"><Bell size={16} aria-hidden="true" /><div><strong>{t("settings.completionSound")}</strong><span>{t("settings.completionSoundDescription")}</span></div></div>
          <button className="settings-switch" type="button" role="switch" aria-checked={soundEnabled} onClick={onSoundToggle} title={t("settings.completionSound")}>
            <span /><Volume2 size={15} aria-hidden="true" />
          </button>
        </section>
        <section className="settings-form-section">
          <div className="settings-form-label"><Gauge size={16} aria-hidden="true" /><div><strong>{t("settings.tokenSpeed")}</strong><span>{t("settings.tokenSpeedDescription")}</span></div></div>
          <button className="settings-switch" type="button" role="switch" aria-checked={tokenSpeedEnabled} onClick={onTokenSpeedToggle} title={t("settings.tokenSpeed")}>
            <span /><Gauge size={15} aria-hidden="true" />
          </button>
        </section>
        <section className="settings-form-section">
          <div className="settings-form-label"><Brain size={16} aria-hidden="true" /><div><strong>{t("settings.thinkingDisplay")}</strong><span>{t("settings.thinkingDisplayDescription")}</span></div></div>
          <button className="settings-switch" type="button" role="switch" aria-checked={thinkingExpanded} onClick={() => {
            const next = !thinkingExpanded;
            setThinkingExpandedByDefault(next);
            setThinkingExpanded(next);
          }} title={t("settings.thinkingExpandedDefault")}>
            <span /><Brain size={15} aria-hidden="true" />
          </button>
        </section>
        <section className="settings-form-section">
          <div className="settings-form-label"><EyeOff size={16} aria-hidden="true" /><div><strong>{t("settings.hideActivity")}</strong><span>{t("settings.hideActivityDescription")}</span></div></div>
          <button className="settings-switch" type="button" role="switch" aria-checked={hideActivity} onClick={onHideActivityToggle} title={t("settings.hideActivity")}>
            <span /><EyeOff size={15} aria-hidden="true" />
          </button>
        </section>
        <section className="settings-form-section">
          <div className="settings-form-label"><FileText size={16} aria-hidden="true" /><div><strong>{t("settings.agentStyles")}</strong><span>{t("settings.agentStylesDescription")}</span></div></div>
          <AgentStylesSection />
        </section>
        <section className="settings-form-section">
          <div className="settings-form-label"><ThermometerSun size={16} aria-hidden="true" /><div><strong>{t("settings.cacheWarming")}</strong><span>{t("settings.cacheWarmingDescription")}</span></div></div>
          <div className="settings-segmented" role="radiogroup" aria-label={t("settings.cacheWarming")}>
            {CACHE_WARMING_OPTIONS.map((mode) => (
              <button key={mode} type="button" role="radio" aria-checked={cacheWarmingMode === mode} data-active={cacheWarmingMode === mode} onClick={() => handleCacheWarmingChange(mode)}>
                <span>{t(CACHE_WARMING_LABELS[mode])}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="settings-form-section">
          <div className="settings-form-label"><Image size={16} aria-hidden="true" /><div><strong>{t("settings.imageAutoResize")}</strong><span>{t("settings.imageAutoResizeDescription")}</span></div></div>
          <button className="settings-switch" type="button" role="switch" aria-checked={imageAutoResize === true} onClick={handleImageAutoResizeChange} title={t("settings.imageAutoResize")}>
            <span /><Image size={15} aria-hidden="true" />
          </button>
        </section>
        <section className="settings-form-section">
          <div className="settings-form-label"><MessageSquare size={16} aria-hidden="true" /><div><strong>{t("settings.chat")}</strong><span>{t("settings.quoteSelection")}</span></div></div>
          <button className="settings-switch" type="button" role="switch" aria-checked={quoteSelectionEnabled} onClick={() => onQuoteSelectionChange(!quoteSelectionEnabled)} title={t("settings.quoteSelection")}>
            <span /><MessageSquare size={15} aria-hidden="true" />
          </button>
        </section>
        <section className="settings-form-section">
          <div className="settings-form-label"><Info size={16} aria-hidden="true" /><div><strong>{t("settings.about")}</strong><span>{t("settings.aboutVersion", { web: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0", pi: process.env.NEXT_PUBLIC_PI_VERSION ?? "0.0.0" })}</span></div></div>
        </section>
      </div>
    );
  } else if (section === "archived") {
    const archivedProjects = projects.filter((project) => project.archived && !project.removed);
    const archivedSessions = sessions.filter((session) => archivedSessionIds.has(session.id) && session.sessionRole !== "subagent");
    const archivedEmpty = archivedProjects.length === 0 && archivedSessions.length === 0;
    content = (
      <div className="settings-form-page">
        <div className="settings-form-heading"><Archive size={18} aria-hidden="true" /><div><h3>{t("sidebar.archived")}</h3><p>{t("settings.archivedEmptyDescription")}</p></div></div>
        {projectsLoading ? (
          <div className="settings-page-empty"><span>{t("sidebar.loading")}</span></div>
        ) : archivedEmpty ? (
          <div className="settings-page-empty"><Archive size={20} aria-hidden="true" /><strong>{t("sidebar.noArchivedProjects")}</strong><span>{t("settings.archivedEmptyDescription")}</span></div>
        ) : (
          <>
            {archivedProjects.length > 0 && (
              <section className="settings-archived-group">
                <h4 className="settings-archived-group-title">
                  {t("sidebar.archivedProjects")}
                  <span className="settings-archived-count">{archivedProjects.length}</span>
                </h4>
                <div className="settings-archived-list">
                  {archivedProjects.map((project) => {
                    const name = project.name ?? project.path.replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? project.path;
                    return (
                      <div className="settings-archived-row" key={project.path}>
                        <div className="settings-archived-item">
                          <strong title={name}>{name}</strong>
                          <span title={project.path}>{project.path}</span>
                        </div>
                        <button
                          type="button"
                          className="settings-archived-action"
                          disabled={restoringProjects.has(project.path)}
                          aria-label={`${t("sidebar.restoreProject")}: ${name}`}
                          onClick={() => void restoreProject(project.path)}
                        >
                          <ArchiveRestore size={14} aria-hidden="true" />{t("sidebar.restoreProject")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {archivedSessions.length > 0 && (
              <section className="settings-archived-group">
                <h4 className="settings-archived-group-title">
                  {t("sidebar.archivedSessions")}
                  <span className="settings-archived-count">{archivedSessions.length}</span>
                </h4>
                <div className="settings-archived-list">
                  {archivedSessions.map((session) => {
                    const title = sidebarSessionTitle(session);
                    return (
                      <div className="settings-archived-row" key={session.id}>
                        <div className="settings-archived-item">
                          <strong title={title}>{title}</strong>
                          <span title={session.cwd}>{session.cwd}</span>
                        </div>
                        <span className="settings-archived-meta">{formatRelativeTime(session.modified, locale)}</span>
                        <button
                          type="button"
                          className="settings-archived-action"
                          aria-label={`${t("sidebar.restoreSession")}: ${title}`}
                          onClick={() => restoreSession(session.id)}
                        >
                          <ArchiveRestore size={14} aria-hidden="true" />{t("sidebar.restoreSession")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
        {projectsError && <div className="settings-inline-error" role="alert">{projectsError}</div>}
      </div>
    );
  } else if (section === "models") {
    content = (
      <div className="settings-models-stack">
        <ModelScopePanel cwd={cwd} onChanged={onModelsChanged} />
        <ModelsConfig onControllerChange={setModelsController} />
      </div>
    );
  } else if (section === "remote") {
    content = <RemoteAccessConfig onControllerChange={setRemoteController} />;
  } else if (!cwd) {
    content = (
      <div className="settings-page-empty">
        <SectionIcon section={section} />
        <strong>{t("settings.projectRequired")}</strong>
        <span>{t("settings.projectRequiredDescription")}</span>
      </div>
    );
  } else if (section === "skills") {
    content = <SkillsConfig cwd={cwd} onControllerChange={setSkillsController} />;
  } else if (section === "subagents") {
    content = <SubagentsConfig cwd={cwd} sessionId={sessionId} onReloaded={onSessionReloaded} />;
  } else {
    content = (
      <PluginsConfig
        cwd={cwd}
        sessionId={sessionId}
        onReloaded={onSessionReloaded}
        onControllerChange={setPluginsController}
      />
    );
  }

  return createPortal(
    <div
      className="settings-page-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-page-title"
      onMouseDown={(event) => { if (event.target === event.currentTarget) requestCloseOrNavigate(close); }}
    >
      <div className="settings-page-shell">
        <header className="settings-page-header">
          <h2 id="settings-page-title">{t("common.settings")}</h2>
          <div className="settings-page-header-actions">
            <button
              ref={closeButtonRef}
              type="button"
              className="settings-page-header-close"
              onClick={() => requestCloseOrNavigate(close)}
              aria-label={t("i18n.close")}
              title={t("i18n.close")}
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="settings-page-layout">
          <nav
            className="settings-page-nav"
            aria-label={t("settings.categories")}
            data-hidden-mobile={activeController?.mobileDetailOpen ? "true" : undefined}
          >
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                data-active={section === item.id}
                disabled={item.disabled}
                title={item.disabled ? t("settings.selectProjectFirst") : item.label}
                onClick={() => requestCloseOrNavigate(() => setSection(item.id))}
              >
                <SectionIcon section={item.id} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <main className="settings-page-content">{content}</main>
        </div>
      </div>
      {discardDialogOpen && (
        <DialogShell
          size="confirm"
          title={t("models.unsavedChanges")}
          ariaLabel={t("models.keepEditing")}
          onClose={() => setDiscardDialogOpen(false)}
          backdropDismissible={false}
          footer={(
            <>
              <button type="button" className="codex-dialog-button" onClick={() => setDiscardDialogOpen(false)}>{t("models.keepEditing")}</button>
              <button type="button" className="codex-dialog-button" data-variant="danger" onClick={handleDiscardConfirm}>{t("models.discard")}</button>
            </>
          )}
        >
          <p className="codex-dialog-copy">{t("models.discardChangesDescription")}</p>
        </DialogShell>
      )}
    </div>,
    document.body,
  );
}

interface AgentStyleEntry {
  id: string;
  name: string;
  content: string;
}

/** Settings CRUD for named AGENTS.md styles (stored in the agent dir).
 * The General tab shows only a manage button; the list and all add/edit/delete
 * actions live inside one dialog (list → form → confirm views, no nested dialogs). */
function AgentStylesSection() {
  const { t } = useI18n();
  const [styles, setStyles] = useState<AgentStyleEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [view, setView] = useState<"list" | "form" | "confirm">("list");
  const [editing, setEditing] = useState<AgentStyleEntry | "create" | null>(null);
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AgentStyleEntry | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/agent-styles")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<{ styles: AgentStyleEntry[] }>;
      })
      .then((data) => setStyles(data.styles))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const notifyChanged = () => window.dispatchEvent(new Event("pi-agent-styles-changed"));

  const closeManage = () => {
    setManageOpen(false);
    setView("list");
    setEditing(null);
    setDeleting(null);
  };

  const openCreate = () => { setView("form"); setEditing("create"); setFormName(""); setFormContent(""); };
  const openEdit = (style: AgentStyleEntry) => { setView("form"); setEditing(style); setFormName(style.name); setFormContent(style.content); };
  const openDelete = (style: AgentStyleEntry) => { setView("confirm"); setDeleting(style); };

  const handleSave = async () => {
    if (saving || editing === null) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/agent-styles", {
        method: editing === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing === "create"
          ? { name: formName, content: formContent }
          : { id: editing.id, name: formName, content: formContent }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setView("list");
      setEditing(null);
      refresh();
      notifyChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/agent-styles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleting.id }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setView("list");
      setDeleting(null);
      refresh();
      notifyChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const iconButtonStyle: CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, flexShrink: 0,
    border: "1px solid var(--border)", borderRadius: 6,
    background: "transparent", color: "var(--text-muted)", cursor: "pointer",
  };

  const fieldStyle: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    fontSize: "var(--text-meta)",
    fontFamily: "var(--font-mono)",
    padding: "6px 8px",
    border: "1px solid var(--border)",
    borderRadius: 6,
    outline: "none",
    background: "var(--bg)",
    color: "var(--text)",
  };

  const labelStyle: CSSProperties = { display: "block", marginBottom: 4, fontSize: "var(--text-meta)", color: "var(--text-dim)" };

  const listBody = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button type="button" className="codex-dialog-button" data-variant="primary" style={{ alignSelf: "flex-start" }} onClick={openCreate}>
        <Plus size={13} strokeWidth={2} aria-hidden="true" style={{ marginRight: 6 }} />
        {t("settings.agentStyleAdd")}
      </button>
      {styles === null ? null : styles.length === 0 ? (
        <div style={{ padding: "4px 0", color: "var(--text-dim)", fontSize: "var(--text-meta)" }}>
          {t("settings.agentStyleNone")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
          {styles.map((style) => (
            <div
              key={style.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px",
                border: "1px solid var(--border)", borderRadius: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }} title={style.name}>
                  {style.name}
                </div>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-dim)" }}>
                  {t("settings.agentStyleChars", { n: style.content.length })}
                </div>
              </div>
              <button type="button" style={iconButtonStyle} title={t("settings.agentStyleEdit")} aria-label={t("settings.agentStyleEdit")} onClick={() => openEdit(style)}>
                <Pencil size={13} strokeWidth={2} aria-hidden="true" />
              </button>
              <button type="button" style={iconButtonStyle} title={t("settings.agentStyleDelete")} aria-label={t("settings.agentStyleDelete")} onClick={() => openDelete(style)}>
                <Trash2 size={13} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <div style={{ color: "var(--error, #ef4444)", fontSize: "var(--text-meta)" }}>{error}</div>}
    </div>
  );

  const formBody = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label style={labelStyle} htmlFor="agent-style-name">
        {t("settings.agentStyleName")}
      </label>
      <input
        id="agent-style-name"
        value={formName}
        onChange={(e) => setFormName(e.target.value)}
        placeholder={t("settings.agentStyleName")}
        maxLength={60}
        autoFocus
        style={fieldStyle}
      />
      <label style={labelStyle} htmlFor="agent-style-content">
        {t("settings.agentStyleContent")}
      </label>
      <textarea
        id="agent-style-content"
        value={formContent}
        onChange={(e) => setFormContent(e.target.value)}
        placeholder={t("settings.agentStyleContent")}
        rows={10}
        style={{ ...fieldStyle, resize: "vertical", minHeight: 160 }}
      />
      {error && <div style={{ color: "var(--error, #ef4444)", fontSize: "var(--text-meta)" }}>{error}</div>}
    </div>
  );

  return (
    <div>
      <button type="button" className="codex-dialog-button" onClick={() => setManageOpen(true)} title={t("settings.agentStyleManage")}>
        {t("settings.agentStyleManage")}
      </button>
      {manageOpen && (
        <DialogShell
          size="editor"
          title={t("settings.agentStyles")}
          ariaLabel={t("settings.agentStyles")}
          onClose={() => (saving ? undefined : closeManage())}
          footer={(
            view === "list" ? (
              <button type="button" className="codex-dialog-button" onClick={closeManage}>{t("settings.agentStyleCancel")}</button>
            ) : view === "form" ? (
              <>
                <button type="button" className="codex-dialog-button" onClick={() => { setView("list"); setEditing(null); }} disabled={saving}>{t("settings.agentStyleCancel")}</button>
                <button type="button" className="codex-dialog-button" data-variant="primary" onClick={() => void handleSave()} disabled={saving || formName.trim().length === 0}>{t("settings.agentStyleSave")}</button>
              </>
            ) : (
              <>
                <button type="button" className="codex-dialog-button" onClick={() => { setView("list"); setDeleting(null); }} disabled={saving}>{t("settings.agentStyleCancel")}</button>
                <button type="button" className="codex-dialog-button" data-variant="danger" onClick={() => void handleDelete()} disabled={saving}>{t("settings.agentStyleDelete")}</button>
              </>
            )
          )}
        >
          {view === "list" ? listBody : view === "form" ? formBody : (
            <p className="codex-dialog-copy">
              {t("settings.agentStyleDeleteQuestion")} — <strong>{deleting?.name}</strong>
            </p>
          )}
        </DialogShell>
      )}
    </div>
  );
}
