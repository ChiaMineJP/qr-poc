import JsQR from "jsqr";
import type {QRCode} from "jsqr";

declare global {
  interface Window {
    qrCapture: {
      requestMediaSourceId: () => Promise<string>;
      sendQrCodeAndCloseWindow: (qrInfo: ScannedQRInfo) => void;
      justCloseWindow: () => void;
    };
  }
}

type Position = {x: number; y: number};
type Rect = Position & {width: number; height: number};
export type ScannedQRInfo = {
  code: QRCode;
  width: number;
  height: number;
  image: Uint8ClampedArray;
};

function main(){
  window.addEventListener("load", async () => {
    let scanTimer: number | null = null;
    let currentScanRate: "moderate"|"frequent" = "moderate";
    // const MODERATE_SCAN_INTERVAL = Infinity;
    const FREQUENT_SCAN_INTERVAL = 150;
    const {video, stream} = await initializeCapture();
    
    const screenEl = createScreen();
    document.body.appendChild(screenEl);
    
    const startPos: Position = {x: 300, y: 300};
    const endPos: Position = {x: 550, y: 550};
    
    const rectEl = createRect();
    enableMovingRect();
    createResizer();
    createActionButtons();
    screenEl.appendChild(rectEl);
    
    const perimeter = createPerimeters(screenEl);
  
    renderRect(startPos, endPos);
    resetScan("moderate");
    
    function resetScan(rate: typeof currentScanRate){
      stopScan();
      currentScanRate = rate;
      if(rate === "moderate"){
        // Currently "moderate" means no scan at all.
        return;
      }
      scanTimer = window.setInterval(() => {
        processImage(getRect(startPos, endPos));
      }, FREQUENT_SCAN_INTERVAL);
    }
    
    function stopScan(){
      if(scanTimer !== null){
        window.clearInterval(scanTimer);
        scanTimer = null;
      }
    }
    
    function createRect(){
      const r = document.createElement("div");
      r.id = "selection";
      r.style.position = "absolute";
      r.style.background = "rgba(255,255,255,.2)";
      
      const topSideCorners = document.createElement("div");
      topSideCorners.style.position = "absolute";
      topSideCorners.style.top = "-4px";
      topSideCorners.style.left = "-4px";
      topSideCorners.style.right = "-4px";
      topSideCorners.style.height = "16px";
      topSideCorners.style.borderLeft = "4px solid #44cc11";
      topSideCorners.style.borderRight = "4px solid #44cc11";
      topSideCorners.style.zIndex = "1";
      r.appendChild(topSideCorners);
  
      const bottomSideCorners = document.createElement("div");
      bottomSideCorners.style.position = "absolute";
      bottomSideCorners.style.bottom = "-4px";
      bottomSideCorners.style.left = "-4px";
      bottomSideCorners.style.right = "-4px";
      bottomSideCorners.style.height = "16px";
      bottomSideCorners.style.borderLeft = "4px solid #44cc11";
      bottomSideCorners.style.borderRight = "4px solid #44cc11";
      bottomSideCorners.style.zIndex = "1";
      r.appendChild(bottomSideCorners);
  
      const LeftSideCorners = document.createElement("div");
      LeftSideCorners.style.position = "absolute";
      LeftSideCorners.style.left = "-4px";
      LeftSideCorners.style.top = "-4px";
      LeftSideCorners.style.bottom = "-4px";
      LeftSideCorners.style.width = "16px";
      LeftSideCorners.style.borderTop = "4px solid #44cc11";
      LeftSideCorners.style.borderBottom = "4px solid #44cc11";
      LeftSideCorners.style.zIndex = "1";
      r.appendChild(LeftSideCorners);
  
      const RightSideCorners = document.createElement("div");
      RightSideCorners.style.position = "absolute";
      RightSideCorners.style.right = "-4px";
      RightSideCorners.style.top = "-4px";
      RightSideCorners.style.bottom = "-4px";
      RightSideCorners.style.width = "16px";
      RightSideCorners.style.borderTop = "4px solid #44cc11";
      RightSideCorners.style.borderBottom = "4px solid #44cc11";
      RightSideCorners.style.zIndex = "1";
      r.appendChild(RightSideCorners);
  
      return r;
    }
  
    function renderRect(start: Position, end: Position) {
      const {x, y, width, height} = getRect(start, end);
      rectEl.style.left = `${x}px`;
      rectEl.style.top = `${y}px`;
      rectEl.style.width = `${width}px`;
      rectEl.style.height = `${height}px`;
      perimeter.n.style.width = `${x + width}px`;
      perimeter.n.style.height = `${y}px`;
      perimeter.e.style.width = `${screenEl.offsetWidth - (x + width)}px`;
      perimeter.e.style.height = `${y + height}px`;
      perimeter.s.style.width = `${screenEl.offsetWidth - x}px`;
      perimeter.s.style.height = `${screenEl.offsetHeight - (y + height)}px`;
      perimeter.w.style.width = `${x}px`;
      perimeter.w.style.height = `${screenEl.offsetHeight - y}px`;
    }
    
    function getRect(start: Position, end: Position): Rect {
      let x = start.x;
      let y = start.y;
      let width = end.x - start.x;
      let height = end.y - start.y;
      if (width < 0) {
        x = end.x;
        width = -width;
      }
      if (height < 0) {
        y = end.y;
        height = -height;
      }
      return {x, y, width, height};
    }
    
    function processImage(rect: Rect){
      screenEl.style.cursor = "none";
      rectEl.style.cursor = "none";
      const image = getScreenShot(screenEl, video, rect);
      const code = JsQR(image.data, image.width, image.height);
      if(!code){
        screenEl.style.cursor = "";
        rectEl.style.cursor = "move";
        return;
      }
      clearVideo(video, stream);
      window.qrCapture.sendQrCodeAndCloseWindow({
        code,
        width: image.width,
        height: image.height,
        image: image.data,
      });
    }
    
    function createPerimeters(containerEl: HTMLDivElement){
      const p = {
        n: document.createElement("div"),
        e: document.createElement("div"),
        s: document.createElement("div"),
        w: document.createElement("div"),
      };
      p.n.style.top = "0";
      p.n.style.left = "0";
      p.e.style.top = "0";
      p.e.style.right = "0";
      p.s.style.bottom = "0";
      p.s.style.right = "0";
      p.w.style.bottom = "0";
      p.w.style.left = "0";
      const periDirs = Object.keys(p) as [keyof typeof p];
      for (const dir of periDirs) {
        p[dir].style.position = "absolute";
        p[dir].style.background = "rgba(0,0,0,.3)";
        containerEl.appendChild(p[dir]);
      }
      
      return p;
    }
    
    function getScanSpeedMeasure(){
      let lastObservedTime = Date.now();
      const movingAvgThreshold = 0.3; // pixels per a millisecond
      const QUEUE_MAX = 10;
      const speedQueue: number[] = [];
      let lastX = -1;
      let lastY = -1;
      let lastRate: "moderate"|"frequent" = "moderate";
      
      return function decideRate(x: number, y: number){
        if(lastX === -1 || lastY === -1){
          lastX = x;
          lastY = y;
          lastObservedTime = Date.now();
          lastRate = "moderate";
          return lastRate;
        }
        
        const diffX = x - lastX;
        const diffY = y - lastY;
        const distance = Math.sqrt(diffX * diffX + diffY * diffY);
        const now = Date.now();
        const t = now - lastObservedTime;
        if(t < 20){
          return lastRate;
        }
        
        lastObservedTime = now;
        lastX = x;
        lastY = y;
  
        speedQueue.push(distance / t);
        if(speedQueue.length > QUEUE_MAX){
          speedQueue.splice(0, speedQueue.length - QUEUE_MAX);
        }
        
        if(speedQueue.length < QUEUE_MAX){
          lastRate = "moderate";
          return lastRate;
        }
        
        const movingAvg = speedQueue.reduce((acc, v) => {
          return acc + v;
        }, 0) / t;
  
        // console.log("Moving avg", now, t, distance, movingAvg);
  
        // When cursor is slowing down, let it accelerate QR Scan frequency.
        lastRate = movingAvg < movingAvgThreshold ? "frequent" : "moderate";
        return lastRate;
      };
    }
    
    function enableMovingRect(){
      let moving = false;
      let startX = -1;
      let startY = -1;
      const rateChecker = getScanSpeedMeasure();
  
      const onMouseDown = (e: MouseEvent) => {
        moving = true;
        startX = e.clientX;
        startY = e.clientY;
        resetScan("moderate");
      };
      
      const onMouseUp = () => {
        moving = false;
        
        stopScan();
        processImage(getRect(startPos, endPos));
      };
      
      const onMouseMove = (e: MouseEvent) => {
        if(!moving){
          return;
        }
        
        const diffX = e.clientX - startX;
        const diffY = e.clientY - startY;
        
        startPos.x += diffX;
        startPos.y += diffY;
        endPos.x += diffX;
        endPos.y += diffY;
        startX = e.clientX;
        startY = e.clientY;
        renderRect(startPos, endPos);
        
        const newRate = rateChecker(e.clientX, e.clientY);
        if(newRate !== currentScanRate){
          resetScan(newRate);
        }
      };
      
      rectEl.addEventListener("mousedown", onMouseDown);
      rectEl.addEventListener("mouseup", onMouseUp);
      rectEl.addEventListener("mouseleave", onMouseUp);
      rectEl.addEventListener("mousemove", onMouseMove);
      rectEl.style.cursor = "move";
    }
    
    function createResizer(){
      const r = {
        n: document.createElement("div"),
        ne: document.createElement("div"),
        e: document.createElement("div"),
        se: document.createElement("div"),
        s: document.createElement("div"),
        sw: document.createElement("div"),
        w: document.createElement("div"),
        nw: document.createElement("div"),
      };
      const dirs = Object.keys(r) as [keyof typeof r];
      const resizerWidth = 16;
      const expandedWidth = 48;
  
      for(const dir of dirs){
        r[dir].style.position = "absolute";
        r[dir].style.zIndex = "1";
        r[dir].style.cursor = `${dir}-resize`;
        // r[dir].style.background = "rgba(0,0,0,.2)";
        r[dir].dataset.dir = dir;
  
        const expandings = [] as Array<"top"|"bottom"|"left"|"right"|"height"|"width">;
  
        if(dir === "n" || dir === "s"){
          r[dir].style.left = "0";
          r[dir].style.right = "0";
        }
        if (dir === "e" || dir === "w") {
          r[dir].style.top = "0";
          r[dir].style.bottom = "0";
        }
        if (dir.includes("n")) {
          r[dir].style.top = `-${resizerWidth}px`;
          r[dir].style.height = `${resizerWidth}px`;
          expandings.push("top", "height");
        }
        if (dir.includes("e")) {
          r[dir].style.right = `-${resizerWidth}px`;
          r[dir].style.width = `${resizerWidth}px`;
          expandings.push("right", "width");
        }
        if (dir.includes("s")) {
          r[dir].style.bottom = `-${resizerWidth}px`;
          r[dir].style.height = `${resizerWidth}px`;
          expandings.push("bottom", "height");
        }
        if(dir.includes("w")){
          r[dir].style.left = `-${resizerWidth}px`;
          r[dir].style.width = `${resizerWidth}px`;
          expandings.push("left", "width");
        }
  
        let resizing = false;
        const onMouseDown = (e: MouseEvent) => {
          e.stopPropagation();
          for(const exp of expandings){
            const sign = Number.parseInt(r[dir].style[exp]) >= 0 ? 1 : -1;
            const newSize = ["width", "height"].includes(exp) ? expandedWidth*2 : expandedWidth;
            r[dir].style[exp] = `${newSize * sign}px`;
          }
          r[dir].style.zIndex = "2";
          resizing = true;
          resetScan("moderate");
        };
        const onMouseUp = (e: MouseEvent) => {
          e.stopPropagation();
          for (const exp of expandings) {
            const sign = Number.parseInt(r[dir].style[exp]) >= 0 ? 1 : -1;
            r[dir].style[exp] = `${resizerWidth * sign}px`;
          }
          r[dir].style.zIndex = "1";
          resizing = false;
          stopScan();
        };
        const onMouseMove = (e: MouseEvent) => {
          if(!resizing){
            return;
          }
          e.stopPropagation();
          const minWidth = 200;
          const minHeight = 200;
          if (dir.includes("n")) {
            if(endPos.y - e.clientY < minHeight){
              return;
            }
            startPos.y = e.clientY;
          }
          if (dir.includes("e")) {
            if (e.clientX - startPos.x < minWidth) {
              return;
            }
            endPos.x = e.clientX;
          }
          if (dir.includes("s")) {
            if (e.clientY - startPos.y < minHeight) {
              return;
            }
            endPos.y = e.clientY;
          }
          if (dir.includes("w")) {
            if (endPos.x - e.clientX < minWidth) {
              return;
            }
            startPos.x = e.clientX;
          }
          renderRect(startPos, endPos);
        };
  
        r[dir].addEventListener("mousedown", onMouseDown);
        r[dir].addEventListener("mouseup", onMouseUp);
        r[dir].addEventListener("mouseleave", onMouseUp);
        r[dir].addEventListener("mousemove", onMouseMove);
  
        rectEl.appendChild(r[dir]);
      }
  
      return r;
    }
    
    function createActionButtons(){
      const buttonContainerEl = document.createElement("div");
      buttonContainerEl.style.position = "absolute";
      buttonContainerEl.style.bottom = "0";
      buttonContainerEl.style.left = "0";
      buttonContainerEl.style.right = "0";
      buttonContainerEl.style.zIndex = "1";
      buttonContainerEl.style.background = "rgba(0,0,0,.2)";
      buttonContainerEl.style.display = "flex";
      buttonContainerEl.style.alignItems = "center";
      buttonContainerEl.style.justifyContent = "center";
      buttonContainerEl.style.fontSize = "12px";
      buttonContainerEl.style.userSelect = "none";
      
      const cancelButton = document.createElement("div");
      cancelButton.innerText = "Click ESC or press here to cancel scanning";
      cancelButton.style.cursor = "pointer";
      cancelButton.style.border = "1px solid #999";
      cancelButton.style.padding = "4px";
      cancelButton.style.textAlign = "center";
      cancelButton.addEventListener("click", () => {
        clearVideo(video, stream);
        window.qrCapture.justCloseWindow();
      })
      buttonContainerEl.appendChild(cancelButton);
    }
  
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        clearVideo(video, stream);
        window.qrCapture.justCloseWindow();
      }
    });
  });
}

async function initializeCapture(){
  const mediaSourceId = await window.qrCapture.requestMediaSourceId();
  
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: mediaSourceId,
      }
    } as any,
  });
  
  const video = document.createElement("video");
  video.style.cssText = "position:absolute;top:-10000px;left:-10000px;";
  
  // Event connected to stream
  video.onloadedmetadata = async () => {
    // Set video ORIGINAL height (screenshot)
    video.style.height = video.videoHeight + "px"; // videoHeight
    video.style.width = video.videoWidth + "px"; // videoWidth
    
    video.play();
  }
  
  video.srcObject = stream;
  document.body.appendChild(video);
  return {video, stream};
}

function getScreenShot(screenEl: HTMLDivElement, video: HTMLVideoElement, rect: Rect): ImageData {
  // Create canvas
  const canvas = createCanvas(video.videoWidth, video.videoHeight);
  screenEl.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(rect.x, rect.y, rect.width, rect.height);
  screenEl.removeChild(canvas);
  return imageData;
}

function clearVideo(video: HTMLVideoElement, stream: MediaStream){
  // Remove hidden video tag
  video.remove();
  try {
    // Destroy connect to stream
    stream.getTracks()[0].stop();
  } catch (e) {
    console.error(e);
  }
}

function createScreen(){
  const screen = document.createElement("div");
  screen.id = "screen";
  screen.style.position = "fixed";
  screen.style.left = "0";
  screen.style.top = "0";
  screen.style.right = "0";
  screen.style.bottom = "0";
  screen.style.background = "transparent";
  screen.style.border = "none";
  return screen;
}

function createCanvas(width: number, height: number){
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

main();