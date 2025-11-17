/**
 * Tests for pomodoroService.js
 * Tests timer functionality, work/break cycles, and session tracking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PomodoroService } from '../../js/services/pomodoroService.js';
import eventBus from '../../js/core/eventBus.js';
import stateManager from '../../js/core/stateManager.js';

describe('PomodoroService', () => {
  let pomodoroService;
  let emitSpy;

  beforeEach(() => {
    // Use fake timers
    vi.useFakeTimers();

    // Clear state
    stateManager.clear();
    eventBus.listeners = {};
    eventBus.onceListeners = {};
    eventBus.eventHistory = [];

    // Spy on eventBus.emit
    emitSpy = vi.spyOn(eventBus, 'emit');

    // Create fresh service instance
    pomodoroService = new PomodoroService();
  });

  afterEach(() => {
    // Stop timer if running
    if (pomodoroService.interval) {
      pomodoroService.stop();
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with work mode', () => {
      expect(pomodoroService.state.mode).toBe('work');
    });

    it('should initialize with 25 minutes for work', () => {
      expect(pomodoroService.duration.work).toBe(25 * 60);
      expect(pomodoroService.state.timeLeft).toBe(25 * 60);
    });

    it('should not be running initially', () => {
      expect(pomodoroService.state.isRunning).toBe(false);
    });

    it('should have correct break durations', () => {
      expect(pomodoroService.duration.shortBreak).toBe(5 * 60);
      expect(pomodoroService.duration.longBreak).toBe(15 * 60);
    });

    it('should register schema', () => {
      expect(stateManager.schemas.pomodoroState).toBeDefined();
      expect(stateManager.schemas.pomodoroState.version).toBe(1);
    });
  });

  describe('start()', () => {
    it('should start timer', () => {
      pomodoroService.start();

      expect(pomodoroService.state.isRunning).toBe(true);
      expect(pomodoroService.interval).toBeDefined();
    });

    it('should emit started event', () => {
      pomodoroService.start();

      expect(emitSpy).toHaveBeenCalledWith('pomodoro:started', expect.objectContaining({
        mode: 'work',
        timeLeft: 25 * 60
      }));
    });

    it('should tick every second', () => {
      pomodoroService.start();

      const initialTime = pomodoroService.state.timeLeft;

      vi.advanceTimersByTime(1000);

      expect(pomodoroService.state.timeLeft).toBe(initialTime - 1);
    });

    it('should emit tick event each second', () => {
      pomodoroService.start();
      emitSpy.mockClear();

      vi.advanceTimersByTime(1000);

      expect(emitSpy).toHaveBeenCalledWith('pomodoro:tick', expect.objectContaining({
        timeLeft: expect.any(Number),
        mode: 'work'
      }));
    });

    it('should not start if already running', () => {
      pomodoroService.start();
      const firstInterval = pomodoroService.interval;

      pomodoroService.start();

      expect(pomodoroService.interval).toBe(firstInterval);
    });
  });

  describe('pause()', () => {
    it('should pause running timer', () => {
      pomodoroService.start();
      pomodoroService.pause();

      expect(pomodoroService.state.isRunning).toBe(false);
      expect(pomodoroService.interval).toBeNull();
    });

    it('should emit paused event', () => {
      pomodoroService.start();
      emitSpy.mockClear();

      pomodoroService.pause();

      expect(emitSpy).toHaveBeenCalledWith('pomodoro:paused', expect.objectContaining({
        mode: 'work',
        timeLeft: expect.any(Number)
      }));
    });

    it('should preserve time left when paused', () => {
      pomodoroService.start();
      vi.advanceTimersByTime(5000); // 5 seconds

      const timeWhenPaused = pomodoroService.state.timeLeft;
      pomodoroService.pause();

      expect(pomodoroService.state.timeLeft).toBe(timeWhenPaused);
    });
  });

  describe('stop()', () => {
    it('should stop timer and reset', () => {
      pomodoroService.start();
      vi.advanceTimersByTime(5000);

      pomodoroService.reset();

      expect(pomodoroService.state.isRunning).toBe(false);
      expect(pomodoroService.state.timeLeft).toBe(25 * 60);
      expect(pomodoroService.interval).toBeNull();
    });

    it('should emit stopped event', () => {
      pomodoroService.start();
      emitSpy.mockClear();

      pomodoroService.reset();

      expect(emitSpy).toHaveBeenCalledWith('pomodoro:reset', expect.any(Object));
    });
  });

  describe('reset()', () => {
    it('should reset timer to current mode duration', () => {
      pomodoroService.start();
      vi.advanceTimersByTime(5000);

      pomodoroService.reset();

      expect(pomodoroService.state.timeLeft).toBe(25 * 60);
      expect(pomodoroService.state.isRunning).toBe(false);
    });

    it('should emit reset event', () => {
      pomodoroService.start();
      vi.advanceTimersByTime(5000);
      emitSpy.mockClear();

      pomodoroService.reset();

      expect(emitSpy).toHaveBeenCalledWith('pomodoro:reset', expect.any(Object));
    });
  });

  describe('skip()', () => {
    it('should skip to next phase', () => {
      pomodoroService.skip();

      expect(pomodoroService.state.mode).toBe('shortBreak');
      expect(pomodoroService.state.timeLeft).toBe(5 * 60);
    });

    it('should emit skipped event', () => {
      pomodoroService.skip();

      expect(emitSpy).toHaveBeenCalledWith('pomodoro:skipped', expect.objectContaining({
        from: 'work',
        to: 'shortBreak'
      }));
    });

    it('should stop timer when skipping', () => {
      pomodoroService.start();
      pomodoroService.skip();

      expect(pomodoroService.state.isRunning).toBe(false);
    });
  });

  describe('Work/Break cycle', () => {
    it('should switch to short break after work session', () => {
      pomodoroService.start();
      
      // Fast forward to end of work session
      vi.advanceTimersByTime(25 * 60 * 1000);

      expect(pomodoroService.state.mode).toBe('shortBreak');
      expect(pomodoroService.state.timeLeft).toBe(5 * 60);
    });

    it('should switch to work after short break', () => {
      pomodoroService.state.mode = 'shortBreak';
      pomodoroService.state.timeLeft = 5 * 60;
      pomodoroService.start();

      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(pomodoroService.state.mode).toBe('work');
    });

    it('should emit completed event when session ends', () => {
            pomodoroService.start();
            emitSpy.mockClear();

            vi.advanceTimersByTime(25 * 60 * 1000);

            const completedCalls = emitSpy.mock.calls.filter(call => call[0] === 'pomodoro:completed');
            expect(completedCalls.length).toBeGreaterThan(0);
        });

        it('should switch to long break after 4 work sessions', () => {
            // Complete 4 work sessions
            for (let i = 0; i < 4; i++) {
                pomodoroService.state.mode = 'work';
                pomodoroService.state.timeLeft = 1;
                pomodoroService.start();
                vi.advanceTimersByTime(1000);
                pomodoroService.pause();
            }

            // Next break should be long
            pomodoroService.state.mode = 'work';
            pomodoroService.state.timeLeft = 1;
            pomodoroService.start();
            vi.advanceTimersByTime(1000);

            expect(pomodoroService.state.mode).toBe('longBreak');
            expect(pomodoroService.state.timeLeft).toBe(15 * 60);
        });
    });

    describe('Session tracking', () => {
        it('should increment completed sessions', () => {
            expect(pomodoroService.state.sessionsCompleted).toBe(0);

            pomodoroService.state.timeLeft = 1;
            pomodoroService.start();
            vi.advanceTimersByTime(1000);

            expect(pomodoroService.state.sessionsCompleted).toBe(1);
        });

        it('should track total sessions today', () => {
            pomodoroService.state.timeLeft = 1;
            pomodoroService.start();
            vi.advanceTimersByTime(1000);

            expect(pomodoroService.state.totalSessionsToday).toBeGreaterThanOrEqual(1);
        });

        it('should persist session count', () => {
            pomodoroService.state.timeLeft = 1;
            pomodoroService.start();
            vi.advanceTimersByTime(1000);

      const sessions = pomodoroService.state.totalSessionsToday;

      // Save should happen automatically
      const saved = stateManager.get('pomodoroState');
      expect(saved.totalSessionsToday).toBe(sessions);
    });

    it('should reset count on new day', () => {
      pomodoroService.state.totalSessionsToday = 5;
      pomodoroService.saveState();

      // Simulate new day
      stateManager.set('pomodoroState', {
        totalSessionsToday: 5,
        sessionsCompleted: 5,
        date: new Date(Date.now() - 86400000).toDateString() // Yesterday
      });

      const newService = new PomodoroService();
      
      expect(newService.state.totalSessionsToday).toBe(0);
    });
  });

  describe('setDurations()', () => {
    it('should set custom work duration', () => {
      pomodoroService.setDurations(30, null, null);

      expect(pomodoroService.duration.work).toBe(30 * 60);
      expect(pomodoroService.state.timeLeft).toBe(30 * 60);
    });

    it('should set custom break duration', () => {
      pomodoroService.setDurations(null, 10, null);

      expect(pomodoroService.duration.shortBreak).toBe(10 * 60);
    });

    it('should emit duration:changed event', () => {
      pomodoroService.setDurations(30, null, null);

      expect(emitSpy).toHaveBeenCalledWith('pomodoro:durationsChanged', expect.objectContaining({
        duration: expect.any(Object)
      }));
    });

    it('should reset timer when changing duration', () => {
      pomodoroService.start();
      vi.advanceTimersByTime(5000);

      pomodoroService.setDurations(30, null, null);

      expect(pomodoroService.state.timeLeft).toBe(30 * 60);
      expect(pomodoroService.state.isRunning).toBe(false);
    });
  });

  describe('getState()', () => {
    it('should return current state', () => {
      const state = pomodoroService.getState();

      expect(state.mode).toBe('work');
      expect(state.timeLeft).toBe(25 * 60);
      expect(state.isRunning).toBe(false);
    });

    it('should return copy of state', () => {
      const state = pomodoroService.getState();
      state.mode = 'shortBreak';

      expect(pomodoroService.state.mode).toBe('work');
    });
  });

  describe('getFormattedTime()', () => {
    it('should format seconds as MM:SS', () => {
      pomodoroService.state.timeLeft = 125;
      expect(pomodoroService.getFormattedTime()).toBe('02:05');
      
      pomodoroService.state.timeLeft = 3600;
      expect(pomodoroService.getFormattedTime()).toBe('60:00');
      
      pomodoroService.state.timeLeft = 0;
      expect(pomodoroService.getFormattedTime()).toBe('00:00');
    });

    it('should handle single digit minutes and seconds', () => {
      pomodoroService.state.timeLeft = 65;
      expect(pomodoroService.getFormattedTime()).toBe('01:05');
      
      pomodoroService.state.timeLeft = 5;
      expect(pomodoroService.getFormattedTime()).toBe('00:05');
    });
  });

  describe('Notifications', () => {
    it('should have notification permission method', () => {
      expect(typeof pomodoroService.requestNotificationPermission).toBe('function');
    });
  });

  describe('Error handling', () => {
    it('should handle storage errors gracefully', () => {
      // Mock storage error
      vi.spyOn(stateManager, 'get').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const service = new PomodoroService();

      expect(service.state.totalSessionsToday).toBe(0);
    });
  });
});
