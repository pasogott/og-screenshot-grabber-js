/**
 * Configuration helpers for environment variables and validation
 */

/**
 * Parse and validate integer environment variable
 */
export function getEnvInt(name: string, fallback: number): number {
  const val = process.env[name];
  if (!val) return fallback;

  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed < 0) {
    console.error(`Warning: Invalid ${name}="${val}", using default ${fallback}`);
    return fallback;
  }

  return parsed;
}

/**
 * Get string environment variable with validation
 */
export function getEnvString(name: string, fallback: string): string {
  const val = process.env[name];
  if (!val) return fallback;

  // Basic validation - trim whitespace
  const trimmed = val.trim();
  if (!trimmed) {
    console.error(`Warning: Empty ${name}, using default "${fallback}"`);
    return fallback;
  }

  return trimmed;
}

/**
 * Show current configuration (for --show-config)
 */
export function showConfiguration(options: any): void {
  console.log('Current Configuration:');
  console.log(`  output:   ${options.output}${options.output === 'output' ? ' (default)' : ''}`);
  console.log(`  parallel: ${options.parallel}${options.parallel === 10 ? ' (default)' : ''}`);
  console.log(`  timeout:  ${options.timeout}ms${options.timeout === 45000 ? ' (default)' : ''}`);
  console.log(`  width:    ${options.width}${options.width === 1200 ? ' (default)' : ''}`);
  console.log(`  height:   ${options.height}${options.height === 2000 ? ' (default)' : ''}`);
  console.log(`  scale:    ${options.scale}${options.scale === 0.8 ? ' (default)' : ''}`);
  console.log();

  console.log('Environment Variables:');
  const envVars = [
    'OG_SCREENSHOT_OUTPUT_DIR',
    'OG_SCREENSHOT_PARALLEL',
    'OG_SCREENSHOT_TIMEOUT',
    'OG_SCREENSHOT_WIDTH',
    'OG_SCREENSHOT_HEIGHT',
    'NO_COLOR',
  ];

  envVars.forEach((varName) => {
    const value = process.env[varName];
    const status = value ? `"${value}"` : '(not set)';
    console.log(`  ${varName.padEnd(28)} ${status}`);
  });
}
