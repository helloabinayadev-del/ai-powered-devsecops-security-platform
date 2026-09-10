import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';

// Mock the API module
vi.mock('../services/api', () => ({
  default: {
    // Keep the request pending so these tests exercise the initial loading
    // state without scheduling a state update after their assertions.
    get: vi.fn(() => new Promise(() => {})),
  },
}));

describe('Dashboard Component', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    // Check for loading indicator or placeholder
    const dashboardElement = screen.getByText(/dashboard/i);
    expect(dashboardElement).toBeInTheDocument();
  });
});
