import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';

import unzipper from 'unzipper';

export async function createFromTemplate(templateUrl, projectDir) {
  const downloadFile = path.join(projectDir, 'tmp.zip');
  try {
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(`Template download failed with HTTP ${response.status}`);
    }
    await fsPromises.writeFile(
      downloadFile,
      Buffer.from(await response.arrayBuffer()),
    );
    await fs.createReadStream(downloadFile)
      .pipe(unzipper.Extract({ path: projectDir }))
      .promise();
  } finally {
    await fsPromises.rm(downloadFile, { force: true });
  }
}
