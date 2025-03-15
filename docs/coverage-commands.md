# Coverage Management Commands

The Shardus CLI now includes commands for managing code coverage data. These commands help you clean, merge, and analyze coverage data generated from your Shardus network tests.

## Available Commands

### Coverage Status

```bash
shardus coverage status
```

Displays information about the available coverage data, including counts of validators, archivers, monitor, and explorer coverage reports.

### Clean Coverage Data

```bash
shardus coverage clean
```

Deletes all coverage data from the coverage directory, allowing you to start fresh with a new test run.

### Clean Merged Coverage Data

```bash
shardus coverage clean-merged
```

Only deletes the merged coverage reports while preserving the raw coverage data. This is useful when you want to regenerate the merged reports without having to rerun your tests.

### Merge Coverage Data

```bash
shardus coverage merge
```

Merges coverage data by component type (validators, archivers, monitor, explorer) and generates combined HTML reports. This is particularly useful for analyzing the combined coverage across multiple nodes.

## Command Options

All coverage commands accept the following options:

- `-d, --dir <network_dir>` - The directory containing the coverage data (defaults to ./instances)
- `--tool <tool>` - Override the coverage tool specified in the network config (istanbul or c8)
- `--outputdir <output_dir>` - The output directory for coverage data (defaults to coverage)
- `--global` - Force using globally installed coverage tools (recommended)
- `--verbose` - Show more detailed output during operations

## HTML Report Generation

When running the `coverage merge` command, HTML reports are automatically generated in the following locations:

```
instances/coverage/merged-validators/html/index.html
instances/coverage/merged-archivers/html/index.html
instances/coverage/merged-monitor/html/index.html
instances/coverage/merged-explorer/html/index.html
```

If HTML reports are not generated automatically (which may happen if the `genhtml` tool is not found), you can manually generate them using the following command:

```bash
cd instances/coverage
genhtml merged-validators/lcov.info -o merged-validators/html --ignore-errors source,category --synthesize-missing
```

The `--ignore-errors source,category` and `--synthesize-missing` flags help handle situations where source files are not available or have moved.

## How the Merge Process Works

The coverage merge command performs several steps:

1. Scans the coverage directory for reports from different components (validators, archivers, etc.)
2. Groups reports by component type
3. For each component type:
   - Creates a temporary directory
   - Copies coverage files from all component instances to the temp directory
   - Runs the coverage tool's merge command on the temp directory
   - Generates HTML and LCOV reports in the output directory

This process ensures that coverage data is properly combined while keeping it organized by component type.

## Requirements

To use the coverage merge command, you need to have the coverage tool installed globally:

```bash
# For Istanbul/NYC
npm install -g nyc

# For C8
npm install -g c8
```

Then use the `--global` flag when running the command:

```bash
shardus coverage merge --global
```

## Examples

### Basic Usage

```bash
# Show coverage status
shardus coverage status

# Merge coverage reports
shardus coverage merge

# Clean all coverage data
shardus coverage clean
```

### Advanced Usage

```bash
# Use verbose mode to see detailed output
shardus coverage merge --verbose

# Override the tool type and use global installation
shardus coverage merge --tool c8 --global

# Merge coverage from a specific network directory
shardus coverage merge -d ./my-custom-network

# Clean coverage in a custom output directory
shardus coverage clean --outputdir my-custom-coverage
```

## Troubleshooting

If you encounter errors when merging coverage:

1. Make sure you have the coverage tool installed globally
2. Verify that coverage data was correctly generated during test runs
3. Use the `--verbose` flag to see more detailed output
4. Check if coverage files exist in the expected locations (usually `.nyc_output` or `coverage-final.json`) 

## Including Coverage for Dependencies

By default, coverage tools exclude code in `node_modules` to improve performance. If you need to track coverage for specific dependencies (such as your own libraries), you can configure this in the network configuration:

```json
{
  "coverage": {
    "tool": "istanbul",
    "targets": { /* your targets */ },
    "outputDir": "coverage",
    "includeDependencies": [
      "@shardeum-foundation/crypto",
      "@shardeum-foundation/**"  // Use glob pattern to include all packages in a namespace
    ]
  }
}
```

### How this works

1. When you specify dependencies in the `includeDependencies` array, the CLI passes the appropriate flags to the coverage tool
2. You can use specific package names or glob patterns (e.g., `@shardeum-foundation/**`)
3. The coverage tool will instrument these dependencies even though they're in `node_modules`

### Source Maps for Dependencies

For visualizing coverage of dependencies correctly, ensure your dependencies:

1. Generate source maps during their build process (`"sourceMap": true"` in tsconfig.json)
2. Include both compiled code and source maps in their npm package

Without proper source maps, you may collect coverage data but it will be harder to visualize in reports.

### Example Configuration

Here's a complete example that enables coverage for Shardeum Foundation libraries:

```json
{
  "coverage": {
    "tool": "istanbul",
    "targets": {
      "validators": [9001, 9002],
      "archivers": [1]
    },
    "outputDir": "coverage",
    "includeDependencies": [
      "@shardeum-foundation/**"
    ],
    "env": {
      "NODE_ENV": "development"
    }
  }
}
``` 