const actions = require('./actions')

const register = {
  create(prog, namespace) {
    prog
      .command(`${namespace ? namespace + ' ' : ''}create-net`, 'Create a new test network')
      .alias('create')
      // .argument('[options]', 'Options for creating a test network')
      // .argument('[network_dir]', 'The directory to create the network folder (/instances by default)')
      // .option('-n, --num <num>', 'Number of nodes to create inside of [network_dir]')
      // .complete(() => [1, 5, 10])
      .option('-d, --dir <network_dir>', 'Path to the network directory (defaults to ./instances)')
      .option('--log-size-mb <log_size_mb>', 'Max log file size (defaults to 10 Mb)')
      .option('--log-num <log_num>', 'Number of log files to retain (defaults to 10 files)')
      .option('--no-start', 'Does not start the network after creating it')
      .option('--no-log-rotation', 'Does not enable log rotation')
      .option('--auto-ip', 'Makes nodes discover their IP automatically')
      .option('--existing-archivers <archivers>', 'Uses the given JSON list of archivers')
      .option('--monitor-url <monitor>', 'Uses the given monitor API URL')
      .option('--starting-external-port <startingExternalPort>', 'The starting external port number. Defaults to 9001')
      .option('--starting-internal-port <startingInternalPort>', 'The starting internal port number. Defaults to 10001')
      .option('--inspect', 'Starts all node processes in inspect mode, allowing a debugger to be attached')
      .argument('[num]', 'Number of nodes to create inside of [network_dir]')
      .argument('[pm2...]', "Additional arguments/flags to pass to PM2. Prefix them with 'pm2' e.g., 'pm2--no-autorestart' ")
      .action(actions.create)
  },
  start(prog, namespace) {
    prog
      .command(`${namespace ? namespace + ' ' : ''}start-net`, 'Start a stopped test network, or create a new one')
      .alias('start')
      // .argument('[network_dir]', 'The directory to start the nodes from')
      // .option('-n, --num <num>', 'Number of nodes to start inside of [network_dir]')
      .option('-d, --dir <network_dir>', 'The directory to start the nodes from')
      .option('--autorestart', 'Ensures that PM2 will autorestart nodes that have stopped')
      .option('--log-size-mb <log_size_mb>', 'Max log file size (defaults to 10 Mb)')
      .option('--log-num <log_num>', 'Number of log files to retain (defaults to 10 files)')
      .option('--no-log-rotation', 'Does not enable log rotation')
      .option('-a, --archivers <archivers_count>', 'Start archivers')
      .argument('[num]', 'Number of nodes to start inside of [network_dir]')
      .argument('[pm2...]', "Additional arguments/flags to pass to PM2. Prefix them with 'pm2' e.g., 'pm2--no-autorestart' ")
      .action(actions.start)
  },
  stop(prog, namespace) {
    prog
      .command(`${namespace ? namespace + ' ' : ''}stop-net`, 'Stop a test network')
      .alias('stop')
      // .argument('[network_dir]', 'The directory to stop the nodes from')
      // .option('-n, --num <num>', 'Number of nodes to stop inside of [network_dir]')
      .option('-a, --archivers <archivers_count>', 'Number of archivers to stop')
      .option('-ap, --archiverPort <archivers_port>', 'Archiver port number to stop')
      .option('-d, --dir <network_dir>', 'The directory to stop the nodes from')
      .argument('[num]', 'Number of nodes to stop inside of [network_dir]')
      .action(actions.stop)
  },
  restart(prog, namespace) {
    prog
      .command(`${namespace ? namespace + ' ' : ''}restart-net`, 'Restart nodes or archivers')
      .alias('restart')
      // .argument('[network_dir]', 'The directory to stop the nodes from')
      .option('-a, --archivers <archivers_count>', 'Number of archivers to restart')
      .option('-ap, --archiverPort <archivers_port>', 'Archiver port number to restart')
      .option('-n, --num <num>', 'Number of nodes to restart inside of [network_dir]')
      .option('-d, --dir <network_dir>', 'The directory to stop the nodes from')
      .argument('[num]', 'Number of nodes to restart inside of [network_dir]')
      .action(actions.restart)
  },
  clean(prog, namespace) {
    prog
      .command(`${namespace ? namespace + ' ' : ''}clean-net`, 'Clean the state of all instances in a test net')
      .alias('clean')
      // .argument('[network_dir]', 'The directory to clean the nodes from')
      // .option('-n, --num <num>', 'Number of nodes to clean inside of [network_dir]')
      .option('-d, --dir <network_dir>', 'The directory to clean the nodes from')
      .argument('[num]', 'Number of nodes to clean inside of [network_dir]')
      .action(actions.clean)
  },
  config(prog, namespace) {
    prog
      .command(`${namespace ? namespace + ' ' : ''}config-net`, 'Set the config file for all nodes in the network directory')
      .alias('config')
      // .argument('[network_dir]', 'The directory to set config.json for all instances')
      .option('-d, --dir <network_dir>', 'The directory to set config.json for all instances')
      .action(actions.config)
  },
  list(prog, namespace) {
    prog
      .command(`${namespace ? namespace + ' ' : ''}list-net`, 'List all the shardus pm2 processes')
      .alias('ls')
      // .argument('[network_dir]', 'The directory to stop the nodes from')
      .option('-d, --dir <network_dir>', 'The directory to list processes from')
      .action(actions.list)
  },
  pm2(prog, namespace) {
    prog
      .command(`${namespace ? namespace + ' ' : ''}pm2`, 'Run a pm2 command in the test network dir')
      // .argument('<network_dir>', 'The directory to run the pm2 command in')
      .option('-d, --dir <network_dir>', 'The directory to run the pm2 command in')
      .argument('[commands...]', 'pm2 commands to run')
      .action(actions.pm2)
  },
  coverage(prog, namespace) {
    prog
      .command(`${namespace ? namespace + ' ' : ''}coverage`, 'Manage code coverage data for a test network')
      .option('-d, --dir <network_dir>', 'The directory containing the coverage data (defaults to ./instances)')
      .option('--tool <tool>', 'Override the coverage tool specified in the network config (istanbul or c8)')
      .option('--outputdir <output_dir>', 'The output directory for coverage data within the network directory (defaults to coverage)')
      .option('--global', 'Force using globally installed coverage tools (npm install -g nyc/c8)')
      .option('--verbose', 'Show more detailed output during operations')
      .argument('<operation>', 'Operation to perform: clean, clean-merged, merge, or status')
      .complete(() => ['clean', 'clean-merged', 'clear', 'merge', 'status'])
      .action(actions.coverage)
  }
}

module.exports = register
