# Shardus CLI Network Tool

A command-line tool for managing Shardus test networks.

## Installation

```bash
npm install -g @shardeum-foundation/tools-shardus-cli-network
```

## Usage

```bash
shardus-network <command> [options]
```

## Available Commands

- `create` (alias: `create-net`) - Create a new test network
- `start` (alias: `start-net`) - Start a stopped test network, or create a new one
- `stop` (alias: `stop-net`) - Stop a test network
- `restart` (alias: `restart-net`) - Restart nodes or archivers
- `clean` (alias: `clean-net`) - Clean the state of all instances in a test net
- `config` (alias: `config-net`) - Set the config file for all nodes in the network directory
- `ls` (alias: `list-net`) - List all the shardus pm2 processes
- `pm2` - Run a pm2 command in the test network dir

## Development

### Setup

```bash
git clone https://github.com/shardeum/tools-cli-shardus-network.git
cd tools-cli-shardus-network
npm install
```

### Testing

The project uses Jest for testing. To run the tests:

```bash
npm test
```

### Building

```bash
npm run compile
```
