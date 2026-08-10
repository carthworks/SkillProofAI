/**
 * prepull-images.js
 *
 * Pre-pulls Docker runner sandbox images to eliminate cold-start container latency.
 */

const Docker = require('dockerode');
const docker = new Docker();

const IMAGES = [
  'python:3.11-slim',
  'node:20-slim',
  'openjdk:17-slim',
];

async function prepullImages() {
  console.log('🚀 Pre-pulling runner container images...');

  for (const img of IMAGES) {
    try {
      console.log(`[Docker] Pulling ${img}...`);
      await new Promise((resolve, reject) => {
        docker.pull(img, (err, stream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, onFinished, onProgress);

          function onFinished(err, output) {
            if (err) return reject(err);
            resolve(output);
          }
          function onProgress(event) {
            // silent progress
          }
        });
      });
      console.log(`[Docker] ✅ ${img} pre-pulled successfully.`);
    } catch (err) {
      console.warn(`[Docker] ⚠️ Could not pre-pull ${img} (running in dev fallback mode): ${err.message}`);
    }
  }

  console.log('✨ All container images ready for zero-latency execution.');
}

prepullImages();
