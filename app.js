// app.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('entryForm');
    const janInput = document.getElementById('janInput');
    const qtyInput = document.getElementById('qtyInput');
    const tableBody = document.querySelector('#entryTable tbody');
  
    form.addEventListener('submit', e => {
      e.preventDefault();
      const jan = janInput.value.trim();
      const qty = parseInt(qtyInput.value, 10);
      if (!jan || isNaN(qty)) return;
  
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${jan}</td>
        <td>${qty}</td>
        <td><button class="delete">削除</button></td>
      `;
      row.querySelector('.delete').addEventListener('click', () => row.remove());
      tableBody.appendChild(row);
  
      janInput.value = '';
      qtyInput.value = '';
      janInput.focus();
    });
  });


// kintone 接続定義
const KINTONE_SUBDOMAIN = 'ahb4o';
const KINTONE_APP_ID    = 117;                // ご自身のアプリID に置換
const KINTONE_API_TOKEN = 'EzzfLVCJsLJHN7m9Nvu5WhkGrRYxF8JsFhNDRfpe'; // ご自身のAPIトークン に置換
const BASE_URL = `https://${KINTONE_SUBDOMAIN}.cybozu.com/k/v1`;

// 1) PWA上のテーブル行からサブテーブル用データを作成
function getSubtableRows() {
  const rows = Array.from(document.querySelectorAll('#entryTable tbody tr'));
  return rows.map((tr, idx) => ({
    id: `${Date.now()}_${idx}`,  // 新規行なら任意の一意文字列でOK
    value: {
      JAN:   { value: tr.cells[0].textContent.trim() },
      数量:   { value: parseInt(tr.cells[1].textContent.trim(), 10) }
    }
  }));
}

// 2) kintone へレコードを追加する関数
async function sendRecord() {
  const subtable = getSubtableRows();
  if (subtable.length === 0) {
    throw new Error('送信する行がありません');
  }

  const body = {
    app: KINTONE_APP_ID,
    record: {
      TableField: {                // サブテーブルのフィールドコードに合わせて変更
        value: subtable
      }
    }
  };

  const resp = await fetch(`${BASE_URL}/record.json`, {
    method: 'POST',
    headers: {
      'X-Cybozu-API-Token': KINTONE_API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(`kintone エラー: ${err.message}`);
  }
  return resp.json();
}

// 3) 送信ボタンに紐付け、成功時に表をクリア
document.getElementById('sendBtn').addEventListener('click', async () => {
  try {
    const result = await sendRecord();
    console.log('登録成功:', result);
    alert('kintone へ転記完了しました');

    // PWA上の表をクリア
    const tbody = document.querySelector('#entryTable tbody');
    tbody.innerHTML = '';

  } catch (e) {
    console.error(e);
    alert(e.message);
  }
});