import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi } from 'vitest';
import { LoginScreen } from './LoginScreen.js';

// Mock the API client and store
vi.mock('../lib/api.js', () => ({
  client: {
    auth: {
      login: vi.fn(),
    },
  },
}));

vi.mock('../lib/store.js', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn(),
  })),
}));

describe('LoginScreen', () => {
  it('renders without crashing', () => {
    const mockSwitchToRegister = vi.fn();
    const { lastFrame } = render(<LoginScreen onSwitchToRegister={mockSwitchToRegister} />);

    expect(lastFrame()).toBeTruthy();
  });

  it('displays login title', () => {
    const mockSwitchToRegister = vi.fn();
    const { lastFrame } = render(<LoginScreen onSwitchToRegister={mockSwitchToRegister} />);

    expect(lastFrame()).toContain('Bank Game - Login');
  });

  it('starts with email input step', () => {
    const mockSwitchToRegister = vi.fn();
    const { lastFrame } = render(<LoginScreen onSwitchToRegister={mockSwitchToRegister} />);

    expect(lastFrame()).toContain('Email:');
    expect(lastFrame()).not.toContain('Password:');
  });
});
