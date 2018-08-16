import { app, BrowserWindow, screen } from 'electron';
import * as url from 'url';
import { exec } from 'child_process';
import { appendFile } from 'fs';

let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');


try {
  require('dotenv').config();
} catch {
  console.log('asar');
}

function createWindow() {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    //width: size.width,
    width: 800,
    height: size.height
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }



  //win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}



function getChapters(ffmpegoutput) {
  const regxp = /.*Chapter #(\d+:\d+): start (\d+\.\d+), end (\d+\.\d+).*/g;
  let match = regxp.exec(ffmpegoutput);
  const res = [];
  while (match != null) {
    res.push({ start: match[2], end: match[3], name: match[1] });
    match = regxp.exec(ffmpegoutput);
  }

  return res;
}

function getTitle(ffmpegoutput) {
  const regxp = /.*title.*: (.*)/g;
  const match = regxp.exec(ffmpegoutput);

  return match[1];
}

function getAuthor(ffmpegoutput) {
  const regxp = /.*artist.*: (.*)/g;
  const match = regxp.exec(ffmpegoutput);

  return match[1];
}

const fs = require('fs');
const path = require('path');

function mkDirByPathSync(targetDir, { isRelativeToScript = true } = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  //const baseDir = isRelativeToScript ? __dirname : '.';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      console.log('try creating ' + curDir);
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && targetDir === curDir) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}


// In main process.
const { ipcMain } = require('electron');

ipcMain.on('get-chapters', (event, arg) => {
  exec('ffmpeg -i ' + '"' + arg + '"', (error, stdout, stderr) => {

    console.log(stdout);

    const res: any = {};
    res.chapters = getChapters(stderr);
    res.author = getAuthor(stderr);
    res.title = getTitle(stderr);
    event.sender.send('get-chapters-list', res);

  });
});

ipcMain.on('encode-chapter', (event, arg) => {

  // create directory if not exist
  const dirOut = path.dirname(arg.out);
  mkDirByPathSync(path.resolve(dirOut, '..'));
  mkDirByPathSync(dirOut);

  // prepare ffmpeg command
  const command = ['ffmpeg',
    '-y',
    '-activation_bytes', '0e4a8109',
    '-i', '"' + arg.in + '"',
    '-ab', '320k',
    '-ss', arg.start,
    '-to', arg.end,
    '-vn',
    '"' + arg.out + '"'];
  console.log(command.join(' '));
  exec(command.join(' '), (error, stdout, stderr) => {

    console.log(error);
    console.log(stderr);
    if (!error) {
      event.sender.send('encode-chapter-ok', stdout);
    }

  });
});

ipcMain.on('list-dir', (event, arg) => {
  console.log(arg);
  fs.readdir(arg, function (err, dir) {
    const res = [];
    // event.sender.send('list-dir-reply', dir);
    // event.sender.send('list-dir-reply', err);
    for (const filePath of dir) {
      if (filePath.endsWith('aax')) { // only show aax to convert
        res.push(arg + '\\' + filePath);
      }
    }
    event.sender.send('list-dir-reply', res);

    // event.sender.send('list-dir-reply', res);
  });
});

ipcMain.on('get-base64-img', (event, img) => {
  console.log(img);
  fs.readFile(img, function (err, data) {
    event.sender.send('get-base64-img-reply', {
      filename: img,
      content: Buffer.from(data).toString('base64')
    });
  });
});



ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg); // prints "ping"
  event.returnValue = 'pong';
});

