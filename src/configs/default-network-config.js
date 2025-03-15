module.exports = {
  numberOfNodes: 10,
  serverPath: 'index.js',
  startingExternalPort: 9001,
  startingInternalPort: 10001,
  lowestPort: 9001,
  highestPort: 9001,
  inspectPort: 8001,
  instancesPath: 'instances',
  archivers: 1,
  existingArchivers: `[
    {
      "ip": "127.0.0.1",
      "port": 4000,
      "publicKey": "758b1c119412298802cd28dbfa394cdfeecc4074492d60844cc192d632d84de3"
    }
  ]`,
  startArchiver: true,
  monitorUrl: 'http://127.0.0.1:3000/api',
  startMonitor: true,
  explorerServerPort: 4444,
  explorerServerAddr: '127.0.0.1',
  startExplorerServer: false,
  logSize: 10,
  logNum: 10,
  // explorerClientPort: 5001,
  // explorerClientAddr: '127.0.0.1',
  // startExplorerClient: true
  
  // Coverage configuration
  coverage: {
    tool: 'off',         // Coverage tool to use: 'istanbul', 'c8', or 'off'
    outputDir: 'coverage', // Directory to store coverage reports
    env: {
      // Custom environment variables to apply to all coverage-enabled processes
      // LOAD_JSON_CONFIGS: 'debug-10-nodes.config.json'
    },
    targets: {
      validators: [],    // List of validator ports to instrument (e.g. [9001, 9002])
      archivers: [],     // List of archiver indices to instrument (e.g. [1, 2])
      monitor: false,    // Whether to instrument the monitor
      explorer: false    // Whether to instrument the explorer
    },
    includeDependencies: [
      "@shardeum-foundation/core",
      "@shardeum-foundation/**"
    ]
  }
}
