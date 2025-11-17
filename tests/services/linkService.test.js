/**
 * Tests for linkService.js
 * Tests link CRUD operations and caching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import linkService from '../../js/services/linkService.js';
import eventBus from '../../js/core/eventBus.js';
import stateManager from '../../js/core/stateManager.js';

describe('LinkService', () => {
  beforeEach(() => {
    // Clear state
    stateManager.clear();
    eventBus.listeners = {};
    eventBus.onceListeners = {};
    eventBus.eventHistory = [];

    // Reset links array
    linkService.links = [];

    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty links array', () => {
      expect(linkService.links).toBeDefined();
      expect(Array.isArray(linkService.links)).toBe(true);
    });

    it('should have correct storage key', () => {
      expect(linkService.storageKey).toBe('links');
    });

    it('should setup event listeners', async () => {
      // Event listeners set up during initialization
      // Create new service to test fresh listener setup
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      const newService = new LinkService(stateManager);
      const loadSpy = vi.spyOn(newService, 'load');
      
      eventBus.emit('app:ready');
      
      // Wait a tick for event to process
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('load()', () => {
    it('should load links from cache if available', async () => {
      const cachedLinks = [
        { name: 'Google', url: 'https://google.com' },
        { name: 'GitHub', url: 'https://github.com' }
      ];
      stateManager.set('links', cachedLinks);

      const emitSpy = vi.spyOn(eventBus, 'emit');

      await linkService.load();

      expect(linkService.links).toEqual(cachedLinks);
      expect(emitSpy).toHaveBeenCalledWith('links:loaded', cachedLinks);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch from file if cache is empty', async () => {
      const mockLinks = [
        { name: 'Google', url: 'https://google.com' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLinks
      });

      await linkService.load();

      expect(global.fetch).toHaveBeenCalledWith('./data/links.json');
      expect(linkService.links).toEqual(mockLinks);
    });

    it('should not load from cache if cache is null', async () => {
      stateManager.set('links', null);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await linkService.load();

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not load from cache if cache is not an array', async () => {
      stateManager.set('links', 'invalid');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await linkService.load();

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('fetchLinks()', () => {
    it('should fetch links from file', async () => {
      const mockLinks = [
        { name: 'Google', url: 'https://google.com' },
        { name: 'GitHub', url: 'https://github.com' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLinks
      });

      const emitSpy = vi.spyOn(eventBus, 'emit');

      await linkService.fetchLinks();

      expect(linkService.links).toEqual(mockLinks);
      expect(emitSpy).toHaveBeenCalledWith('links:loaded', mockLinks);
    });

    it('should cache fetched links', async () => {
      const mockLinks = [
        { name: 'Google', url: 'https://google.com' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLinks
      });

      await linkService.fetchLinks();

      const cached = stateManager.get('links');
      expect(cached).toEqual(mockLinks);
    });

    it('should handle HTTP errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await linkService.fetchLinks();

      // Should handle error gracefully without throwing
      expect(linkService.links).toEqual([]);
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await linkService.fetchLinks();

      expect(linkService.links).toEqual([]);
    });

    it('should handle invalid JSON', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await linkService.fetchLinks();

      expect(linkService.links).toEqual([]);
    });

    it('should validate links data format', async () => {
      // Non-array response should throw error
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'format' })
      });

      await expect(linkService.fetchLinks()).rejects.toThrow('Invalid links data format');
    });
  });

  describe('save()', () => {
    it('should save links to state manager', () => {
      const links = [
        { name: 'Google', url: 'https://google.com' }
      ];
      linkService.links = links;

      linkService.save();

      const saved = stateManager.get('links');
      expect(saved).toEqual(links);
    });

    it('should handle save errors gracefully', () => {
      const setSpy = vi.spyOn(stateManager, 'set').mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => linkService.save()).not.toThrow();

      setSpy.mockRestore();
    });
  });

  describe('getLinks()', () => {
    it('should return all links', () => {
      const links = [
        { name: 'Google', url: 'https://google.com' },
        { name: 'GitHub', url: 'https://github.com' }
      ];
      linkService.links = links;

      expect(linkService.getLinks()).toEqual(links);
    });

    it('should return empty array when no links', () => {
      linkService.links = [];
      expect(linkService.getLinks()).toEqual([]);
    });

    it('should return reference to links array', () => {
      const links = [{ name: 'Test', url: 'https://test.com' }];
      linkService.links = links;

      const result = linkService.getLinks();
      expect(result).toBe(links);
    });
  });

  describe('addLink()', () => {
    it('should add a new link', () => {
      const linkData = {
        name: 'Google',
        url: 'https://google.com'
      };

      const result = linkService.addLink(linkData);

      expect(result).toMatchObject(linkData);
      expect(linkService.links).toHaveLength(1);
      expect(linkService.links[0]).toMatchObject(linkData);
    });

    it('should emit links:added event', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      const linkData = {
        name: 'Google',
        url: 'https://google.com'
      };

      const result = linkService.addLink(linkData);

      expect(emitSpy).toHaveBeenCalledWith('links:added', result);
    });

    it('should save after adding link', () => {
      const saveSpy = vi.spyOn(linkService, 'save');
      const linkData = {
        name: 'Google',
        url: 'https://google.com'
      };

      linkService.addLink(linkData);

      expect(saveSpy).toHaveBeenCalled();
    });

    it('should throw error when name is missing', () => {
      expect(() => {
        linkService.addLink({ url: 'https://google.com' });
      }).toThrow();
    });

    it('should throw error when url is missing', () => {
      expect(() => {
        linkService.addLink({ name: 'Google' });
      }).toThrow();
    });

    it('should throw error when linkData is null', () => {
      expect(() => {
        linkService.addLink(null);
      }).toThrow();
    });
  });

  describe('removeLink()', () => {
    beforeEach(() => {
      linkService.links = [
        { name: 'Google', url: 'https://google.com' },
        { name: 'GitHub', url: 'https://github.com' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com' }
      ];
    });

    it('should remove link by index', () => {
      linkService.removeLink(1);

      expect(linkService.links).toHaveLength(2);
      expect(linkService.links[0].name).toBe('Google');
      expect(linkService.links[1].name).toBe('Stack Overflow');
    });

    it('should emit links:removed event', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      const removedLink = linkService.links[1];

      linkService.removeLink(1);

      expect(emitSpy).toHaveBeenCalledWith('links:removed', removedLink);
    });

    it('should save after removing link', () => {
      const saveSpy = vi.spyOn(linkService, 'save');

      linkService.removeLink(1);

      expect(saveSpy).toHaveBeenCalled();
    });

    it('should handle invalid index gracefully', () => {
      const initialLength = linkService.links.length;

      linkService.removeLink(999);

      expect(linkService.links).toHaveLength(initialLength);
    });

    it('should handle negative index gracefully', () => {
      const initialLength = linkService.links.length;

      linkService.removeLink(-1);

      expect(linkService.links).toHaveLength(initialLength);
    });

    it('should remove first link', () => {
      linkService.removeLink(0);

      expect(linkService.links[0].name).toBe('GitHub');
    });

    it('should remove last link', () => {
      linkService.removeLink(2);

      expect(linkService.links).toHaveLength(2);
      expect(linkService.links[linkService.links.length - 1].name).toBe('GitHub');
    });
  });

  describe('updateLink()', () => {
    beforeEach(() => {
      linkService.links = [
        { name: 'Google', url: 'https://google.com' },
        { name: 'GitHub', url: 'https://github.com' }
      ];
    });

    it('should update link by index', () => {
      linkService.updateLink(0, {
        name: 'Google Search',
        url: 'https://www.google.com'
      });

      expect(linkService.links[0]).toMatchObject({
        name: 'Google Search',
        url: 'https://www.google.com'
      });
    });

    it('should emit links:updated event', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');

      linkService.updateLink(0, { name: 'Updated Name' });

      expect(emitSpy).toHaveBeenCalledWith('links:updated', linkService.links[0]);
    });

    it('should save after updating link', () => {
      const saveSpy = vi.spyOn(linkService, 'save');

      linkService.updateLink(0, { name: 'Updated' });

      expect(saveSpy).toHaveBeenCalled();
    });

    it('should allow partial updates', () => {
      linkService.updateLink(0, { name: 'New Name' });

      expect(linkService.links[0]).toMatchObject({
        name: 'New Name',
        url: 'https://google.com' // URL unchanged
      });
    });

    it('should handle invalid index gracefully', () => {
      const original = { ...linkService.links[0] };

      linkService.updateLink(999, { name: 'Invalid' });

      expect(linkService.links[0]).toMatchObject(original);
    });

    it('should handle negative index gracefully', () => {
      const original = { ...linkService.links[0] };

      linkService.updateLink(-1, { name: 'Invalid' });

      expect(linkService.links[0]).toMatchObject(original);
    });

    it('should preserve existing properties not being updated', () => {
      linkService.links[0].customProp = 'value';

      linkService.updateLink(0, { name: 'Updated' });

      expect(linkService.links[0].customProp).toBe('value');
    });
  });

  describe('Event listeners', () => {
    it('should reload links on app:ready event', async () => {
      // Event listener already set up during beforeEach
      // Test by verifying load is called when app:ready emitted
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      const loadSpy = vi.spyOn(linkService, 'load').mockImplementation(async () => {});
      
      eventBus.emit('app:ready');
      
      // Wait for async event handler
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(loadSpy).toHaveBeenCalled();
    });
  });
});
