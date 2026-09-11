const loginView = document.querySelector('#loginView');
const appView = document.querySelector('#appView');
const loginForm = document.querySelector('#loginForm');
const loginError = document.querySelector('#loginError');
const userName = document.querySelector('#userName');
const userRole = document.querySelector('#userRole');
const healthStatus = document.querySelector('#healthStatus');
const diagnoseBtn = document.querySelector('#diagnoseBtn');
const diagnoseState = document.querySelector('#diagnoseState');
const aiResult = document.querySelector('#aiResult');
const causeList = document.querySelector('#causeList');
const testList = document.querySelector('#testList');
const confirmedCause = document.querySelector('#confirmedCause');
const feedbackOutcome = document.querySelector('#feedbackOutcome');
const feedbackBtn = document.querySelector('#feedbackBtn');
const feedbackState = document.querySelector('#feedbackState');
const safetyNote = document.querySelector('#safetyNote');

let currentRunId = null;
let currentDiagnosis = null;

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw Object.assign(new Error(data.error || 'request_failed'), { status: response.status, data });
  return data;
}

function showApp(user) {
  loginView.hidden = true;
  appView.hidden = false;
  userName.textContent = user.name;
  userRole.textContent = user.role;
}

function showLogin() {
  appView.hidden = true;
  loginView.hidden = false;
  aiResult.hidden = true;
  currentRunId = null;
  currentDiagnosis = null;
}

function pct(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function renderDiagnosis(result) {
  currentDiagnosis = result;
  currentRunId = result.runId;
  causeList.innerHTML = '';
  testList.innerHTML = '';
  confirmedCause.innerHTML = '<option value="">— Chọn nguyên nhân thực tế —</option>';

  for (const cause of result.rankedCauses || []) {
    const item = document.createElement('div');
    item.className = 'cause-item';
    const evidence = (cause.evidence || []).map(e => `${e.signalCode}: ${e.contribution >= 0 ? '+' : ''}${e.contribution.toFixed(2)}`).join(' · ');
    item.innerHTML = `
      <div class="cause-head"><strong>#${cause.rank} ${cause.name}</strong><span>${pct(cause.probability)}</span></div>
      <div class="bar"><i style="width:${Math.max(2, cause.probability * 100)}%"></i></div>
      <div class="muted small">${cause.subsystem} · confidence ${pct(cause.confidence)}${evidence ? ` · ${evidence}` : ''}</div>
    `;
    causeList.appendChild(item);

    const option = document.createElement('option');
    option.value = cause.code;
    option.textContent = `${cause.name} (${pct(cause.probability)})`;
    confirmedCause.appendChild(option);
  }

  for (const test of result.nextTests || []) {
    const item = document.createElement('div');
    item.className = 'test-item';
    item.innerHTML = `
      <div class="test-rank">${test.priority}</div>
      <div><strong>${test.testName}</strong><p>${test.instructions}</p><span class="muted small">Nhắm tới: ${test.causeName} · information gain ${pct(test.informationGain)}</span></div>
    `;
    testList.appendChild(item);
  }

  safetyNote.textContent = result.safetyNote || '';
  aiResult.hidden = false;
  diagnoseState.textContent = result.needsMoreEvidence
    ? 'AI chưa đủ chắc chắn — nên thực hiện phép kiểm tra tiếp theo.'
    : `Nguyên nhân dẫn đầu: ${result.topCause?.name || '—'} (${pct(result.topCause?.probability)})`;
}

async function boot() {
  try {
    const { user } = await api('/api/auth/me', { method: 'GET' });
    showApp(user);
    const health = await api('/api/health', { method: 'GET' });
    healthStatus.textContent = health.ok ? 'Online' : 'Có lỗi';
  } catch {
    showLogin();
  }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginError.hidden = true;
  try {
    const { user } = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.querySelector('#email').value,
        password: document.querySelector('#password').value,
      }),
    });
    showApp(user);
    const health = await api('/api/health', { method: 'GET' });
    healthStatus.textContent = health.ok ? 'Online' : 'Có lỗi';
  } catch (error) {
    loginError.textContent = error.status === 401 ? 'Email hoặc mật khẩu không đúng.' : 'Không thể đăng nhập.';
    loginError.hidden = false;
  }
});

document.querySelector('#logoutBtn').addEventListener('click', async () => {
  try { await api('/api/auth/logout', { method: 'POST', body: '{}' }); } finally { showLogin(); }
});

diagnoseBtn.addEventListener('click', async () => {
  const selected = [...document.querySelectorAll('#signalGrid input:checked')];
  if (!selected.length) {
    diagnoseState.textContent = 'Hãy chọn ít nhất một tín hiệu kỹ thuật.';
    return;
  }

  diagnoseBtn.disabled = true;
  diagnoseState.textContent = 'Đang suy luận nhân quả…';
  feedbackState.textContent = '';

  try {
    const result = await api('/api/ai/diagnose', {
      method: 'POST',
      body: JSON.stringify({
        evidence: selected.map(input => ({ signalCode: input.value, present: true, confidence: 1 })),
      }),
    });
    renderDiagnosis(result);
  } catch (error) {
    diagnoseState.textContent = error.data?.message || 'AI chưa thể phân tích dữ liệu này.';
  } finally {
    diagnoseBtn.disabled = false;
  }
});

feedbackBtn.addEventListener('click', async () => {
  if (!currentRunId) return;
  feedbackBtn.disabled = true;
  feedbackState.textContent = 'Đang cập nhật bộ nhớ AI…';
  try {
    const result = await api('/api/ai/feedback', {
      method: 'POST',
      body: JSON.stringify({
        runId: currentRunId,
        confirmedCauseCode: confirmedCause.value || null,
        outcome: feedbackOutcome.value,
      }),
    });
    feedbackState.textContent = result.learningApplied
      ? 'Đã ghi nhận. Trọng số nhân quả đã được cập nhật cho các ca tiếp theo.'
      : 'Đã lưu phản hồi, chưa thay đổi trọng số học.';
  } catch {
    feedbackState.textContent = 'Không thể lưu phản hồi.';
  } finally {
    feedbackBtn.disabled = false;
  }
});

boot();
