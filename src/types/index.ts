/**
 * Type definitions for og-screenshot-grabber
 */

export interface ScreenshotOptions {
  width: number;
  height: number;
  scale: number;
  fullPage: boolean;
  verbose: boolean;
  quiet: boolean;
  parallel: number;
  output: string;
  timeout: number;
  dryRun: boolean;
}

export interface ScreenshotResult {
  status: 'success' | 'error';
  url: string;
  finalUrl?: string;
  png?: string;
  json?: string;
  timestamp?: string;
  uuid?: string;
  error?: string;
}

export interface ScreenshotMetadata {
  uuid: string;
  timestamp: string;
  url: string;
  input_url: string;
  visibleHTML: string;
  image_filename: string;
}

export interface OutputFormat {
  mode: 'default' | 'plain' | 'json';
  isTTY: boolean;
}
