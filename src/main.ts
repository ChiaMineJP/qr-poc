import {app, BrowserWindow, desktopCapturer, ipcMain, IpcMainEvent} from "electron";
import path from "node:path";
import type {ScannedQRInfo} from "./captureWindow/script";

function main(){
  let primaryWindow: BrowserWindow;
  let windowForScreenCapture: BrowserWindow;
  
  ipcMain.handle("request-capture", () => new Promise<ScannedQRInfo|undefined>(resolve => {
    if(!primaryWindow){
      throw new Error("Primary window not found");
    }
    primaryWindow.hide();
    windowForScreenCapture = createScreenWindow();
    windowForScreenCapture.loadFile(path.resolve(__dirname, "capture.html")).catch((reason) => {
      console.error(reason);
      windowForScreenCapture.close();
    });
  
    windowForScreenCapture.webContents.on("did-finish-load", () => {
      desktopCapturer.getSources({types: ["screen"]}).then(async (sources) => {
        for (const source of sources) {
          if (source.name) {
            windowForScreenCapture.webContents.send("SET_SCREEN_CAPTURE", source.id);
            return;
          }
        }
      });
    });
  
    const maybeQRCodeScanned = (e: IpcMainEvent, qrInfo: ScannedQRInfo) => {
      if (e.sender !== windowForScreenCapture.webContents) {
        return;
      }
      ipcMain.removeListener("qrcode-scanned", maybeQRCodeScanned);
      windowForScreenCapture.close();
      primaryWindow.show();
      resolve(qrInfo);
    };
    ipcMain.on("qrcode-scanned", maybeQRCodeScanned);
    ipcMain.on("capture-canceled", maybeQRCodeScanned);
  }));
  
  app.on("ready", () => {
    primaryWindow = createPrimaryWindow();
    primaryWindow.loadFile(path.resolve(__dirname, "index.html")).catch((reason) => {
      console.error(reason);
      app.quit();
    });
  });
}

function createPrimaryWindow(){
  const wnd = new BrowserWindow({
    autoHideMenuBar: true,
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      webviewTag: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  
  wnd.on("ready-to-show", () => {
    wnd.show();
  });
  
  return wnd;
}

function createScreenWindow(){
  return new BrowserWindow({
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    fullscreen: true,
    show: true,
    backgroundColor: "rgba(0,0,0,0)",
    transparent: true,
    // alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      webviewTag: false,
      preload: path.join(__dirname, "preload_capture.js"),
    },
  });
}

main();
