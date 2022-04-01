'use strict';
const compress_images = require('compress-images');
const express = require('express');
const formidable = require('formidable');
const bodyParser = require('body-parser');
const process = require('process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const port = process.env.port || 3000;
const app = express();
const util = require('util');

app.use(formidable({uploadDir: './src/img/source', multiples: true}));
app.use(cors());
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', (req, res) => {
  const files = Object.values(req.files)[0];
  const writeFile = util.promisify(fs.writeFile);
  console.log('files ',files);
  Promise.all([...files].map(file => writeFile(path.join(__dirname,`/src/img/source/${file.name}`), fs.readFileSync(file.path))))
    .then(() => {
      cleanDir(path.join(__dirname,'/src/img/source/'),/^upload_/);
      cleanDir(path.join(__dirname,'/build/img/'),/.zip$/);
      res.status(200).json({response: 'ok'});})
    .catch((e) => {
      console.log('error', e); 
      res.status(500).json({message: e}); })
});
console.log('current directory', __dirname)
app.get('/download', (_req, res) => {
  compress()
  .then(() => zipFiles())
  .then(() => {
    cleanDir(path.join(__dirname, '/src/img/source'), /.(jpeg|jpg)$/);
    cleanDir(path.join(__dirname,'/src/img/combination'), /.(jpeg|jpg)$/);
    cleanDir(path.join(__dirname,'/build/img/'), /.(jpeg|jpg)$/);
    res.download(path.join(__dirname, '/build/img/', 'compressedImages.zip'));
  }).catch(() => {
    console.log('error');
  });
})

app.listen(port, () => {
  `listening on port ${port}`;
});

function compress() {
  return new Promise((resolve) => {
    compress_images(
      "./src/img/source/**/*.{jpg,JPG,jpeg,JPEG}",
      "./src/img/combination/",
      { compress_force: false, statistic: true, autoupdate: true },
      false,
      {
        jpg: {
          engine: "jpegtran",
          command: ["-trim", "-progressive", "-copy", "none", "-optimize"],
        },
      },
      { png: { engine: false, command: false } },
      { svg: { engine: false, command: false } },
      { gif: { engine: false, command: false } },
      function (_err, completed) {
        //[jpg(jpegtran)] ---to---> [jpg(mozjpeg)] WARNING!!! autoupdate  - recommended to turn this off, it's not needed here - autoupdate: false
        //----------------
        if (completed === true) {
          compress_images(
            "./src/img/combination/**/*.{jpg,JPG,jpeg,JPEG}",
            "./build/img/",
            { compress_force: false, statistic: true, autoupdate: false },
            false,
            { jpg: { engine: "mozjpeg", command: ["-quality", "70"] } },
            { png: { engine: false, command: false } },
            { svg: { engine: false, command: false } },
            { gif: { engine: false, command: false } },
            function (err, completed) {
              if (err) {
                fs.writeFile('./log', err.toString());
              }
              if (completed === true) {
                resolve();
              }
            }
          );
        }
      }
    );
  });
}

async function zipFiles() {
  try {
    const zip = new AdmZip();
    zip.addLocalFolder(path.join(__dirname,'/build/img'));
    zip.writeZip(path.join(__dirname,'/build/img/compressedImages.zip'));
  } catch(e) {
    console.log(e);
  }
}

function cleanDir(sourceDir, reg) {
  fs.readdir(sourceDir, (err, files) => {
    if (err) {
      fs.writeFileSync('./logs', err.toString());
    }
    [...files].forEach(f => {
      if (reg.test(f)) {
        fs.unlink(path.join(sourceDir, f), err => {
          if (err) {
            fs.writeFileSync('./logs', err.toString());
          }
        });
      }
    });
  })
}
