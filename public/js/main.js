// Kiểm tra server còn sống và hiển thị trạng thái ở góc phải.
(async function checkHealth() {
  const el = document.getElementById('server-status');
  if (!el) return;
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.ok) {
      el.textContent = '● server OK';
      el.classList.add('ok');
    } else {
      throw new Error('not ok');
    }
  } catch (err) {
    el.textContent = '● server lỗi';
    el.classList.add('bad');
  }
})();
