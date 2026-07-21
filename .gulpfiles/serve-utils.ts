export function createBrowserSyncOptions(projectConfig, resolveFiles) {
  const config = projectConfig.browserSync;
  return {
    proxy: `http://localhost:${projectConfig.app.port}`,
    files: resolveFiles(config.files || []),
    port: config.port,
    ui: {
      port: config.ui_port,
    },
    reloadDelay: config.reloadDelay,
    open: false,
    notify: config.notify,
    scriptPath: config.domain && function (scriptPath) {
      return `//${config.domain}${scriptPath}`;
    },
    socket: {
      domain: config.domain,
    },
  };
}

export function reloadBrowserSync(config, instance) {
  if (!config.enabled || !instance.active) {
    return false;
  }
  instance.reload({ stream: false });
  return true;
}
