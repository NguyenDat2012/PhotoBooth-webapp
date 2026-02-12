const video = document.getElementById('video');
const overlayFrame = document.getElementById('overlayFrame');
const btncapture = document.getElementById('captureButton');
const finalImage = document.getElementById('finalImage');
const editcanvas = document.getElementById('editcanvas');
const cameraWrapper = document.getElementById('camera-wrapper');

const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');

const urlParams = new URLSearchParams(window.location.search);
const encodedUrl = urlParams.get('image_url');
const datatype = urlParams.get('data_type');

document.body.classList.add(datatype); 
let total = 0;
let gap=0;
const totalFrames = 4;
let CANVAS_WIDTH, CANVAS_HEIGHT;
let camera_width, camera_height;

if(datatype ==  'portrait'){
    CANVAS_WIDTH = 295;
    CANVAS_HEIGHT = 900;
    camera_width = 245;
    camera_height = 182;
    cameraWrapper.style.width = 295 + 'px';
    cameraWrapper.style.height = 900 + 'px';  
    gap= 180;
}else{
    CANVAS_WIDTH = 880;
    CANVAS_HEIGHT = 800;
    camera_width = 400;
    camera_height = 279;
    cameraWrapper.style.width = 880+ 'px';
    cameraWrapper.style.height = 750 + 'px';
    gapY= 280;
    gapX = 420;
}

function loadFrameFromUrl() {
   if (encodedUrl && overlayFrame) {
        // Cho phép Canvas vẽ ảnh từ URL bên ngoài
        overlayFrame.crossOrigin = "anonymous"; 
        overlayFrame.style.width = CANVAS_WIDTH + 'px';
        overlayFrame.style.height = CANVAS_HEIGHT + 'px';
        overlayFrame.src = decodeURIComponent(encodedUrl);
        
        overlayFrame.onload = () => {
            console.log("Khung ảnh đã tải xong và sẵn sàng để vẽ.");
        };
        overlayFrame.onerror = () => {
            console.error("Không thể tải khung ảnh từ URL.");
        };
    }
}
async function setupCamera() {
    const constraints = {
        video: { 
            facingMode: "user",
            width: { ideal: datatype === 'portrait' ? 245 : 400 },
            height: { ideal: datatype === 'portrait' ? 182 : 279 }
        },
        audio: false
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // Cần thiết cho Safari/iOS
        video.setAttribute('playsinline', 'true'); 
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true'); // Một số trình duyệt yêu cầu muted để autoplay

        video.onloadedmetadata = () => {
            video.play();
            video.style.transform = "scaleX(-1)";
        };
    } catch (err) {
        console.error("Lỗi camera:", err);
        alert("Không thể truy cập camera. Vui lòng cấp quyền hoặc kiểm tra kết nối https.");
    }
}

function capturePhoto() {
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');

    const vDisplayWidth = camera_width;
    const vDisplayHeight = camera_height;

    // GIỮ NGUYÊN VỊ TRÍ CŨ
    const vDisplayLeft = video.offsetLeft;
    const vDisplayTop  = video.offsetTop;

    if (total === 0) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
    }

    // ===== FIX CỐT LÕI: KHÔNG ZOOM / KHÔNG MÉO =====
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const scale = Math.max(
        vDisplayWidth / vw,
        vDisplayHeight / vh
    );

    const sw = vDisplayWidth / scale;
    const sh = vDisplayHeight / scale;

    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;

    ctx.save();

    // mirror
    ctx.translate(vDisplayLeft + vDisplayWidth, vDisplayTop);
    ctx.scale(-1, 1);

    ctx.drawImage(
        video,
        sx, sy, sw, sh,                  // crop video gốc
        0, 0, vDisplayWidth, vDisplayHeight
    );

    ctx.restore();

    total++;
    if (total < totalFrames) {
        moveCameraToNextFrame(vDisplayTop, vDisplayLeft, total, datatype);
    } else {

        const completeButton = document.getElementById('completeButton');
        completeButton.style.display = 'block';
        btncapture.style.display = 'none';
        completeButton.addEventListener('click',finalizeStrip);
    }
}



/*function capturePhoto() {
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');
    
     
    const vDisplayWidth = camera_width;
    const vDisplayHeight = camera_height;
    const vDisplayLeft = video.offsetLeft;
    const vDisplayTop = video.offsetTop;

    if (total == 0) {
        canvas.width = CANVAS_WIDTH;
        canvas.style.height = CANVAS_HEIGHT;
    }
    // 2. Vẽ lên Canvas
    ctx.save();
    ctx.translate(vDisplayLeft + vDisplayWidth, vDisplayTop);
    ctx.scale(-1, 1); // Hiệu ứng lật gương

    ctx.drawImage(
        video,           
        0, 0, vDisplayWidth, vDisplayHeight // VẼ vào đúng kích thước ô chứa
    );
    ctx.restore();
    

    total++;
    if (total < totalFrames) {
        moveCameraToNextFrame(vDisplayTop,vDisplayLeft,total,datatype);
    } else {
        setTimeout(() => {
            finalizeStrip();
        }, 100);
    }
}*/
function moveCameraToNextFrame(currentTop,currentLeft,total,data_type) {
    // Di chuyển video preview xuống ô tiếp theo
    if(data_type == 'portrait'){
    const nextY = currentTop + gap; 
    video.style.top = nextY + "px";
    }else{
        if(total==1){
            const nextX = currentLeft + gapX; 
            video.style.left = nextX + "px";
        }else if(total==2){
            const nextY = currentTop + gapY; 
            video.style.top = nextY + "px";
        }else if(total==3){
            const nextX = currentLeft - gapX; 
            video.style.left = nextX + "px";
        }
    }
}

function finalizeStrip() {
    // 1. Vẽ khung overlay lên trên cùng của 4 tấm ảnh
    if (overlayFrame.complete) {
        if (typeof renderCanvasAll === 'function') {
        renderCanvasAll();
    }
        ctx.drawImage(overlayFrame, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 2. Dừng Camera để giải phóng tài nguyên
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    // 3. Ẩn phần chụp, hiện phần sửa
    document.getElementById('camera-section').style.display = 'none';
    const editSection = document.getElementById('edit-section');
    editSection.style.display = 'flex';
    const editContainer = document.getElementById('editcanvas');
    editContainer.appendChild(canvas);

    console.log("Đã hoàn tất dải ảnh!");

    startEditingSystem();
}

const startCountDown = (callback) => {
    let count = 3;
    const countdownEl = document.getElementById('countdownDisplay');
    countdownEl.style.display = 'flex';
    countdownEl.textContent = count;
    
    const intervalId = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else {
            clearInterval(intervalId);
            countdownEl.style.display = 'none';
            callback();
        }
    }, 1000);
};
document.addEventListener('DOMContentLoaded', () => {
    loadFrameFromUrl();
    setupCamera();
    btncapture.addEventListener('click', () => {
        if (total < totalFrames) {
            btncapture.style.display = 'none';
            startCountDown(() => {
                capturePhoto();
                if (total < totalFrames) btncapture.style.display = 'block';
            });
        }
    });
    
});