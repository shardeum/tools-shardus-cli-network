# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js CLI tool for managing Shardus test networks. It provides commands to create, start, stop, and manage distributed test networks with multiple nodes and archivers. The tool uses PM2 for process management and supports both JavaScript and TypeScript.

## Development Commands

### Build and Test
```bash
npm run compile          # Compile TypeScript to JavaScript
npm test                 # Run Jest tests
npm run format-check     # Check code formatting
npm run format-fix       # Fix code formatting issues
```

### Running a Single Test
```bash
npm test -- path/to/test.js                    # Run specific test file
npm test -- --testNamePattern="test name"      # Run tests matching pattern
```

### Release Commands
```bash
npm run release          # Interactive release
npm run release:patch    # Patch version bump
npm run release:minor    # Minor version bump
npm run release:major    # Major version bump
```

## Architecture

### Key Directories
- `/src/actions/` - CLI command implementations (thin wrappers)
- `/src/lib/` - Core business logic for each action
- `/src/configs/` - Default configuration templates
- `/bin/` - CLI entry point

### Command Structure
Each CLI command follows this pattern:
1. User runs `shardus-network <command>`
2. Caporal parses command in `/bin/shardus-network.js`
3. Calls action handler in `/src/actions/<command>.js`
4. Action calls corresponding lib function in `/src/lib/<command>.js`

### PM2 Integration
- Uses a custom PM2 fork (`@shardus/pm2`) with error counting features
- Each network has its own PM2 home directory (`.pm2/` in network dir)
- All node/archiver processes are managed through PM2 APIs

### Configuration Flow
1. Default configs are in `/src/configs/`
2. Network-specific configs are created in the network directory
3. Config changes are applied by modifying files and restarting nodes

## Key Implementation Details

### Adding New Commands
1. Create action file in `/src/actions/`
2. Create lib implementation in `/src/lib/`
3. Register command in `/bin/shardus-network.js`

### Working with PM2
- Always set `process.env.PM2_HOME` to the network's `.pm2` directory
- Use `pm2.connect()` before any PM2 operations
- Remember to `pm2.disconnect()` when done

### TypeScript Notes
- TypeScript config is very permissive (strict: false)
- Mix of JS and TS files is allowed
- Compiles to CommonJS, not ES modules

### Code Style
- Prettier config: single quotes, no semicolons, 120 char width
- ES5 trailing commas
- Use CommonJS require/exports, not ES modules