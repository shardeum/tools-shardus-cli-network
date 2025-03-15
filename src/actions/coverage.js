const fs = require('fs')
const path = require('path')
const util = require('../lib/util')
const { exec } = require('child_process')
const { promisify } = require('util')

const execPromise = promisify(exec)

/**
 * Recursively remove a directory and its contents
 * @param {string} dirPath - Path to the directory to remove
 */
function rimraf(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((entry) => {
      const entryPath = path.join(dirPath, entry)
      if (fs.lstatSync(entryPath).isDirectory()) {
        rimraf(entryPath)
      } else {
        fs.unlinkSync(entryPath)
      }
    })
    fs.rmdirSync(dirPath)
  }
}

/**
 * Find the path to an executable by name
 * @param {string} executable - Name of the executable to find
 * @returns {Promise<string>} Path to the executable
 */
async function which(executable) {
  try {
    const { stdout } = await execPromise(`which ${executable}`)
    return stdout.trim()
  } catch (error) {
    throw new Error(`${executable} not found in PATH`)
  }
}

/**
 * Handle coverage operations for the Shardus network
 */
module.exports = async (args, options) => {
  try {
    let networkDir = options.dir || '.'
    
    // Convert relative path to absolute
    if (!path.isAbsolute(networkDir)) {
      networkDir = path.resolve(process.cwd(), networkDir)
    }
    
    // Look for network-config.json in the specified directory
    let configPath = path.join(networkDir, 'network-config.json')
    let coverageConfig = { outputDir: 'coverage', tool: 'off' }
    let foundConfig = false
    
    // Try to load network config from the specified directory
    try {
      if (fs.existsSync(configPath)) {
        const networkConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        coverageConfig = networkConfig.coverage || coverageConfig
        foundConfig = true
      }
    } catch (error) {
      // Will try other locations
    }
    
    // If not found, check in 'instances' subdirectory
    if (!foundConfig) {
      const instancesDir = path.join(networkDir, 'instances')
      console.log(`Looking for network-config.json in ${instancesDir}...`)
      
      if (fs.existsSync(instancesDir)) {
        configPath = path.join(instancesDir, 'network-config.json')
        
        try {
          if (fs.existsSync(configPath)) {
            const networkConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
            coverageConfig = networkConfig.coverage || coverageConfig
            networkDir = instancesDir // Update network directory to instances folder
            foundConfig = true
          }
        } catch (error) {
          // Will continue with default settings
        }
      }
    }
    
    if (!foundConfig) {
      console.log(`Note: Could not find network-config.json. Using default coverage settings.`)
    }
    
    const operation = args.operation || 'status'
    const coverageDir = path.join(networkDir, options.outputdir || coverageConfig.outputDir || 'coverage')
    const verbose = options.verbose || false

    console.log(`Performing coverage ${operation} operation...`)
    
    // Check if coverage directory exists
    if (!fs.existsSync(coverageDir)) {
      console.log(`Coverage directory not found: ${coverageDir}`)
      console.log(`Make sure you've enabled coverage in your network-config.json and run some tests.`)
      return
    }
    
    const coverageTool = options.tool || coverageConfig.tool || 'istanbul'
    
    // Check if global flag is set
    if (options.global) {
      // Try to determine if the required tools are installed globally
      try {
        const toolBinary = coverageTool === 'c8' ? 'c8' : 'nyc'
        const { stdout } = await execPromise(`which ${toolBinary}`)
        if (verbose) {
          console.log(`Using globally installed ${toolBinary} at: ${stdout.trim()}`)
        }
      } catch (error) {
        console.error(`Error: ${coverageTool === 'c8' ? 'c8' : 'nyc'} is not installed globally.`)
        console.error(`Please install it using: npm install -g ${coverageTool === 'c8' ? 'c8' : 'nyc'}`)
        process.exit(1)
      }
    }
    
    // Print some info about the directories being used
    if (verbose) {
      console.log(`Network directory: ${networkDir}`)
      console.log(`Coverage directory: ${coverageDir}`)
    }
    
    // Perform the requested operation
    switch (operation) {
      case 'clean':
      case 'clear': // Keep backward compatibility for now
        await cleanCoverage(coverageDir, verbose)
        break
      case 'clean-merged':
        await cleanMergedCoverage(coverageDir, verbose)
        break
      case 'merge':
        await mergeCoverage(coverageDir, { 
          tool: coverageTool, 
          outputDir: options.outputdir || coverageConfig.outputDir || 'coverage', 
          global: options.global || false,
          verbose 
        })
        break
      case 'status':
      default:
        displayCoverageStatus(coverageDir)
        break
    }
  } catch (error) {
    console.error(`Error performing coverage operation: ${error.message}`)
    console.error(error.stack)
    process.exit(1)
  }
}

/**
 * Clean coverage data from the coverage directory
 */
async function cleanCoverage(coverageDir, verbose) {
  console.log(`Cleaning coverage data from ${coverageDir}...`)
  
  // Track deleted items
  let deletedCount = 0
  
  // First clean up the coverage directory
  if (fs.existsSync(coverageDir)) {
    // Read all directories in the coverage folder
    const items = fs.readdirSync(coverageDir)
    
    // Delete each item in the directory
    for (const item of items) {
      const itemPath = path.join(coverageDir, item)
      
      if (fs.lstatSync(itemPath).isDirectory()) {
        if (verbose) {
          console.log(`Deleting directory: ${itemPath}`)
        }
        rimraf(itemPath)
        deletedCount++
      } else {
        if (verbose) {
          console.log(`Deleting file: ${itemPath}`)
        }
        fs.unlinkSync(itemPath)
        deletedCount++
      }
    }
  } else {
    console.log('Coverage directory does not exist, nothing to clean')
  }
  
  // Next, clean up the wrapper scripts in the parent directory
  // These are files like .nyc-wrapper-shardus-instance-9011.sh
  const instancesDir = path.dirname(coverageDir)  // Parent directory of the coverage dir
  
  if (fs.existsSync(instancesDir)) {
    const wrapperFiles = fs.readdirSync(instancesDir)
      .filter(file => file.match(/^\.nyc-wrapper-.*\.sh$/))
    
    for (const file of wrapperFiles) {
      const filePath = path.join(instancesDir, file)
      if (verbose) {
        console.log(`Deleting wrapper script: ${filePath}`)
      }
      fs.unlinkSync(filePath)
      deletedCount++
    }
    
    if (wrapperFiles.length > 0 && verbose) {
      console.log(`Deleted ${wrapperFiles.length} wrapper scripts from ${instancesDir}`)
    }
  }
  
  console.log(`Coverage data cleaned successfully (${deletedCount} items removed)`)
}

/**
 * Clean only merged coverage data from the coverage directory
 */
async function cleanMergedCoverage(coverageDir, verbose) {
  console.log(`Cleaning merged coverage data from ${coverageDir}...`)
  
  // Track deleted items
  let deletedCount = 0
  
  // Clean up the merged directories in the coverage folder
  if (fs.existsSync(coverageDir)) {
    // Read all directories in the coverage folder
    const items = fs.readdirSync(coverageDir)
    
    // Delete only the merged directories
    for (const item of items) {
      if (item.startsWith('merged-') || item === 'temp-') {
        const itemPath = path.join(coverageDir, item)
        
        if (fs.lstatSync(itemPath).isDirectory()) {
          if (verbose) {
            console.log(`Deleting merged directory: ${itemPath}`)
          }
          rimraf(itemPath)
          deletedCount++
        }
      }
    }
    
    // Also remove index.html from the coverage directory if it exists
    const indexPath = path.join(coverageDir, 'index.html')
    if (fs.existsSync(indexPath)) {
      if (verbose) {
        console.log(`Deleting index file: ${indexPath}`)
      }
      fs.unlinkSync(indexPath)
      deletedCount++
    }
  } else {
    console.log('Coverage directory does not exist, nothing to clean')
  }
  
  console.log(`Merged coverage data cleaned successfully (${deletedCount} items removed)`)
}

/**
 * Merge coverage data by type and generate reports
 * @param {string} coverageDir - Directory containing coverage data
 * @param {object} options - Options for merging coverage data
 * @returns {Promise<void>}
 */
async function mergeCoverage(coverageDir, options) {
  const { tool = 'istanbul', outputDir = 'coverage', global = false, verbose = false } = options

  if (verbose) {
    console.log(`Merging coverage data from ${coverageDir}`)
    console.log(`Using coverage tool: ${tool}`)
    console.log(`Output directory: ${outputDir}`)
  }

  if (!fs.existsSync(coverageDir)) {
    console.error(`Error: Coverage directory ${coverageDir} does not exist`)
    return
  }

  // Create output directory if it doesn't exist
  const finalOutputDir = outputDir.startsWith('/') ? outputDir : path.join(coverageDir, '..', outputDir)
  if (!fs.existsSync(finalOutputDir)) {
    fs.mkdirSync(finalOutputDir, { recursive: true })
  }

  // Dictionary to track coverage files by process type
  const processCoverage = {}
  
  // Flag to track if any coverage files were found
  let foundCoverageFiles = false

  // Scan the coverage directory for coverage data
  const items = fs.readdirSync(coverageDir)
  for (const item of items) {
    const itemPath = path.join(coverageDir, item)
    const stats = fs.statSync(itemPath)
    
    if (stats.isDirectory()) {
      // Extract the process type from the directory name
      // e.g., "shardus-instance-9001" -> "shardus-instance"
      const match = item.match(/^([a-zA-Z\-]+)-\d+/)
      if (!match) continue
      
      const processType = match[1]
      if (!processCoverage[processType]) {
        processCoverage[processType] = []
      }
      
      // Check for .nyc_output directory
      const nycOutputPath = path.join(itemPath, '.nyc_output')
      if (fs.existsSync(nycOutputPath)) {
        if (verbose) {
          console.log(`Found .nyc_output in ${itemPath}`)
        }
        processCoverage[processType].push({ 
          type: 'nyc',
          path: nycOutputPath,
          processDir: item
        })
        foundCoverageFiles = true
      }
      
      // Check for coverage-final.json file
      const coverageFinalPath = path.join(itemPath, 'coverage-final.json')
      if (fs.existsSync(coverageFinalPath)) {
        if (verbose) {
          console.log(`Found coverage-final.json in ${itemPath}`)
        }
        processCoverage[processType].push({ 
          type: 'coverage-final',
          path: coverageFinalPath,
          processDir: item
        })
        foundCoverageFiles = true
      }
      
      // Check for v8.json file (for C8)
      const v8Path = path.join(itemPath, 'v8.json')
      if (fs.existsSync(v8Path)) {
        if (verbose) {
          console.log(`Found v8.json in ${itemPath}`)
        }
        processCoverage[processType].push({ 
          type: 'v8',
          path: v8Path,
          processDir: item
        })
        foundCoverageFiles = true
      }
      
      // Check for lcov.info file
      const lcovPath = path.join(itemPath, 'lcov.info')
      if (fs.existsSync(lcovPath)) {
        if (verbose) {
          console.log(`Found lcov.info in ${itemPath}`)
        }
        processCoverage[processType].push({ 
          type: 'lcov',
          path: lcovPath,
          processDir: item
        })
        foundCoverageFiles = true
      }
    }
  }

  if (!foundCoverageFiles) {
    console.warn('Warning: No coverage files found in the specified directory.')
    console.warn('Make sure you have run the network with coverage enabled.')
    return
  }

  // Map process types to descriptive folder names
  const folderNameMap = {
    'shardus-instance': 'merged-validators',
    'archive-server': 'merged-archivers',
    'monitor-server': 'merged-monitor',
    'explorer-server': 'merged-explorer'
  }

  // Process coverage data by type
  for (const [processType, coverages] of Object.entries(processCoverage)) {
    if (coverages.length === 0) continue
    
    if (verbose) {
      console.log(`\nProcessing coverage for ${processType} (${coverages.length} files)`)
    }
    
    // Use descriptive folder names for merged reports
    const folderName = folderNameMap[processType] || `merged-${processType}`
    const processOutputDir = path.join(finalOutputDir, folderName)
    if (!fs.existsSync(processOutputDir)) {
      fs.mkdirSync(processOutputDir, { recursive: true })
    }
    
    // Create a temporary directory for merging
    const tempDir = path.join(finalOutputDir, `temp-${processType}`)
    if (fs.existsSync(tempDir)) {
      rimraf(tempDir)
    }
    fs.mkdirSync(tempDir, { recursive: true })

    // Create lcov directory for lcov files
    const lcovDir = path.join(tempDir, 'lcov')
    fs.mkdirSync(lcovDir, { recursive: true })
    
    // Handle different coverage file types
    const nycFiles = coverages.filter(c => c.type === 'nyc')
    const coverageFinalFiles = coverages.filter(c => c.type === 'coverage-final')
    const v8Files = coverages.filter(c => c.type === 'v8')
    const lcovFiles = coverages.filter(c => c.type === 'lcov')
    
    // Handle LCOV files if found
    if (lcovFiles.length > 0) {
      if (verbose) {
        console.log(`Found ${lcovFiles.length} lcov.info files for ${processType}`)
      }
      
      // Copy lcov files to temp directory
      lcovFiles.forEach((lcovFile, index) => {
        const destPath = path.join(lcovDir, `lcov-${index}.info`)
        if (verbose) {
          console.log(`Copying ${lcovFile.path} to ${destPath}`)
        }
        fs.copyFileSync(lcovFile.path, destPath)
      })
      
      // Merge lcov files
      const mergedLcovPath = path.join(processOutputDir, 'lcov.info')
      
      try {
        // Try using lcov-combine if available
        await which('lcov-combine')
        if (verbose) {
          console.log(`Using lcov-combine to merge lcov files`)
        }
        const lcovFilePaths = fs.readdirSync(lcovDir)
          .map(file => path.join(lcovDir, file))
          .join(' ')
        
        await execPromise(`lcov-combine ${lcovFilePaths} > ${mergedLcovPath}`)
        console.log(`Merged ${lcovFiles.length} lcov files to ${mergedLcovPath}`)
        
        // Generate HTML report using genhtml if available
        try {
          await which('genhtml')
          if (verbose) {
            console.log(`Generating HTML report from merged lcov data`)
          }
          
          const htmlReportDir = path.join(processOutputDir, 'html')
          await execPromise(`genhtml ${mergedLcovPath} --output-directory ${htmlReportDir}`)
          console.log(`Generated HTML report in ${htmlReportDir}`)
          
          // Create an index.html in the output directory that redirects to the HTML report
          const indexPath = path.join(finalOutputDir, 'index.html')
          const indexContent = `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url='${folderName}/html/index.html'" />
  <title>Coverage Report</title>
</head>
<body>
  <p>Redirecting to <a href="${folderName}/html/index.html">coverage report</a>...</p>
</body>
</html>
          `.trim()
          
          fs.writeFileSync(indexPath, indexContent)
        } catch (error) {
          // If genhtml not found, try with more fallback options
          try {
            const htmlReportDir = path.join(processOutputDir, 'html')
            console.log(`Generating HTML report with fallback options...`)
            await execPromise(`genhtml ${mergedLcovPath} --output-directory ${htmlReportDir} --ignore-errors source,category --synthesize-missing`)
            console.log(`Generated HTML report in ${htmlReportDir}`)
            
            // Create an index.html in the output directory that redirects to the HTML report
            const indexPath = path.join(finalOutputDir, 'index.html')
            const indexContent = `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url='${folderName}/html/index.html'" />
  <title>Coverage Report</title>
</head>
<body>
  <p>Redirecting to <a href="${folderName}/html/index.html">coverage report</a>...</p>
</body>
</html>
            `.trim()
            
            fs.writeFileSync(indexPath, indexContent)
          } catch (nestedError) {
            console.warn(`Warning: genhtml not found or failed, skipping HTML report generation`)
            console.warn(`Install lcov to generate HTML reports: apt-get install lcov or brew install lcov`)
          }
        }
      } catch (error) {
        // Fallback to manual concatenation
        if (verbose) {
          console.log(`lcov-combine not found, using manual concatenation`)
        }
        
        // Concatenate all lcov files
        let mergedContent = ''
        for (const lcovFile of fs.readdirSync(lcovDir)) {
          const content = fs.readFileSync(path.join(lcovDir, lcovFile), 'utf8')
          mergedContent += content + '\n'
        }
        fs.writeFileSync(mergedLcovPath, mergedContent)
        console.log(`Merged ${lcovFiles.length} lcov files to ${mergedLcovPath}`)
        
        // Try to generate HTML report with fallback options if genhtml is available
        try {
          await which('genhtml')
          const htmlReportDir = path.join(processOutputDir, 'html')
          console.log(`Generating HTML report with fallback options...`)
          await execPromise(`genhtml ${mergedLcovPath} --output-directory ${htmlReportDir} --ignore-errors source,category --synthesize-missing`)
          console.log(`Generated HTML report in ${htmlReportDir}`)
          
          // Create an index.html in the output directory that redirects to the HTML report
          const indexPath = path.join(finalOutputDir, 'index.html')
          const indexContent = `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url='${folderName}/html/index.html'" />
  <title>Coverage Report</title>
</head>
<body>
  <p>Redirecting to <a href="${folderName}/html/index.html">coverage report</a>...</p>
</body>
</html>
          `.trim()
          
          fs.writeFileSync(indexPath, indexContent)
        } catch (genHtmlError) {
          console.warn(`Warning: lcov-combine and genhtml not found, merged lcov data without generating HTML report`)
          console.warn(`Install lcov to generate HTML reports: apt-get install lcov or brew install lcov`)
        }
      }
    }
    
    // Handle Istanbul/NYC coverage data (.nyc_output and coverage-final.json)
    if ((nycFiles.length > 0 || coverageFinalFiles.length > 0) && tool === 'istanbul') {
      if (verbose) {
        console.log(`Found Istanbul coverage files for ${processType}`)
      }
      
      // Determine nyc command based on global flag
      const nycCmd = global ? 'nyc' : './node_modules/.bin/nyc'
      
      try {
        // Check if nyc is available
        let nycPath
        try {
          nycPath = global ? await which('nyc') : path.resolve(process.cwd(), './node_modules/.bin/nyc')
          if (!global && !fs.existsSync(nycPath)) {
            throw new Error('nyc not found in node_modules')
          }
        } catch (error) {
          console.error(`Error: Istanbul/NYC coverage tool not found. ${global ? 'Install globally with npm install -g nyc' : 'Install locally with npm install --save-dev nyc'}`)
          continue
        }
        
        // Process .nyc_output directories
        if (nycFiles.length > 0) {
          if (verbose) {
            console.log(`Processing ${nycFiles.length} .nyc_output directories`)
          }
          
          // Create .nyc_output in temp dir
          const nycOutputDir = path.join(tempDir, '.nyc_output')
          fs.mkdirSync(nycOutputDir, { recursive: true })
          
          // Copy all JSON files from each .nyc_output to temp dir
          for (const nycFile of nycFiles) {
            const files = fs.readdirSync(nycFile.path)
            for (const file of files) {
              if (file.endsWith('.json')) {
                const srcPath = path.join(nycFile.path, file)
                const destPath = path.join(nycOutputDir, `${nycFile.processDir}-${file}`)
                if (verbose) {
                  console.log(`Copying ${srcPath} to ${destPath}`)
                }
                fs.copyFileSync(srcPath, destPath)
              }
            }
          }
          
          // Run nyc merge
          if (verbose) {
            console.log(`Running nyc merge on ${nycOutputDir}`)
          }
          await execPromise(`${nycCmd} merge ${nycOutputDir}`)
          
          // Run nyc report
          if (verbose) {
            console.log(`Generating coverage report in ${processOutputDir}`)
          }
          await execPromise(`${nycCmd} report --reporter=lcov --reporter=text --reporter=html --report-dir="${processOutputDir}"`)
          console.log(`Generated coverage report for ${processType} in ${processOutputDir}`)
        }
        
        // Process coverage-final.json files
        else if (coverageFinalFiles.length > 0) {
          if (verbose) {
            console.log(`Processing ${coverageFinalFiles.length} coverage-final.json files`)
          }
          
          // Copy and rename coverage-final.json files to temp dir
          for (const [index, coverageFinalFile] of coverageFinalFiles.entries()) {
            const destPath = path.join(tempDir, `coverage-final-${index}.json`)
            if (verbose) {
              console.log(`Copying ${coverageFinalFile.path} to ${destPath}`)
            }
            fs.copyFileSync(coverageFinalFile.path, destPath)
          }
          
          // Run nyc merge to combine JSON files
          if (verbose) {
            console.log(`Running nyc merge on JSON files in ${tempDir}`)
          }
          
          // Get all JSON files in temp dir
          const jsonFiles = fs.readdirSync(tempDir)
            .filter(file => file.endsWith('.json'))
            .map(file => path.join(tempDir, file))
            .join(' ')
          
          const outputFile = path.join(tempDir, 'coverage-final-merged.json')
          await execPromise(`${nycCmd} merge ${jsonFiles} --output-file ${outputFile}`)
          
          // Generate report from merged JSON
          if (verbose) {
            console.log(`Generating coverage report from merged JSON in ${processOutputDir}`)
          }
          await execPromise(`${nycCmd} report --reporter=lcov --reporter=text --reporter=html --report-dir="${processOutputDir}" --temp-dir="${tempDir}"`)
          console.log(`Generated coverage report for ${processType} in ${processOutputDir}`)
        }
      } catch (error) {
        console.error(`Error merging Istanbul coverage data: ${error.message}`)
        if (verbose) {
          console.error(error.stack)
        }
      }
    }
    
    // Handle C8 coverage data (v8.json)
    else if (v8Files.length > 0 && tool === 'c8') {
      if (verbose) {
        console.log(`Found C8 coverage files for ${processType}`)
      }
      
      // Determine c8 command based on global flag
      const c8Cmd = global ? 'c8' : './node_modules/.bin/c8'
      
      try {
        // Check if c8 is available
        let c8Path
        try {
          c8Path = global ? await which('c8') : path.resolve(process.cwd(), './node_modules/.bin/c8')
          if (!global && !fs.existsSync(c8Path)) {
            throw new Error('c8 not found in node_modules')
          }
        } catch (error) {
          console.error(`Error: C8 coverage tool not found. ${global ? 'Install globally with npm install -g c8' : 'Install locally with npm install --save-dev c8'}`)
          continue
        }
        
        // Copy v8 JSON files to temp dir
        for (const [index, v8File] of v8Files.entries()) {
          const destPath = path.join(tempDir, `v8-${index}.json`)
          if (verbose) {
            console.log(`Copying ${v8File.path} to ${destPath}`)
          }
          fs.copyFileSync(v8File.path, destPath)
        }
        
        // Run c8 merge
        if (verbose) {
          console.log(`Running c8 merge on JSON files in ${tempDir}`)
        }
        
        // Get all JSON files in temp dir
        const jsonFiles = fs.readdirSync(tempDir)
          .filter(file => file.startsWith('v8-') && file.endsWith('.json'))
          .map(file => path.join(tempDir, file))
          .join(' ')
        
        const outputFile = path.join(tempDir, 'v8-merged.json')
        await execPromise(`${c8Cmd} merge ${jsonFiles} --output-file ${outputFile}`)
        
        // Generate report from merged JSON
        if (verbose) {
          console.log(`Generating coverage report from merged JSON in ${processOutputDir}`)
        }
        await execPromise(`${c8Cmd} report --reporter=lcov --reporter=text --reporter=html --report-dir="${processOutputDir}" --temp-directory="${tempDir}"`)
        console.log(`Generated coverage report for ${processType} in ${processOutputDir}`)
      } catch (error) {
        console.error(`Error merging C8 coverage data: ${error.message}`)
        if (verbose) {
          console.error(error.stack)
        }
      }
    }
    
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      if (verbose) {
        console.log(`Cleaning up temporary directory ${tempDir}`)
      }
      rimraf(tempDir)
    }
  }
  
  console.log(`Coverage reports generated in ${finalOutputDir}`)
}

/**
 * Display status of coverage data
 */
function displayCoverageStatus(coverageDir) {
  console.log(`Coverage Status for ${coverageDir}:`)
  
  if (!fs.existsSync(coverageDir)) {
    console.log('Coverage directory does not exist')
    return
  }
  
  // Count the number of coverage reports
  const items = fs.readdirSync(coverageDir)
  
  const stats = {
    validators: 0,
    archivers: 0,
    monitor: 0,
    explorer: 0,
    merged: 0
  }
  
  // Count items by their type
  for (const item of items) {
    const itemPath = path.join(coverageDir, item)
    
    if (!fs.lstatSync(itemPath).isDirectory()) {
      continue
    }
    
    if (item.startsWith('shardus-instance-')) {
      stats.validators++
    } else if (item.startsWith('archive-server-')) {
      stats.archivers++
    } else if (item.startsWith('monitor-server')) {
      stats.monitor++
    } else if (item.startsWith('explorer-server')) {
      stats.explorer++
    } else if (item.startsWith('merged-')) {
      stats.merged++
    }
  }
  
  console.log(`Found:`)
  console.log(`  Validators: ${stats.validators}`)
  console.log(`  Archivers: ${stats.archivers}`)
  console.log(`  Monitor servers: ${stats.monitor}`)
  console.log(`  Explorer servers: ${stats.explorer}`)
  console.log(`  Merged reports: ${stats.merged}`)
  
  if (stats.validators + stats.archivers + stats.monitor + stats.explorer === 0) {
    console.log('\nNo coverage data found. Make sure you have enabled coverage in your network-config.json')
    console.log('and run some tests with coverage enabled.')
  } else {
    console.log('\nRun the following commands to manage coverage:')
    console.log('  shardus coverage merge - Merge coverage data and generate reports')
    console.log('  shardus coverage clean - Clean all coverage data')
    console.log('  shardus coverage clean-merged - Clean only merged coverage data')
  }
} 