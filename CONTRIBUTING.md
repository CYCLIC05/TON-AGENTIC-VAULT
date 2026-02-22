# Contributing to TAK

Thank you for your interest in contributing to TAK — TON Agent Kit!

## Code of Conduct

Please be respectful and constructive. We're building infrastructure for the agent economy.

## How to Contribute

### Reporting Issues

- Describe the issue clearly with steps to reproduce
- Include error messages and logs
- Specify your environment (Node version, OS, etc.)

### Contributing Code

1. **Fork and branch**

   ```bash
   git checkout -b feature/your-feature
   ```

2. **Test your changes**
   - Ensure existing tests pass
   - Add tests for new functionality
   - Test locally with both `MCP_MODE=mock` and your target MCP adapter

3. **Keep commits clean**
   - One logical change per commit
   - Use clear commit messages
   - Reference issues when relevant

4. **Submit a pull request**
   - Describe what and why
   - Link any related issues
   - Ensure CI passes

### Areas for Contribution

- **TonMCPAdapter** — Production TON integration (see `tak/tak-server/src/adapters/TonMCPAdapter.js`)
- **API improvements** — New endpoints, better validation
- **SDK features** — Enhanced JavaScript SDK methods
- **Documentation** — Examples, guides, API docs
- **Tests** — Increase coverage, fix flaky tests
- **Infrastructure** — CI/CD, deployment guides, tooling

## Development Setup

```bash
# Install dependencies
cd tak/tak-sdk && npm install
cd ../tak-server && npm install

# Start development server
cd tak-server
npm run dev

# Run tests (if available)
npm test
```

## Code Style

- Use Node.js/JavaScript conventions
- No external linters enforced yet (but keep imports organized)
- Comment complex logic
- Use descriptive variable names

## Security

- **Never commit credentials** (use `.env`)
- Review [SECURITY.md](./SECURITY.md) before implementing authentication/authorization
- Test with both mock and production adapters
- Remember: **TAK never holds funds** — execution is delegated to MCP

## Questions?

Open an issue or check the [documentation](./tak/README.md).

---

**Thank you for contributing to TAK! 🚀**
