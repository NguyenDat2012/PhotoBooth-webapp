const btnnext = document.querySelector('.swiper-button-next');
const btnprev = document.querySelector('.swiper-button-prev');
// 1. Hàm lấy tham số mode từ URL
const urlParams = new URLSearchParams(window.location.search);
const currentMode = urlParams.get('mode');
var swiper = new Swiper(".mySwiper", {
    slidesPerView: 3,
    slidesPerGroup: 1,
    spaceBetween: 24,     // khoảng cách thật
    centeredSlides: false,
    watchOverflow: true,

    navigation: {
        nextEl: btnnext,
        prevEl: btnprev,
    },

    breakpoints: {
        0: {
            slidesPerView: 1,
            spaceBetween: 16,
        },
        450: {
            slidesPerView: 1,
            spaceBetween: 16,
        },
        768: {
            slidesPerView: 2,
            spaceBetween: 24,
        }
    }
});


// Lưu trữ tất cả slide ban đầu (bao gồm cả square và portrait)
const frame_warehouse = Array.from(document.querySelectorAll('.swiper-slide'));

// Lấy các nút lọc
const filterbtns = document.querySelectorAll('.filter-btn');

// Thêm event cho các nút lọc
filterbtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-filter');
        lockhung(value);
    });
});

// Hàm lọc khung
function lockhung(loai) {
    // Lọc slide dựa trên data-type
    const newlist = frame_warehouse.filter(slide => {
        return slide.getAttribute('data-type') === loai;
    });

    // Xóa tất cả slide hiện tại
    swiper.removeAllSlides();

    // Nếu có slide khớp, thêm vào swiper
    if (newlist.length > 0) {
        newlist.forEach(slide => {
            swiper.appendSlide(slide);
        });
    } else {
        // Nếu không có slide nào, có thể thêm một slide thông báo (tùy chọn)
        const noFrameSlide = document.createElement('div');
        noFrameSlide.className = 'swiper-slide';
        noFrameSlide.innerHTML = '<p>Không có khung nào cho loại này.</p>';
        swiper.appendSlide(noFrameSlide);
    }

    // Cập nhật swiper và reset về slide đầu
    swiper.update();
    swiper.slideTo(0);

    // Bind lại event cho các slide mới (quan trọng!)
    rebindEvent();
}

async function addSafeNavigation(button, url, id) {
    if (!button) return;
    button.addEventListener('click', async e => {   
        const image = button.querySelector('img');
        if (!image) {
            console.error('Không tìm thấy ảnh trong slide này.');
            return; // Nếu không có img, không làm gì
        }
        const imageURL = image.src;
        const dataType = button.getAttribute('data-type');
        
        // Gửi event GA nếu có
        if (typeof gtag === 'function') {
            gtag('event', 'button_click', {
                button_id: id || button.id || 'no-id',
                button_text: button.innerText || 'no-text',
            });
            console.log('GA event sent:', id || button.id);
        }

        e.preventDefault();
      
        // Chuyển trang với image_url
        setTimeout(() => (window.location.href = `${url}?image_url=${encodeURIComponent(imageURL)}&data_type=${encodeURIComponent(dataType)}`), 100);
    });
}

// Hàm bind lại event cho tất cả slide
function rebindEvent() {
    const frames = document.querySelectorAll('.swiper-slide');
    frames.forEach((frame) => {
        // Chỉ bind nếu slide có img (tránh bind cho slide thông báo)
        if (frame.querySelector('img')) {
            if(currentMode == 'camera'){
                addSafeNavigation(frame, "camera.html");
            }else{
                addSafeNavigation(frame, "upload.html");
            }
        }
    });
}
// Bind event ban đầu khi trang load
rebindEvent();
