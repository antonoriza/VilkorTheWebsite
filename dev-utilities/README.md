# Dev Utilities

Developer tooling for the Vilkor monorepo. Provides a unified CLI to manage the application lifecycle across environments.

## Quick Start

The command is already integrated into the project. No system changes are required.

```bash
# Make the CLI executable (one-time setup)
chmod +x dev-utilities/bin/propertyPulse

# Run from root using bun
bun propertyPulse help
```

## Commands

### `propertyPulse run`

Start the application stack with environment-specific configuration.

| Flag | Description |
|---|---|
| *(none)* | Full stack in **development** mode (Vite HMR + Bun hot reload) |
| `-demo` | Full stack in **demo** mode (seeds sample data, relaxed auth) |
| `-prod` | **Production** mode (builds assets, runs migrations, optimized) |
| `-web` | Start **only** the web frontend |
| `-api` | Start **only** the API backend |

Flags can be combined:

```bash
# Demo mode, web only
propertyPulse run -demo -web

# Production mode, API only
propertyPulse run -prod -api
```

### `propertyPulse help`

Display usage information and available commands.

## Examples

```bash
# Standard development workflow
propertyPulse run

# Show the app to a stakeholder with sample data
propertyPulse run -demo

# Test the production build locally
propertyPulse run -prod

# Frontend-only work (API already running separately)
propertyPulse run -web
```

## Architecture

```
dev-utilities/
├── bin/
│   └── propertyPulse      # Main CLI entrypoint (bash)
└── README.md               # This file
```

The CLI auto-resolves the project root relative to its own location, so it works regardless of your current working directory. It also:

- **Auto-installs dependencies** if `node_modules` is missing
- **Loads `.env`** from the project root automatically
- **Validates prerequisites** (bun installed, project structure intact)
