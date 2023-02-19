import {ipcRenderer, contextBridge} from "electron";

contextBridge.exposeInMainWorld("qr", {
  requestCapture: async () => {
    return ipcRenderer.invoke("request-capture");
  },
});
