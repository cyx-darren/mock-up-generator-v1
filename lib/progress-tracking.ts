/**
 * Progress Tracking System
 * Real-time progress tracking with WebSocket updates and ETA calculation
 */

export type ProgressState =
  | 'initializing'
  | 'preparing'
  | 'processing'
  | 'finalizing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ProgressUpdate {
  jobId: string;
  state: ProgressState;
  currentStep: number;
  totalSteps: number;
  percentage: number;
  message: string;
  details?: {
    stepName: string;
    stepDescription: string;
    subSteps?: {
      current: number;
      total: number;
    };
  };
  eta?: {
    estimatedTimeRemaining: number; // milliseconds
    estimatedCompletionTime: Date;
    confidence: number; // 0-1
  };
  performance?: {
    stepDuration: number; // milliseconds
    averageStepTime: number;
    throughput: number; // items per second
  };
  timestamp: Date;
}

export interface ProgressSession {
  jobId: string;
  startTime: Date;
  endTime?: Date;
  currentState: ProgressState;
  history: ProgressUpdate[];
  stepTimings: Map<number, number>;
  isPaused: boolean;
  pausedDuration: number;
  resumeCapability: boolean;
  checkpoints: Map<number, any>; // For resume capability
}

export interface ProgressCallbacks {
  onProgress?: (update: ProgressUpdate) => void;
  onStateChange?: (oldState: ProgressState, newState: ProgressState) => void;
  onCompleted?: (session: ProgressSession) => void;
  onError?: (error: Error, session: ProgressSession) => void;
  onEtaUpdate?: (eta: ProgressUpdate['eta']) => void;
}

export class ProgressTracker {
  private sessions = new Map<string, ProgressSession>();
  private callbacks = new Map<string, ProgressCallbacks>();
  private websocketConnections = new Map<string, Set<WebSocket>>();
  private persistenceEnabled: boolean;
  private etaCalculator: ETACalculator;

  constructor(options: { persistenceEnabled?: boolean } = {}) {
    this.persistenceEnabled = options.persistenceEnabled ?? true;
    this.etaCalculator = new ETACalculator();

    if (this.persistenceEnabled) {
      this.loadPersistedSessions();
    }
  }

  /**
   * Create a new progress tracking session
   */
  createSession(jobId: string, totalSteps: number, resumeCapability = false): ProgressSession {
    const session: ProgressSession = {
      jobId,
      startTime: new Date(),
      currentState: 'initializing',
      history: [],
      stepTimings: new Map(),
      isPaused: false,
      pausedDuration: 0,
      resumeCapability,
      checkpoints: new Map(),
    };

    this.sessions.set(jobId, session);

    // Send initial update
    this.updateProgress(jobId, {
      state: 'initializing',
      currentStep: 0,
      totalSteps,
      percentage: 0,
      message: 'Progress tracking initialized',
    });

    if (this.persistenceEnabled) {
      this.persistSession(session);
    }

    return session;
  }

  /**
   * Update progress for a job
   */
  updateProgress(jobId: string, update: Partial<ProgressUpdate>): void {
    const session = this.sessions.get(jobId);
    if (!session) {
      throw new Error(`No progress session found for job ${jobId}`);
    }

    if (session.isPaused) {
      return; // Don't update progress while paused
    }

    const currentStep = update.currentStep ?? 0;
    const totalSteps = update.totalSteps ?? 100;
    const percentage = update.percentage ?? (currentStep / totalSteps) * 100;

    // Calculate ETA
    const eta = this.etaCalculator.calculate(session, currentStep, totalSteps);

    // Track step timing
    if (currentStep > 0 && !session.stepTimings.has(currentStep)) {
      const stepStartTime = session.stepTimings.get(currentStep - 1) || session.startTime.getTime();
      session.stepTimings.set(currentStep, Date.now() - stepStartTime);
    }

    const fullUpdate: ProgressUpdate = {
      jobId,
      state: update.state || session.currentState,
      currentStep,
      totalSteps,
      percentage: Math.min(100, Math.max(0, percentage)),
      message: update.message || `Step ${currentStep} of ${totalSteps}`,
      details: update.details,
      eta,
      performance: this.calculatePerformance(session),
      timestamp: new Date(),
    };

    // Update session
    if (update.state && update.state !== session.currentState) {
      const oldState = session.currentState;
      session.currentState = update.state;
      this.notifyStateChange(jobId, oldState, update.state);
    }

    session.history.push(fullUpdate);

    // Notify callbacks
    this.notifyProgress(jobId, fullUpdate);

    // Send WebSocket update
    this.sendWebSocketUpdate(jobId, fullUpdate);

    // Persist if enabled
    if (this.persistenceEnabled) {
      this.persistSession(session);
    }

    // Check if completed
    if (update.state === 'completed' || percentage >= 100) {
      this.completeSession(jobId);
    }
  }

  /**
   * Register progress callbacks
   */
  registerCallbacks(jobId: string, callbacks: ProgressCallbacks): void {
    this.callbacks.set(jobId, callbacks);
  }

  /**
   * Add WebSocket connection for real-time updates
   */
  addWebSocketConnection(jobId: string, ws: WebSocket): void {
    if (!this.websocketConnections.has(jobId)) {
      this.websocketConnections.set(jobId, new Set());
    }
    this.websocketConnections.get(jobId)!.add(ws);

    // Send current state
    const session = this.sessions.get(jobId);
    if (session && session.history.length > 0) {
      const latestUpdate = session.history[session.history.length - 1];
      ws.send(
        JSON.stringify({
          type: 'progress',
          data: latestUpdate,
        })
      );
    }
  }

  /**
   * Remove WebSocket connection
   */
  removeWebSocketConnection(jobId: string, ws: WebSocket): void {
    const connections = this.websocketConnections.get(jobId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.websocketConnections.delete(jobId);
      }
    }
  }

  /**
   * Pause progress tracking
   */
  pauseSession(jobId: string): boolean {
    const session = this.sessions.get(jobId);
    if (!session || session.isPaused) return false;

    session.isPaused = true;
    const pauseStart = Date.now();

    // Store checkpoint if resume capability is enabled
    if (session.resumeCapability) {
      const currentStep =
        session.history.length > 0 ? session.history[session.history.length - 1].currentStep : 0;

      session.checkpoints.set(currentStep, {
        timestamp: pauseStart,
        state: session.currentState,
        history: [...session.history],
      });
    }

    this.updateProgress(jobId, {
      state: session.currentState,
      message: 'Progress paused',
    });

    return true;
  }

  /**
   * Resume progress tracking
   */
  resumeSession(jobId: string): boolean {
    const session = this.sessions.get(jobId);
    if (!session || !session.isPaused) return false;

    const pauseEnd = Date.now();
    const lastPauseStart =
      session.history.length > 0
        ? session.history[session.history.length - 1].timestamp.getTime()
        : session.startTime.getTime();

    session.pausedDuration += pauseEnd - lastPauseStart;
    session.isPaused = false;

    this.updateProgress(jobId, {
      state: session.currentState,
      message: 'Progress resumed',
    });

    return true;
  }

  /**
   * Get session by job ID
   */
  getSession(jobId: string): ProgressSession | undefined {
    return this.sessions.get(jobId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ProgressSession[] {
    return Array.from(this.sessions.values()).filter(
      (session) => !['completed', 'failed', 'cancelled'].includes(session.currentState)
    );
  }

  /**
   * Private methods
   */
  private completeSession(jobId: string): void {
    const session = this.sessions.get(jobId);
    if (!session) return;

    session.endTime = new Date();
    session.currentState = 'completed';

    const callbacks = this.callbacks.get(jobId);
    if (callbacks?.onCompleted) {
      callbacks.onCompleted(session);
    }

    // Clean up after delay
    setTimeout(() => {
      this.cleanupSession(jobId);
    }, 60000); // Keep for 1 minute after completion
  }

  private cleanupSession(jobId: string): void {
    this.sessions.delete(jobId);
    this.callbacks.delete(jobId);
    this.websocketConnections.delete(jobId);

    if (this.persistenceEnabled) {
      this.removePersistedSession(jobId);
    }
  }

  private notifyProgress(jobId: string, update: ProgressUpdate): void {
    const callbacks = this.callbacks.get(jobId);
    if (callbacks?.onProgress) {
      callbacks.onProgress(update);
    }
    if (callbacks?.onEtaUpdate && update.eta) {
      callbacks.onEtaUpdate(update.eta);
    }
  }

  private notifyStateChange(jobId: string, oldState: ProgressState, newState: ProgressState): void {
    const callbacks = this.callbacks.get(jobId);
    if (callbacks?.onStateChange) {
      callbacks.onStateChange(oldState, newState);
    }
  }

  private sendWebSocketUpdate(jobId: string, update: ProgressUpdate): void {
    const connections = this.websocketConnections.get(jobId);
    if (!connections) return;

    const message = JSON.stringify({
      type: 'progress',
      data: update,
    });

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  private calculatePerformance(session: ProgressSession): ProgressUpdate['performance'] {
    const timings = Array.from(session.stepTimings.values());
    if (timings.length === 0) {
      return {
        stepDuration: 0,
        averageStepTime: 0,
        throughput: 0,
      };
    }

    const latestStepDuration = timings[timings.length - 1];
    const averageStepTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    const elapsedTime = Date.now() - session.startTime.getTime() - session.pausedDuration;
    const throughput = timings.length / (elapsedTime / 1000);

    return {
      stepDuration: latestStepDuration,
      averageStepTime,
      throughput,
    };
  }

  private persistSession(session: ProgressSession): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = `progress_${session.jobId}`;
      const data = {
        ...session,
        stepTimings: Array.from(session.stepTimings.entries()),
        checkpoints: Array.from(session.checkpoints.entries()),
      };
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  private loadPersistedSessions(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('progress_'));
      keys.forEach((key) => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.jobId) {
            const session: ProgressSession = {
              ...data,
              startTime: new Date(data.startTime),
              endTime: data.endTime ? new Date(data.endTime) : undefined,
              stepTimings: new Map(data.stepTimings || []),
              checkpoints: new Map(data.checkpoints || []),
              history: data.history.map((h: any) => ({
                ...h,
                timestamp: new Date(h.timestamp),
              })),
            };
            this.sessions.set(data.jobId, session);
          }
        } catch (error) {
          console.error('Failed to load persisted session:', error);
        }
      });
    }
  }

  private removePersistedSession(jobId: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`progress_${jobId}`);
    }
  }
}

/**
 * ETA Calculator
 */
class ETACalculator {
  calculate(
    session: ProgressSession,
    currentStep: number,
    totalSteps: number
  ): ProgressUpdate['eta'] | undefined {
    if (currentStep === 0 || totalSteps === 0) {
      return undefined;
    }

    const timings = Array.from(session.stepTimings.values());
    if (timings.length < 2) {
      return undefined; // Need at least 2 data points
    }

    // Calculate average time per step
    const averageStepTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    const remainingSteps = totalSteps - currentStep;
    const estimatedTimeRemaining = remainingSteps * averageStepTime;

    // Calculate confidence based on variance
    const variance = this.calculateVariance(timings);
    const confidence = Math.max(0, Math.min(1, 1 - variance / averageStepTime));

    return {
      estimatedTimeRemaining,
      estimatedCompletionTime: new Date(Date.now() + estimatedTimeRemaining),
      confidence,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDifferences = values.map((v) => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDifferences.reduce((a, b) => a + b, 0) / values.length);
  }
}

// Singleton instance
let progressTracker: ProgressTracker | null = null;

export function getProgressTracker(): ProgressTracker {
  if (!progressTracker) {
    progressTracker = new ProgressTracker();
  }
  return progressTracker;
}

export default ProgressTracker;
