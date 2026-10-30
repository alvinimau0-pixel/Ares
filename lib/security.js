const crypto = require("node:crypto");

const ALLOWED_ORIGINS = new Set([
  "https://ares-intelligence.vercel.app",
  "https://ares-intelligence-gm-2030.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(status === 204 ? "" : JSON.stringify(body));
}
function originAllowed(req) { const origin=req.headers.origin; return !origin || ALLOWED_ORIGINS.has(origin); }
function cors(req,res) {
  const origin=req.headers.origin;
  if(origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");
    res.setHeader("Access-Control-Allow-Credentials","true");
    res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
  }
}
function cookieValue(req,name) {
  for(const part of (req.headers.cookie||"").split(";")) {
    const [key,...rest]=part.trim().split("=");if(key===name)return decodeURIComponent(rest.join("="));
  }return "";
}
function sign(value,secret){return crypto.createHmac("sha256",secret).update(value).digest("base64url");}
function createSession(secret) {
  const payload=Buffer.from(JSON.stringify({exp:Date.now()+8*60*60*1000,nonce:crypto.randomBytes(16).toString("hex")})).toString("base64url");
  return payload+"."+sign(payload,secret);
}
function validSession(req) {
  const secret=process.env.ARES_SESSION_SECRET;if(!secret||secret.length<32)return false;
  const token=cookieValue(req,"ares_session");const [payload,signature]=token.split(".");
  if(!payload||!signature)return false;const expected=sign(payload,secret),a=Buffer.from(signature),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return false;
  try{const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));return Number.isFinite(data.exp)&&data.exp>Date.now();}catch{return false;}
}
function requireSession(req,res){if(!validSession(req)){send(res,401,{error:"Sign in to Ares to use this service.",code:"AUTH_REQUIRED"});return false;}return true;}
module.exports={send,cors,originAllowed,createSession,validSession,requireSession};
