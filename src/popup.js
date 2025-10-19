
document.getElementById('saveBtn').onclick = () => {
  const token = document.getElementById('tokenInput').value.trim();
  chrome.storage.local.set({ ds_token: token }, () => {
    document.getElementById('status').textContent = '✅ Token saved.';
  });
};
