const btnSelect = document.getElementById("select-button");
const btnTakephoto = document.getElementById("takephoto-button");
const btnUploadphoto = document.getElementById("uploadphoto-button");
const menuBtn = document.getElementById('menuBtn');
btnSelect.addEventListener('click',()=>{
  btnSelect.style.display = 'none';
  menuBtn.style.display='block';
});
function addSafeNavigation(button, url, id) {
  if (!button) return;

  button.addEventListener('click', e => {
    if (typeof gtag === 'function') {
      gtag('event', 'button_click', {
        button_id: id || button.id || 'no-id',
        button_text: button.innerText || 'no-text',
      });
      console.log('GA event sent:', id || button.id);
    }

    e.preventDefault();
    setTimeout(() => (window.location.href = url), 100);
  });
}
// Thêm tham số mode vào sau URL
addSafeNavigation(btnTakephoto, "select-Frame.html?mode=camera", "take-photo-btn");
addSafeNavigation(btnUploadphoto, "select-Frame.html?mode=upload", "upload-photo-btn");