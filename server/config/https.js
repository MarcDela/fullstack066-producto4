const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Crea un servidor HTTPS con certificados autofirmados.
 * Para generar certificados de desarrollo:
 * openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.cert -days 365 -nodes -subj "/CN=localhost"
 * 
 * @param {Express.Application} app - Instancia de Express
 * @returns {https.Server} Servidor HTTPS configurado
 */
function createHTTPSServer(app) {
  const certsPath = path.join(__dirname, '../certs');

  // Verificar que existen los certificados
  const keyPath = path.join(certsPath, 'server.key');
  const certPath = path.join(certsPath, 'server.cert');

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.warn('⚠️ Certificados HTTPS no encontrados. Usando HTTP como fallback.');
    console.warn('   Genera certificados con: npm run generate-certs');
    return null;
  }

  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  return https.createServer(options, app);
}

module.exports = { createHTTPSServer };
