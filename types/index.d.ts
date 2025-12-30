/**
 * @lando/core TypeScript Type Definitions
 *
 * Foundational types for the Lando core library.
 * These types are designed for gradual adoption - start with loose types
 * and tighten as the codebase migrates to TypeScript.
 */

import type {EventEmitter} from 'events';
import type {Logger as WinstonLogger} from 'winston';
import type Dockerode from 'dockerode';
import type {LoDashStatic} from 'lodash';

// =============================================================================
// Utility Types
// =============================================================================

/** Generic object type for configuration objects */
export type LandoConfig = Record<string, unknown>;

/** Promise type used throughout Lando (Bluebird-compatible) */
export type LandoPromise<T> = Promise<T> & {
  filter<S extends T>(predicate: (value: T) => value is S): LandoPromise<S[]>;
  filter(predicate: (value: T) => boolean): LandoPromise<T[]>;
  map<U>(mapper: (value: T) => U | PromiseLike<U>): LandoPromise<U[]>;
  each<U>(iterator: (value: T) => U | PromiseLike<U>): LandoPromise<T[]>;
  reduce<U>(reducer: (memo: U, value: T) => U | PromiseLike<U>, initialValue: U): LandoPromise<U>;
};

/** Bootstrap levels for Lando initialization */
export type BootstrapLevel = 'config' | 'tasks' | 'engine' | 'app';

/** Service API versions */
export type ServiceApi = 3 | 4;

// =============================================================================
// Plugin Types
// =============================================================================

/** Plugin metadata returned by plugin discovery */
export interface PluginMetadata {
  name: string;
  path: string;
  dir: string;
  searchDir: string;
  data?: Record<string, unknown>;
}

/** Plugin configuration from plugin.yml */
export interface PluginConfig {
  name: string;
  version?: string;
  description?: string;
  deprecated?: boolean;
  hidden?: boolean;
  installer?: string;
  releaseChannel?: string;
  legacyPlugin?: boolean;
}

/** Loaded plugin with all metadata */
export interface LoadedPlugin extends PluginMetadata {
  manifest?: PluginConfig;
  enabled?: boolean;
  type?: 'core' | 'contrib' | 'custom';
}

// =============================================================================
// Event Types
// =============================================================================

/** Event listener function signature */
export type EventListener = (...args: unknown[]) => void | Promise<void>;

/** Priority-based event listener entry */
export interface PriorityListener {
  name: string;
  priority: number;
  fn: EventListener;
}

/** AsyncEvents class - priority-based event emitter */
export interface AsyncEvents extends EventEmitter {
  _log: Log;
  _listeners: PriorityListener[];

  /**
   * Register an event listener with priority
   * @param name Event name
   * @param priority Priority (lower = earlier, default: 5)
   * @param fn Listener function
   */
  on(name: string, priority: number, fn: EventListener): this;
  on(name: string, fn: EventListener): this;

  /**
   * Emit an event and wait for all listeners to complete
   * Returns a promise that resolves when all listeners have finished
   */
  emit(event: string, ...args: unknown[]): Promise<boolean>;
}

// =============================================================================
// Logger Types
// =============================================================================

/** Log levels supported by Lando */
export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';

/** Logger configuration options */
export interface LoggerOptions {
  logDir?: string;
  logLevel?: LogLevel;
  logLevelConsole?: LogLevel;
  logName?: string;
  extra?: Record<string, unknown>;
}

/** Lando Logger - extends Winston Logger */
export interface Log extends WinstonLogger {
  sanitizedKeys: string[];
  alsoSanitize(key: string): void;
}

// =============================================================================
// Shell Types
// =============================================================================

/** Shell execution mode */
export type ShellMode = 'exec' | 'spawn' | 'attach';

/** Shell execution options */
export interface ShellOptions {
  mode?: ShellMode;
  detached?: boolean;
  cwd?: string;
  cstdio?: unknown;
  silent?: boolean;
  env?: Record<string, string>;
}

/** Running process info */
export interface RunningProcess {
  id: string;
  cmd: string;
  process: unknown;
}

/** Shell class for executing commands */
export interface Shell {
  log: Log;
  running: RunningProcess[];

  /** Get list of running processes */
  get(): RunningProcess[];

  /**
   * Execute a shell command
   * @param cmd Command to execute (string or array)
   * @param opts Execution options
   * @returns Promise resolving to stdout
   */
  sh(cmd: string | string[], opts?: ShellOptions): Promise<string>;

  /**
   * Find command in PATH
   * @param cmd Command name
   * @returns Full path or null if not found
   */
  which(cmd: string): string | null;
}

// =============================================================================
// Docker/Daemon Types
// =============================================================================

/** Docker version information */
export interface DockerVersions {
  compose: string;
  desktop?: string;
  engine: string;
}

/** Docker compatibility status */
export interface DockerCompatibility {
  compose: boolean;
  engine: boolean;
  desktop?: boolean;
  version: DockerVersions;
}

/** LandoDaemon class - Docker daemon management */
export interface LandoDaemon {
  cache: Cache;
  events: AsyncEvents;
  docker: Landerode;
  log: Log;
  context: string;
  compose: unknown;
  orchestratorVersion: string;
  userConfRoot: string;
  isRunning: boolean;
  platform: NodeJS.Platform;
  scriptsDir: string;

  /** Start the Docker daemon */
  up(retry?: number, password?: string): Promise<boolean>;

  /** Stop the Docker daemon */
  down(): Promise<boolean>;

  /** Check if daemon is running */
  isUp(): Promise<boolean>;

  /** Get Docker component versions */
  getVersions(): Promise<DockerVersions>;
}

/** Extended Dockerode client */
export interface Landerode extends Dockerode {
  // Lando-specific extensions
}

// =============================================================================
// Engine Types
// =============================================================================

/** Container run options */
export interface RunOptions {
  id: string;
  cmd: string | string[];
  compose?: unknown[];
  project?: string;
  opts?: {
    user?: string;
    environment?: Record<string, string>;
    workdir?: string;
    services?: string[];
    autoRemove?: boolean;
    cstdio?: boolean;
    silent?: boolean;
    prestart?: boolean;
    detach?: boolean;
  };
}

/** Container build options */
export interface BuildOptions {
  compose?: unknown[];
  project?: string;
  opts?: {
    services?: string[];
    noCache?: boolean;
    pull?: boolean;
  };
}

/** Engine class - Docker operations wrapper */
export interface Engine {
  docker: Landerode;
  daemon: LandoDaemon;
  compose: (...args: unknown[]) => Promise<unknown>;
  engineCmd: string;
  composeInstalled: boolean;
  dockerInstalled: boolean;
  separator: string;
  supportedVersions: {
    compose: string[];
    engine: string[];
    desktop?: string[];
  };
  platform: NodeJS.Platform;

  /** Build service images */
  build(data: BuildOptions): Promise<unknown>;

  /** Create a Docker network */
  createNetwork(name: string, opts?: Dockerode.NetworkCreateOptions): Promise<unknown>;

  /** Destroy containers */
  destroy(data: { compose?: unknown[]; project?: string; opts?: { purge?: boolean } }): Promise<unknown>;

  /** Check if container exists */
  exists(data: { id?: string; project?: string; service?: string }): Promise<boolean>;

  /** Get Docker compatibility info */
  getCompatibility(): Promise<DockerCompatibility>;

  /** Get a network by name */
  getNetwork(name: string): Dockerode.Network;

  /** Get all networks */
  getNetworks(opts?: object): Promise<Dockerode.NetworkInspectInfo[]>;

  /** Check if container is running */
  isRunning(id: string): Promise<boolean>;

  /** List containers */
  list(data?: { project?: string; all?: boolean }): Promise<unknown[]>;

  /** Get container logs */
  logs(data: { compose?: unknown[]; project?: string; opts?: object }): Promise<unknown>;

  /** Run a command in container */
  run(data: RunOptions): Promise<unknown>;

  /** Scan container for open ports */
  scan(data: { id: string }): Promise<unknown>;

  /** Start containers */
  start(data: { compose?: unknown[]; project?: string; opts?: object }): Promise<unknown>;

  /** Stop containers */
  stop(data: { compose?: unknown[]; project?: string; opts?: object }): Promise<unknown>;
}

// =============================================================================
// Cache Types
// =============================================================================

/** Cache configuration */
export interface CacheConfig {
  log?: Log;
  cacheDir?: string;
}

/** Cache class for storing data */
export interface Cache {
  log?: Log;
  cacheDir: string;

  /** Get cached value */
  get(key: string): unknown;

  /** Set cached value */
  set(key: string, value: unknown, opts?: { persist?: boolean }): void;

  /** Remove cached value */
  remove(key: string): void;
}

// =============================================================================
// Factory Types
// =============================================================================

/** Builder registration entry */
export interface BuilderEntry {
  api: ServiceApi;
  name: string;
  builder: new (...args: unknown[]) => unknown;
  config?: Record<string, unknown>;
}

/** Factory class - builder registry */
export interface Factory {
  registry: BuilderEntry[];

  /**
   * Add a builder to the registry
   * @param item Name or registration object
   * @param data Builder class or additional data
   */
  add(item: string | Partial<BuilderEntry>, data?: unknown): void;

  /**
   * Get a builder by name
   * @param name Builder name
   * @param api API version (default: 3)
   * @returns Builder class or undefined
   */
  get(name: string, api?: ServiceApi): (new (...args: unknown[]) => unknown) | undefined;

  /**
   * Get raw builder entry
   * @param name Builder name
   * @param api API version (default: 3)
   * @returns Builder entry or undefined
   */
  getRaw(name: string, api?: ServiceApi): BuilderEntry | undefined;
}

// =============================================================================
// App Types
// =============================================================================

/** Service info structure */
export interface ServiceInfo {
  service: string;
  urls?: string[];
  type?: string;
  healthy?: boolean | string;
  via?: string;
  webroot?: string;
  config?: Record<string, unknown>;
  version?: string;
  meUser?: string;
  hasCerts?: boolean;
  api?: ServiceApi;
  hostnames?: string[];
}

/** Health check definition */
export interface HealthCheck {
  service: string;
  command: string;
  retry?: number;
  delay?: number;
}

/** Tooling command definition */
export interface ToolingCommand {
  service?: string;
  cmd?: string | string[];
  user?: string;
  description?: string;
  options?: Record<string, unknown>;
  env?: Record<string, string>;
  dir?: string;
  stdio?: string | string[];
}

/** App message for user feedback */
export interface AppMessage {
  id: string;
  title: string;
  detail?: string[];
  type?: 'tip' | 'warning' | 'error' | 'info';
  url?: string;
}

/** App configuration from .lando.yml */
export interface AppConfig {
  name: string;
  recipe?: string;
  config?: Record<string, unknown>;
  proxy?: Record<string, string[]>;
  services?: Record<string, unknown>;
  tooling?: Record<string, ToolingCommand>;
  events?: Record<string, string | string[]>;
  env_file?: string[];
  excludes?: string[];
  keys?: string | string[];
}

/** App class - project context */
export interface App {
  // Identity
  name: string;
  project: string;
  id: string;
  _dir: string;
  root: string;

  // Configuration
  config: AppConfig;
  configFiles: string[];
  configHash: string;
  _config: LandoConfig;

  // Service management
  _serviceApi: ServiceApi;
  _defaultService: string;
  ComposeService: new (...args: unknown[]) => unknown;
  info: ServiceInfo[];
  checks: HealthCheck[];
  nonRoot: string[];

  // Lando integration
  _lando: Lando;
  engine: Engine;
  events: AsyncEvents;
  log: Log;
  shell: Shell;
  metrics: unknown;
  Promise: typeof Promise;

  // Runtime state
  env: Record<string, string>;
  labels: Record<string, string>;
  opts: Record<string, unknown>;
  plugins: LoadedPlugin[];
  tasks: unknown[];
  messages: AppMessage[];
  warnings: AppMessage[];
  scanUrls: string[];

  // Cache
  metaCache: string;
  meta: Record<string, unknown>;

  // Methods
  /** Add service to the app */
  add(data: unknown, front?: boolean): App;

  /** Add a message for user feedback */
  addMessage(message: AppMessage, opts?: { cached?: boolean }): void;

  /** Add a warning message */
  addWarning(warning: AppMessage, opts?: { cached?: boolean }): void;

  /** Destroy the app (remove all containers and volumes) */
  destroy(): Promise<void>;

  /** Initialize the app */
  init(): Promise<App>;

  /** Rebuild the app containers */
  rebuild(): Promise<void>;

  /** Reset the app to initial state */
  reset(): Promise<void>;

  /** Restart the app */
  restart(): Promise<void>;

  /** Run tooling commands */
  runTasks(tasks?: unknown[], options?: object): Promise<unknown>;

  /** Start the app */
  start(): Promise<void>;

  /** Stop the app */
  stop(): Promise<void>;

  /** Uninstall the app completely */
  uninstall(purge?: boolean): Promise<void>;
}

// =============================================================================
// Lando Types
// =============================================================================

/** Lando configuration options */
export interface LandoOptions {
  // Core settings
  configSources?: string[];
  envPrefix?: string;
  landoFile?: string;
  landoFileConfig?: Record<string, unknown>;
  preLandoFiles?: string[];
  postLandoFiles?: string[];
  userConfRoot?: string;

  // Feature flags
  experimental?: boolean;
  fatcore?: boolean;
  networking?: boolean;
  plugins?: Record<string, unknown>;

  // Docker settings
  bindAddress?: string;
  caCert?: string;
  caDomain?: string;
  composeBin?: string;
  dockerBin?: string;
  dockerBinDir?: string;
  orchestratorBin?: string;
  orchestratorSeparator?: string;
  orchestratorVersion?: string;

  // Runtime settings
  disablePlugins?: string[];
  domain?: string;
  maxKeyWarning?: number;
  mode?: string;
  pluginDirs?: string[];
  proxyBindAddress?: string;
  proxyDash?: string;
  proxyHttpPort?: string | number;
  proxyHttpsPort?: string | number;
  proxyIp?: string;
  proxyName?: string;

  // Logging
  logDir?: string;
  logLevel?: LogLevel;
  logLevelConsole?: LogLevel;
}

/** Setup status for individual components */
export interface SetupStatus {
  name: string;
  installed: boolean;
  version?: string;
  error?: string;
}

/** Plugin installation status */
export interface PluginInstallStatus {
  name: string;
  installed: boolean;
  version?: string;
  error?: string;
}

/** Lando class - main orchestrator */
export interface Lando {
  // Bootstrap state
  BOOTSTRAP_LEVELS: Record<BootstrapLevel, number>;
  _bootstrapLevel: number;

  // Configuration
  config: LandoConfig & LandoOptions;

  // Core services
  Promise: LandoPromise<unknown> & typeof Promise;
  cache: Cache;
  log: Log;
  error: unknown;
  events: AsyncEvents;
  tasks: unknown[];
  user: unknown;
  updates: unknown;
  factory: Factory;
  plugins: unknown;
  versions: DockerVersions;
  debuggy?: unknown;
  metrics?: unknown;

  // Engine (available after engine bootstrap)
  engine?: Engine;
  daemon?: LandoDaemon;

  /**
   * Bootstrap Lando to a specific level
   * @param level Bootstrap level (default: 'app')
   */
  bootstrap(level?: BootstrapLevel): Promise<Lando>;

  /**
   * Generate SSL certificate for a domain
   * @param domains Domain(s) to generate cert for
   */
  generateCert(domains: string | string[]): Promise<{ key: string; cert: string }>;

  /**
   * Get an App instance for a directory
   * @param name App name
   * @param warn Whether to warn about missing files
   */
  getApp(name?: string, warn?: boolean): App;

  /**
   * Get status of installed plugins
   */
  getInstallPluginsStatus(): Promise<PluginInstallStatus[]>;

  /**
   * Install plugins
   * @param plugins Plugin names to install
   */
  installPlugins(plugins: string[]): Promise<void>;

  /**
   * Reload plugins from disk
   */
  reloadPlugins(): Promise<void>;

  /**
   * Run CLI tasks
   * @param tasks Tasks to run
   */
  runTasks(tasks?: unknown[]): Promise<void>;

  /**
   * Run setup wizard
   */
  setup(): Promise<void>;

  /**
   * Get setup status for all components
   */
  getSetupStatus(): Promise<SetupStatus[]>;
}

// =============================================================================
// Utility Function Types
// =============================================================================

/** getLodash return type - extended lodash with custom utilities */
export interface LandoLodash extends LoDashStatic {
  // Add any custom lodash extensions here
}

// =============================================================================
// Hook & Task Types
// =============================================================================

/** Hook function signature */
export type HookFunction = (app: App, lando: Lando) => void | Promise<void>;

/** Task handler function signature */
export type TaskHandler = (options: Record<string, unknown>, app?: App, lando?: Lando) => unknown | Promise<unknown>;

/** Task definition */
export interface TaskDefinition {
  command: string;
  describe?: string;
  usage?: string;
  examples?: Array<{ usage: string; description: string }>;
  options?: Record<string, {
    describe?: string;
    alias?: string | string[];
    default?: unknown;
    type?: 'string' | 'boolean' | 'number' | 'array';
    choices?: unknown[];
    required?: boolean;
  }>;
  level?: 'app' | 'engine' | 'tasks';
  run: TaskHandler;
}

// =============================================================================
// Builder Types
// =============================================================================

/** Base service configuration */
export interface ServiceConfig {
  name?: string;
  type?: string;
  api?: ServiceApi;
  app?: string;
  confDest?: string;
  home?: string;
  port?: string | number;
  root?: string;
  ssl?: boolean;
  sslExpose?: boolean;
  userConfRoot?: string;
  version?: string;
  via?: string;
  webroot?: string;
}

/** Compose service configuration */
export interface ComposeServiceConfig extends ServiceConfig {
  services?: Record<string, unknown>;
  networks?: Record<string, unknown>;
  volumes?: Record<string, unknown>;
}

// =============================================================================
// Module Declarations
// =============================================================================

declare module '@lando/core' {
  export const Lando: new (options?: LandoOptions) => Lando;
  export function getLodash(): LandoLodash;
}
