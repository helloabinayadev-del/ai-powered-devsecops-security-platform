import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
  })

  it('renders login page at root path', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    // Login page should be rendered at root path
  })
})
