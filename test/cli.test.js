// First, mock external dependencies and internal modules
jest.mock("fs");
jest.mock("execa");
jest.mock("../src/lib/util");
jest.mock("../src/lib/list");
jest.mock("../src/lib/start");
jest.mock("../src/lib/stop");

// Now import modules
const fs = require("fs");
const execa = require("execa");
const util = require("../src/lib/util");
const listLib = require("../src/lib/list");
const startLib = require("../src/lib/start");
const stopLib = require("../src/lib/stop");

// Import the action handlers directly
const listAction = require("../src/actions/list");
const startAction = require("../src/actions/start");
const stopAction = require("../src/actions/stop");

describe("CLI Actions Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup fs mock
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue('{"version": "1.0.0"}');

    // Setup execa mock
    execa.command = jest.fn().mockResolvedValue({});

    // Mock util functions
    util.setNetworkDirOrErr = jest.fn().mockReturnValue("/mock/network/dir");
    util.pm2List = jest.fn().mockResolvedValue({});
    util.checkNetworkFolder = jest.fn().mockReturnValue(true);
  });

  test("list action should call util.setNetworkDirOrErr and list library", () => {
    // Execute the list action
    const args = {};
    const options = { dir: "/test/network/dir" };
    const logger = console;

    listAction(args, options, logger);

    // Verify correct functions were called
    expect(util.setNetworkDirOrErr).toHaveBeenCalledWith("/test/network/dir");
    expect(listLib).toHaveBeenCalledWith("/mock/network/dir");
  });

  test("start action should call util.setNetworkDirOrErr", () => {
    // Mock return value for startLib
    startLib.mockResolvedValue({});

    // Execute the start action with minimal parameters to avoid deeper execution
    const args = {};
    const options = { dir: "/test/network/dir" };
    const logger = console;

    startAction(args, options, logger);

    // Verify correct functions were called
    expect(util.setNetworkDirOrErr).toHaveBeenCalledWith("/test/network/dir");
  });

  test("stop action should call util.setNetworkDirOrErr", () => {
    // Mock return value
    stopLib.mockResolvedValue({});

    // Execute the stop action with minimal parameters
    const args = {};
    const options = { dir: "/test/network/dir" };
    const logger = console;

    stopAction(args, options, logger);

    // Verify correct functions were called
    expect(util.setNetworkDirOrErr).toHaveBeenCalledWith("/test/network/dir");
  });
});
