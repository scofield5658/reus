import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';

import defaultConfig from './.config/index.js';

const require = createRequire(import.meta.url);

export function getProjectDir() {
  return process.env.REUS_PROJECT_DIR;
}

export function getProjectConfig() {
  const projectDir = getProjectDir();
  const ext_config = fs.existsSync(path.join(projectDir, 'project.config.json'))
    ? require(path.join(projectDir, 'project.config.json'))
    : {};
  return Object.assign({}, defaultConfig, ext_config);
}

export async function getAppConfig() {
  const env = process.env.REUS_PROJECT_ENV;
  const projectDir = getProjectDir();
  const sourceDir = (!env || env === 'dev') ? 'src' : 'dist';
  const configPath = path.join(projectDir, sourceDir, 'app.config.js');
  if (!fs.existsSync(configPath)) {
    return {};
  }
  const url = pathToFileURL(configPath).href;
  const mod = await import(url);
  return mod.default ?? mod;
}

export function getProjectFilePath(files = []) {
  const projectDir = getProjectDir();
  const results = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (path.isAbsolute(file)) {
      results.push(file);
    } else {
      results.push(path.join(projectDir, file));
    }
  }
  return results;
}

export function getPlugins() {
  const projectConfig = getProjectConfig();
  return projectConfig.plugins || [];
}

export function getPlugin(name) {
  const projectDir = getProjectDir();
  if (!name) {
    throw 'plugin name is not specific';
  }

  if (!fs.existsSync(path.join(projectDir, 'node_modules', name))) {
    throw `${name} not found in node_modules`;
  }

  const packageInfo = require(path.join(projectDir, 'node_modules', name, 'package.json'));
  const entry = packageInfo.main || 'index.js';

  if (!fs.existsSync(path.join(projectDir, 'node_modules', name, entry))) {
    throw `${name} has no entry`;
  }

  const handler = require(path.join(projectDir, 'node_modules', name, entry));
  return handler;
}

const absDest = (relpath) => {
  const projectDir = getProjectDir();
  return path.join(projectDir, 'dist', relpath).replace(/\//gmi, path.sep);
};

export function renderStatic(ctx, filepath) {
  return new Promise((resolve) => {
    fs.readFile(absDest(filepath), 'binary', (err, data) => {
      if (err) {
        ctx.type = 'text/html;charset=utf-8';
        ctx.body = err.message;
        resolve();
        return;
      }
      ctx.type = 'text/html;charset=utf-8';
      ctx.body = data;
      resolve();
    });
  });
}
