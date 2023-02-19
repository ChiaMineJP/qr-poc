import type {ScannedQRInfo} from "../captureWindow/script";

declare global {
  interface Window {
    qr: {
      requestCapture: () => Promise<ScannedQRInfo|undefined>;
    };
  }
}

export function main(){
  window.addEventListener("load", () => {
    const scanResultEl = document.getElementById("scan-result") as HTMLDivElement;
    if (!scanResultEl) {
      throw new Error("scan result container not found")
    }
    const containerEl = document.getElementById("captured-image") as HTMLDivElement | null;
    if (!containerEl) {
      throw new Error("Failed to get container element");
    }
    const deskTopCaptureBtn = document.getElementById("request-desktop-capture-btn") as HTMLButtonElement | null;
    if (!deskTopCaptureBtn) {
      throw new Error("button not found")
    }
    const deviceCaptureBtn = document.getElementById("request-device-capture-btn") as HTMLButtonElement | null;
    if (!deviceCaptureBtn) {
      throw new Error("button not found")
    }
    
    const resetResult = () => {
      const oldCanvases = document.querySelectorAll("canvas");
      oldCanvases.forEach(c => c.remove());
      scanResultEl.innerText = "";
      
      const oldVideo = document.querySelectorAll("video");
      oldVideo.forEach(v => v.remove());
    };
  
    deskTopCaptureBtn.addEventListener("click", async () => {
      resetResult();
      
      const qrInfo = await window.qr.requestCapture();
      if(!qrInfo){
        scanResultEl.innerText = "QRCode not detected!";
        scanResultEl.style.color = "red";
        return;
      }
      
      const canvas = document.createElement("canvas");
      const maxWidth = 600;
      const maxHeight = 400;
      let canvasWidth = qrInfo.width;
      let canvasHeight = qrInfo.height;
      let scale = 1.0;
      if(canvasWidth > maxWidth){
        scale = maxWidth / canvasWidth;
        canvasWidth = maxWidth;
        canvasHeight *= scale;
      }
      if(canvasHeight > maxHeight){
        scale = maxHeight / canvasHeight;
        canvasHeight = maxHeight;
        canvasWidth *= scale;
      }
      scale = canvasWidth / qrInfo.width;
      canvas.width = qrInfo.width;
      canvas.height = qrInfo.height;
      containerEl.innerText = "";
      containerEl.style.width = `${canvasWidth}px`;
      containerEl.style.height = `${canvasHeight}px`;
      containerEl.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      if(ctx){
        const image = new ImageData(qrInfo.image, qrInfo.width, qrInfo.height);
        ctx.putImageData(image, 0, 0);
        ctx.fillStyle = "rgba(255, 60, 0, .5)";
        const qrRect = {
          x: qrInfo.code.location.topLeftCorner.x,
          y: qrInfo.code.location.topLeftCorner.y,
          width: qrInfo.code.location.topRightCorner.x - qrInfo.code.location.topLeftCorner.x,
          height: qrInfo.code.location.bottomLeftCorner.y - qrInfo.code.location.topLeftCorner.y,
        };
        ctx.fillRect(qrRect.x, qrRect.y, qrRect.width, qrRect.height);
        
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = "0 0";
      }
      
      const qrCode = qrInfo.code;
      scanResultEl.innerText = `{version: ${qrCode.version}, data: "${qrCode.data}"}`;
    });
  
    deviceCaptureBtn.addEventListener("click", async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
  
      const video = document.createElement("video");
      video.onloadedmetadata = async () => {
        // Set video ORIGINAL height (screenshot)
        video.style.width = video.videoWidth + "px"; // videoWidth
        video.style.height = video.videoHeight + "px"; // videoHeight
  
        video.play();
      }
  
      video.srcObject = stream;
      containerEl.appendChild(video);
    });
  });
}

main();
