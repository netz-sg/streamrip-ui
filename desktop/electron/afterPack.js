/**
 * electron-builder afterPack hook
 * Runs AFTER the app is packed but BEFORE the DMG/installer is created.
 * Ad-hoc signs the .app so macOS Gatekeeper doesn't silently block it.
 */
exports.default = async function (context) {
  if (process.platform !== 'darwin') return;

  const { execSync } = require('child_process');
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${context.appOutDir}/${appName}.app`;

  console.log(`[afterPack] Ad-hoc signing: ${appPath}`);
  try {
    execSync(`codesign --force --deep --sign - "${appPath}"`, {
      stdio: 'inherit',
    });
    console.log('[afterPack] Ad-hoc signing complete');
  } catch (err) {
    console.warn('[afterPack] Ad-hoc signing failed:', err.message);
  }
};
