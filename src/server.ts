import express from "express";
import path from "path";
import http from "http";
import https from "https";
import session from 'express-session';
import fs from 'fs';
import { LtiController } from './lti/lti';

const LOCAL_HTTPS = true;
const LOCAL_HTTPS_CONFIG = LOCAL_HTTPS ? {
  key: fs.readFileSync(path.join(__dirname, './cert/key.pem')).toString(),
  cert: fs.readFileSync(path.join(__dirname, './cert/cert.pem')).toString()
} : null;
// for self signed https cert for local https dev must add this self-signed cert to be trusted
//   openssl req -x509 -newkey rsa:2048 -keyout src/cert/keytmp.pem -out src/cert/cert.pem -days 365
//   openssl rsa -in src/cert/keytmp.pem -out src/cert/key.pem
//   sudo security add-trusted-cert -d -r trustRoot -p ssl -k /Library/Keychains/System.keychain src/cert/cert.pem 

function expressSetup() {
  // Create a new express application instance
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(session({
    name: 'sid',
    secret: 'fluffhead',
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'none', secure: true },
  }));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '/views'));


  app.use('/lti', new LtiController().router);
  return app;
}

// Start the Server
export function startServer(): Promise<http.Server | https.Server> {
  return new Promise((resolve, reject) => {
    const app = expressSetup();
    const port = process.env.PORT ? process.env.PORT : 3000;
    const server = LOCAL_HTTPS_CONFIG
      ? https.createServer(LOCAL_HTTPS_CONFIG, app).listen(port)
      : app.listen(port);

    server
      .once("listening", () => {
        const proto = LOCAL_HTTPS ? 'https' : 'http'
        console.log(`Listening at ${proto}://localhost:${port}/`);
        resolve(server);
      })
      .once("error", reject);
  });
}

if (require.main === module) {
  startServer().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
