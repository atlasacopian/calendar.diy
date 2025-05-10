import fs from 'fs';
import jwt from 'jsonwebtoken';

// --- START: Fill these in ---
const privateKeyPath = '/Users/atlasacopian/keys/AuthKey_VMZ3S2625D.p8'; // <--- Updated to new .p8
const teamId = '5GLF6W84MA';                                           // <--- YOUR TEAM ID
const clientId = 'diy.calendar.calendardiy';                             // <--- Using your APP ID as client for this approach
const keyId = 'VMZ3S2625D';                                             // <--- Updated to new Key ID
// --- END: Fill these in ---

const privateKey = fs.readFileSync(privateKeyPath);
const now = Math.floor(Date.now() / 1000);
const oneDay = 24 * 60 * 60; // 24 hours in seconds

const payload = {
  iss: teamId,
  iat: now,
  exp: now + oneDay, // Expires in 24 hours (max 6 months, but Supabase will re-sign often)
  aud: 'https://appleid.apple.com',
  sub: clientId,
};

const token = jwt.sign(payload, privateKey, {
  algorithm: 'ES256',
  header: {
    alg: 'ES256',
    kid: keyId,
  },
});

console.log(token); 