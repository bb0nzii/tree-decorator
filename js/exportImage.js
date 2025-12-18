const saveBtn = document.getElementById('saveImageBtn');
const captureWrapper = document.getElementById('captureWrapper');

saveBtn.addEventListener('click', () => {
  if (!captureWrapper) {
    alert("캡처 대상 요소(captureWrapper)를 찾을 수 없습니다.");
    return;
  }

  html2canvas(captureWrapper, {
    useCORS: true,
    backgroundColor: "#ffffff",
    scale: 3, 
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'my-tree.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error("캡처 오류:", err);
    alert("이미지를 저장하는 중 문제가 발생했습니다.");
  });
});