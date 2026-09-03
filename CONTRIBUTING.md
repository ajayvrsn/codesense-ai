# Contributing to Debugr

Thank you for your interest in contributing to Debugr! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project is committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/debugr.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`

## Development Setup

1. Copy `.env.example` to `.env.local` and add your credentials
2. Start the development server: `npm run dev`
3. Run type checks: `npm run lint`

## Making Changes

1. Keep commits logical and descriptive
2. Follow the existing code style and conventions
3. Test your changes thoroughly
4. Ensure TypeScript types are correct: `npm run lint`

## Commit Message Guidelines

- Use clear, descriptive commit messages
- Start with a verb: "Add", "Fix", "Update", "Remove", etc.
- Examples:
  - `Add security vulnerability detection for SQL injection`
  - `Fix type errors in AuthForm component`
  - `Update dependencies to latest versions`

## Submitting a Pull Request

1. Push your branch to your fork
2. Open a Pull Request against the main branch
3. Provide a clear description of changes
4. Reference any related issues (e.g., `Fixes #123`)
5. Ensure all checks pass before requesting review

## Reporting Bugs

1. Check if the bug has already been reported
2. Provide a clear title and description
3. Include steps to reproduce the issue
4. Share your environment (OS, Node version, etc.)

## Feature Requests

1. Clearly describe the feature and its use case
2. Explain why this would be useful
3. Provide any relevant examples or mockups

## Project Structure

- `src/` - Frontend React components
- `server.ts` - Backend Node.js/Express server
- `db.ts` - Database configuration and queries
- `src/services/` - Business logic and API services
- `src/components/` - Reusable React components

## Questions?

Feel free to open an issue for any questions about the contribution process.

Thank you for contributing!
