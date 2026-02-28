import { google } from 'googleapis';
import fs from 'fs';
import readline from 'readline';

const credentials = JSON.parse(
  fs.readFileSync(`${__dirname}/credentials/drive-oauth-client.json`, 'utf8')
);

const { client_id, client_secret, redirect_uris } =
  credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

console.log('Authorize this app by visiting this URL:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nPaste the code here: ', async (code) => {
  const { tokens } = await oAuth2Client.getToken(code.trim());
  fs.writeFileSync('credentials/drive-token.json', JSON.stringify(tokens));
  console.log('\n✅ drive-token.json created');
  rl.close();
});