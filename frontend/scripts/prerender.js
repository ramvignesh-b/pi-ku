import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function prerender() {
  console.log('Starting preview server...');
  
  // We start a simple preview server on port 4173 to serve the built dist directory
  const preview = spawn('npm', ['run', 'preview', '--', '--port', '4173'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore'
  });

  // Give the server a moment to start
  await new Promise(r => setTimeout(r, 2000));

  try {
    console.log('Launching Playwright browser...');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    console.log('Navigating to homepage...');
    // Navigate to the root homepage
    await page.goto('http://localhost:4173/');
    
    // Wait for network to be completely idle (meaning React has fully rendered and data fetched)
    await page.waitForLoadState('networkidle');
    // Also wait a tiny bit extra just in case Suspense is doing something
    await page.waitForTimeout(500);

    // Get the final HTML
    const html = await page.content();
    
    // Write it back to dist/index.html
    const distPath = path.resolve(__dirname, '../dist/index.html');
    fs.writeFileSync(distPath, html);
    
    console.log('Successfully saved pre-rendered HTML to dist/index.html');
    await browser.close();
  } catch (err) {
    console.error('Failed to prerender:', err);
    process.exitCode = 1;
  } finally {
    preview.kill();
    process.exit();
  }
}

prerender();
