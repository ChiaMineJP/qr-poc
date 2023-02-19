import {contextBridge, ipcRenderer} from "electron";
import type {ScannedQRInfo} from "./script";

const emitter = new EventTarget();
const mediaSourceIdNotifiedEventName = "mediaSourceNotified";
let mediaSourceId: string;

ipcRenderer.on("SET_SCREEN_CAPTURE", async (_event, id: string) => {
  mediaSourceId = id;
  emitter.dispatchEvent(new CustomEvent(mediaSourceIdNotifiedEventName, {
    detail: id,
  }))
});

contextBridge.exposeInMainWorld("qrCapture", {
  requestMediaSourceId: () => {
    return new Promise<string>((resolve) => {
      if(mediaSourceId){
        resolve(mediaSourceId);
        mediaSourceId = "";
        return
      }
      emitter.addEventListener(mediaSourceIdNotifiedEventName, (e) => {
        mediaSourceId = (e as CustomEvent).detail as string;
        resolve(mediaSourceId);
        mediaSourceId = "";
      });
    });
  },
  sendQrCodeAndCloseWindow: (data: ScannedQRInfo) => {
    ipcRenderer.send("qrcode-scanned", data);
  },
  justCloseWindow: () => {
    ipcRenderer.send("capture-canceled");
  },
});
