/* ============================================================
 * 闯关岛主程序：关卡解锁 / 教学渲染 / 运行批改 / 进度保存
 * ============================================================ */
(function () {
  'use strict';

  const KEY = 'pythonQuestProgress_v1';
  const $ = function (id) { return document.getElementById(id); };

  /* ---------- 进度存储（localStorage 不可用时退回内存） ---------- */
  let memoryState = null;
  let lastSaveAt = null;   // 上次保存时间（毫秒时间戳），用于界面提示
  let saveTimer = null;    // 输入防抖定时器

  // 把任意来源（本地存储 / 导入文件）的状态规整成合法结构，避免脏数据导致白屏。
  function normalizeState(s) {
    if (!s || typeof s.current !== 'number' || !isFinite(s.current)) return null;
    s.completed = Array.isArray(s.completed) ? s.completed : [];
    s.taskPassed = Array.isArray(s.taskPassed) ? s.taskPassed : [];
    s.quizPassed = Array.isArray(s.quizPassed) ? s.quizPassed : [];
    s.drafts = (s.drafts && typeof s.drafts === 'object' && !Array.isArray(s.drafts)) ? s.drafts : {};
    s.stdinSaved = (s.stdinSaved && typeof s.stdinSaved === 'object' && !Array.isArray(s.stdinSaved)) ? s.stdinSaved : {};
    if (s.paper !== 1) s.paper = 0;              // 0 = A 卷，1 = B 卷
    if (typeof s.version !== 'number') s.version = 2;
    s.current = Math.min(Math.max(s.current, 1), LEVELS.length);
    return s;
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const saved = normalizeState(JSON.parse(raw));
      if (saved && saved.savedAt) lastSaveAt = saved.savedAt;
      return saved;
    } catch (e) { return memoryState; }
  }
  // 真正落盘。quiet=true 时不弹提示（用于自动保存），false 用于手动保存给反馈。
  function saveState(quiet) {
    try {
      state.savedAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(state));
      memoryState = state;
      lastSaveAt = state.savedAt;
      updateSaveStatus('已保存 ' + new Date(lastSaveAt).toLocaleTimeString('zh-CN', { hour12: false }), 'ok');
      if (!quiet) showToast('进度已保存，随时可以放心继续');
    } catch (e) {
      // 存储不可用（隐私模式 / 预览域限制）：至少兜在内存里，并提醒用导出备份
      memoryState = state;
      updateSaveStatus('暂时无法保存', 'warn');
      if (!quiet) showToast('浏览器不让我存进度，请用左侧「导出备份」把进度存成文件', 'warn');
    }
  }
  // 输入时调用：先在界面标记"正在输入"，短暂防抖后再真正保存，避免每敲一个字都写盘。
  function scheduleSave() {
    updateSaveStatus('正在输入…', 'saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveState(true); }, 600);
  }
  function updateSaveStatus(text, cls) {
    const el = $('saveStatusText');
    const wrap = $('saveStatus');
    if (!el || !wrap) return;
    el.textContent = text;
    wrap.className = 'save-status' + (cls ? ' s-' + cls : '');
  }

  let state = loadState() || {
    current: 1, completed: [], taskPassed: [], quizPassed: [], drafts: {}, stdinSaved: {}, paper: 0, version: 2
  };
  normalizeState(state);
  let level = null;
  let hintIndex = 0;
  let quizLocked = false;

  // 当前题组的内容（任务/提示/检测/批改/输入），示例 example 与知识点 knowledge 不在这里。
  function paper() { return state.paper === 1 ? (level.alt || level) : level; }

  // 一关是否解锁，只看它前面的关卡是否已完成，与当前停留在哪一关无关。
  // 这样答完检测后即使选择“再看看 / 逗留一会”，下一关也立刻解锁可点。
  function isUnlocked(id) {
    return id === 1 || state.completed.indexOf(id - 1) !== -1;
  }

  /* ---------- 工具 ---------- */
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function highlight(code) {
    const kws = ['print', 'input', 'if', 'else', 'for', 'in', 'range', 'def', 'return', 'int', 'str', 'float', 'len', 'open',
      'while', 'break', 'continue', 'and', 'or', 'not', 'True', 'False', 'None',
      'try', 'except', 'class', 'self', 'sum', 'max', 'min', 'sorted', 'abs', 'round'];
    return String(code).split('\n').map(function (line) {
      const escaped = escapeHtml(line);
      let out = '', i = 0;
      while (i < escaped.length) {
        const c = escaped[i];
        if (c === '#') { out += '<span class="c">' + escaped.slice(i) + '</span>'; break; }
        if (c === '"' || c === "'") {
          let j = i + 1;
          while (j < escaped.length && escaped[j] !== c) j++;
          out += '<span class="s">' + escaped.slice(i, j + 1) + '</span>';
          i = j + 1; continue;
        }
        if (/[0-9]/.test(c)) {
          let j = i;
          while (j < escaped.length && /[0-9.]/.test(escaped[j])) j++;
          out += '<span class="n">' + escaped.slice(i, j) + '</span>';
          i = j; continue;
        }
        if (/[A-Za-z_\u4e00-\u9fa5]/.test(c)) {
          let j = i;
          while (j < escaped.length && /[A-Za-z0-9_\u4e00-\u9fa5]/.test(escaped[j])) j++;
          const word = escaped.slice(i, j);
          out += kws.indexOf(word) !== -1 ? '<span class="k">' + word + '</span>' : word;
          i = j; continue;
        }
        out += c; i++;
      }
      return out;
    }).join('\n');
  }
  function scrollToQuiz() {
    const q = $('quiz');
    if (q && !q.hidden) q.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  let toastTimer = null;
  function showToast(msg, cls) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast' + (cls ? ' t-' + cls : '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- 侧栏 / 顶部进度 ---------- */
  function renderSidebar() {
    const list = $('levelList');
    list.innerHTML = '';
    LEVELS.forEach(function (lv) {
      const li = document.createElement('li');
      const done = state.completed.indexOf(lv.id) !== -1;
      const active = lv.id === state.current;
      const locked = !isUnlocked(lv.id);
      li.className = 'level-item' + (done ? ' done' : '') + (active ? ' active' : '') + (locked ? ' locked' : '');
      let icon = '';
      if (locked) {
        icon = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M7 10V7a5 5 0 0110 0v3" fill="none" stroke="#9aa5b1" stroke-width="2"/><rect x="5" y="10" width="14" height="10" rx="2" fill="#c7d0da"/></svg>';
      } else if (done) {
        icon = '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M4 12l5 5L20 6" fill="none" stroke="#26b67c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else {
        icon = '<svg viewBox="0 0 24 24" width="17" height="17"><circle cx="12" cy="12" r="8" fill="#3f8cff"/><circle cx="12" cy="12" r="3" fill="#fff"/></svg>';
      }
      li.innerHTML = '<span class="li-index">' + (done ? '' : lv.id) + '</span>' +
        '<span class="li-name">' + lv.name + '<span class="li-sub">' + lv.short + '</span></span>' +
        '<span class="li-icon">' + icon + '</span>';
      if (!locked) {
        li.addEventListener('click', function () {
          if (lv.id !== state.current) {
            state.current = lv.id;
            saveState(true);
            renderLevel();
          }
        });
      }
      list.appendChild(li);
    });

    const doneCount = state.completed.length;
    $('progressText').textContent = '第 ' + state.current + ' 关 · 共 ' + LEVELS.length + ' 关';
    $('progressPercent').textContent = Math.round(doneCount / LEVELS.length * 100) + '%';
    $('progressFill').style.width = Math.round(doneCount / LEVELS.length * 100) + '%';
    const nextOpen = LEVELS.filter(function (l) { return isUnlocked(l.id) && state.completed.indexOf(l.id) === -1; })[0];
    $('sidebarNote').innerHTML = '已通关 <strong>' + doneCount + '</strong> / ' + LEVELS.length + ' 关。' +
      (doneCount === 0
        ? '从第 1 关开始吧，每一关都要完成动手任务和小检测才能解锁下一关。'
        : (nextOpen
          ? '「' + nextOpen.name + '」已解锁，随时可以点击左侧关卡进入。进度已自动保存。'
          : '全部关卡已通关，进度已自动保存。'));
  }

  /* ---------- 教学面板 ---------- */
  const TAB_CONTENT = {
    intro: function (lv) { return '<h3>先讲个生活里的小故事</h3>' + lv.intro; },
    knowledge: function (lv) { return '<h3>这一关只要记住这些</h3>' + lv.knowledge; },
    example: function (lv) {
      let notes = '<h3>逐行看看它在干什么</h3><ul class="mini-list">' +
        lv.example.notes.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul>';
      return '<h3>一小段可以跑的代码</h3><div class="code-block"><div class="cb-head">example.py</div><pre>' +
        highlight(lv.example.code) + '</pre></div>' + notes;
    },
    task: function (lv) {
      const p = state.paper === 1 ? (lv.alt || lv) : lv;
      return '<h3>轮到你啦 <span class="paper-tag">' + (state.paper === 1 ? 'B 卷' : 'A 卷') + '</span></h3>' + p.task +
        '<div class="callout tip">写好后先点「运行看看」找找感觉，再点「提交闯关」让电脑批改。做错了没关系，会给你线索，不会直接贴答案。</div>';
    },
    check: function (lv) {
      if (state.quizPassed.indexOf(lv.id) !== -1) {
        return '<h3>小检测</h3><div class="callout goal">这一关的小检测已经通过啦！你真正掌握了这一关的内容。</div>';
      }
      if (state.taskPassed.indexOf(lv.id) !== -1) {
        return '<h3>小检测</h3><p>动手任务已经通过！往下滑，回答那道小检测题，就能解锁下一关。</p>';
      }
      return '<h3>小检测</h3><p>先完成上面的动手任务并通过批改，下面才会出现小检测题。</p><div class="callout note">这是为了让你真的学会，而不是只把代码抄一遍。慢慢来，一关一关走。</div>';
    }
  };

  function renderTab(name) {
    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === name);
    });
    $('tabPanel').innerHTML = TAB_CONTENT[name](level);
  }

  /* ---------- 渲染整关 ---------- */
  function renderLevel() {
    level = LEVELS[state.current - 1];
    hintIndex = 0;
    quizLocked = false;

    $('levelBadge').textContent = level.id;
    $('levelTitle').textContent = level.name;
    $('levelSubtitle').textContent = level.subtitle;
    const done = state.completed.indexOf(level.id) !== -1;
    $('levelStatus').textContent = done ? '已通关' : (level.id === LEVELS.length ? '最终项目' : '进行中');
    $('levelStatus').classList.toggle('done', done);

    // 欢迎回来 / 课程升级提示
    if (state.version !== 2 && state.completed.length > 0) {
      // 老进度升级：保留通关记录，但提示课程已强化，可自行选择继续或重来
      $('welcomeBanner').innerHTML = '<strong>课程已升级啦！</strong>闯关岛从 11 关扩展为 20 关强化版，前面关卡的任务和小检测也都变难了。' +
        '你的通关记录已经保留，可以从当前进度继续；如果想完整体验新难度，点右上角「重新开始」即可。';
      $('welcomeBanner').hidden = false;
      state.version = 2;
      saveState(true);
    } else if (state.current > 1 && !done) {
      const learned = state.completed.map(function (id) {
        const l = LEVELS[id - 1];
        return l ? l.short : '';
      }).filter(Boolean).join('、');
      $('welcomeBanner').innerHTML = '<strong>欢迎回来！</strong>你正在第 ' + state.current + ' 关「' + level.name +
        '」。已经学会：' + (learned || '第一关') + '。这一段我们会接着往下，不会重复已经学过的内容。';
      $('welcomeBanner').hidden = false;
    } else {
      $('welcomeBanner').hidden = true;
    }

    renderSidebar();
    renderTab('intro');

    const p = paper();

    // 编辑器
    $('codeEditor').value = (state.drafts[level.id] !== undefined ? state.drafts[level.id] : (p.starter || ''));
    updateLineNumbers();

    // 输入栏
    if (p.stdin) {
      $('stdinRow').hidden = false;
      $('stdinLabel').textContent = p.stdin.tip || '程序向你提问时，你回答：';
      $('stdinInput').value = state.stdinSaved[level.id] !== undefined ? state.stdinSaved[level.id] : p.stdin.value;
    } else {
      $('stdinRow').hidden = true;
      $('stdinInput').value = '';
    }

    // 清空反馈区
    $('output').textContent = '（还没有运行，先点「运行看看」吧）';
    $('output').classList.add('placeholder');
    $('feedback').hidden = true;
    $('hintBox').hidden = true;
    $('hintText').innerHTML = '';
    $('hintMore').hidden = true;

    // 小检测
    const quizDone = state.quizPassed.indexOf(level.id) !== -1;
    $('quiz').hidden = state.taskPassed.indexOf(level.id) === -1 && !quizDone;
    $('quizQuestion').textContent = p.quiz.question;
    renderQuiz(quizDone);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderQuiz(quizDone) {
    const box = $('quizOptions');
    const q = paper().quiz;
    box.innerHTML = '';
    quizLocked = !!quizDone;
    q.options.forEach(function (opt, i) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-option';
      b.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      if (quizDone && i === q.answer) b.classList.add('correct');
      if (quizDone) b.disabled = true;
      b.addEventListener('click', function () {
        if (quizLocked) return;
        const fb = $('quizFeedback');
        if (i === q.answer) {
          quizLocked = true;
          b.classList.add('correct');
          Array.prototype.forEach.call(box.children, function (x) { x.disabled = true; });
          fb.className = 'feedback ok';
          fb.innerHTML = '<strong>答对了！</strong>' + q.explain;
          fb.hidden = false;
          completeLevel();
        } else {
          b.classList.add('wrong');
          fb.className = 'feedback warn';
          fb.innerHTML = '再想一想～ Hint：回到"知识点"那一页看看刚才讲的内容。<br>答错没关系，换一个再试试。';
          fb.hidden = false;
        }
      });
      box.appendChild(b);
    });
  }

  function completeLevel() {
    if (state.quizPassed.indexOf(level.id) === -1) state.quizPassed.push(level.id);
    if (state.completed.indexOf(level.id) === -1) state.completed.push(level.id);
    saveState(true);
    renderSidebar();
    $('levelStatus').textContent = '已通关';
    $('levelStatus').classList.add('done');
    showModal();
  }

  /* ---------- 备份：导出 / 导入 ---------- */
  function exportProgress() {
    // 先把正在防抖的内容落盘，保证导出的是最新状态
    clearTimeout(saveTimer);
    const payload = {
      app: 'python-quest',
      version: 1,
      exportedAt: new Date().toISOString(),
      state: state
    };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '闯关岛进度备份-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      lastSaveAt = Date.now();
      updateSaveStatus('已导出备份', 'ok');
      showToast('备份文件已下载，妥善保存它就能在任何地方找回进度');
    } catch (e) {
      showToast('导出失败了，请换个浏览器再试试', 'warn');
    }
  }
  function importProgress(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      let incoming;
      try {
        const parsed = JSON.parse(reader.result);
        incoming = parsed && parsed.state ? parsed.state : parsed;  // 兼容直接存 state 的旧格式
      } catch (e) {
        showToast('这个文件读不懂，请选择本游戏导出的备份文件', 'warn');
        return;
      }
      const s = normalizeState(incoming);
      if (!s) {
        showToast('备份文件内容不对，无法恢复进度', 'warn');
        return;
      }
      if (!window.confirm('确定用这份备份覆盖当前进度吗？覆盖后当前的关卡记录会被替换。')) return;
      state = s;
      saveState(true);
      renderLevel();
      showToast('进度恢复成功，欢迎回来！');
    };
    reader.onerror = function () { showToast('读取文件失败，请重试', 'warn'); };
    reader.readAsText(file);
  }

  /* ---------- 运行与批改 ---------- */
  function getInputs() {
    const raw = $('stdinInput').value || '';
    return raw.split(/\r?\n/);
  }
  function execute() {
    const code = $('codeEditor').value;
    return { code: code, result: new PyInterp().run(code, getInputs()) };
  }
  function showOutput(r) {
    const o = $('output');
    o.classList.remove('placeholder');
    if (r.ok) {
      o.textContent = r.output.length ? r.output.join('\n') : '（程序跑完了，但没有输出任何东西。看看是不是忘了 print）';
    } else {
      o.textContent = (r.output.length ? r.output.join('\n') + '\n' : '') +
        '电脑没跑通：' + (r.error || '再检查一下') + (r.line ? '（第 ' + r.line + ' 行）' : '');
    }
  }
  function showFeedback(cls, html) {
    const f = $('feedback');
    f.className = 'feedback ' + cls;
    f.innerHTML = html;
    f.hidden = false;
  }

  function updateLineNumbers() {
    const n = $('codeEditor').value.split('\n').length;
    const el = $('lineNumbers');
    el.textContent = Array.from({ length: n }, function (_, i) { return i + 1; }).join('\n');
  }

  /* ---------- 弹窗 ---------- */
  function showModal() {
    const isFinal = level.id === LEVELS.length;
    $('modalIcon').innerHTML = isFinal
      ? '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M5 16l4-6 3 4 3-6 4 8z" fill="none" stroke="#8b6cf0" stroke-width="2" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 12l5 5L20 6" fill="none" stroke="#26b67c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    $('modalTitle').textContent = isFinal ? '全部闯关完成！' : '闯关成功！';
    $('modalText').textContent = isFinal
      ? '你独立完成了「简易个人记账小程序」——这是你的第一个完整 Python 作品。从零基础走到这里，真的很了不起！'
      : '你已经掌握第 ' + level.id + ' 关的全部内容。要开启第 ' + (level.id + 1) + ' 关「' + LEVELS[level.id].name + '」吗？';
    $('modalOk').textContent = isFinal ? '太棒了' : '开启下一关';
    $('modal').hidden = false;
  }

  /* ---------- 事件绑定 ---------- */
  function bind() {
    $('tabs').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-tab]');
      if (b) renderTab(b.getAttribute('data-tab'));
    });

    $('codeEditor').addEventListener('input', function () {
      updateLineNumbers();
      state.drafts[level.id] = $('codeEditor').value;
      scheduleSave();
    });
    $('codeEditor').addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const t = this, s = t.selectionStart, en = t.selectionEnd;
        t.value = t.value.slice(0, s) + '    ' + t.value.slice(en);
        t.selectionStart = t.selectionEnd = s + 4;
        t.dispatchEvent(new Event('input'));
      }
    });
    $('stdinInput').addEventListener('input', function () {
      state.stdinSaved[level.id] = $('stdinInput').value;
      scheduleSave();
    });

    $('runBtn').addEventListener('click', function () {
      const r = execute().result;
      showOutput(r);
      $('feedback').hidden = true;
      if (!r.ok) showFeedback('err', '<strong>先别急。</strong>' + (r.error || '再检查一下') +
        (r.line ? '（第 ' + r.line + ' 行）' : '') + '。点「给点提示」可以看到线索。');
    });

    $('submitBtn').addEventListener('click', function () {
      const out = execute();
      showOutput(out.result);
      if (!out.result.ok) {
        showFeedback('err', '<strong>这次没跑通。</strong>' + (out.result.error || '再检查一下') +
          (out.result.line ? '（第 ' + out.result.line + ' 行）' : '') +
          '。你已经写对了一部分思路，看看提示再改改。');
        $('hintBox').hidden = false;
        return;
      }
      const res = paper().check(out.result, out.code);
      if (res.passed) {
        if (state.taskPassed.indexOf(level.id) === -1) state.taskPassed.push(level.id);
        saveState(true);
        showFeedback('ok', '<strong>任务通过！</strong>' + res.message + ' 下面回答小检测题，就可以解锁下一关。');
        $('quiz').hidden = false;
        renderTab('check');
        scrollToQuiz();
      } else {
        showFeedback('warn', '<strong>思路很接近啦。</strong>' + res.message);
        $('hintBox').hidden = false;
      }
    });

    $('hintBtn').addEventListener('click', function () {
      const hints = paper().hints;
      if (hintIndex >= hints.length) {
        $('hintText').innerHTML += '<br>线索已经给完啦，把前面几条连起来试试看，你一定可以的。';
        $('hintBox').hidden = false;
        return;
      }
      const text = hints[hintIndex];
      $('hintText').innerHTML += (hintIndex === 0 ? '' : '<br>') + '<strong>' + (hintIndex + 1) + '.</strong> ' + text;
      hintIndex++;
      $('hintBox').hidden = false;
      $('hintMore').hidden = hintIndex >= hints.length;
    });
    $('hintMore').addEventListener('click', function () { $('hintBtn').click(); });

    $('modalCancel').addEventListener('click', function () {
      $('modal').hidden = true;
      // “再看看 / 逗留一会”之后：下一关其实已经解锁，明确告诉用户可以从地图进入。
      const next = LEVELS[level.id]; // level.id 从 1 开始，数组下标 id 即下一关
      if (next) {
        showFeedback('ok', '<strong>你已经通关第 ' + level.id + ' 关啦！</strong>「' + next.name +
          '」已经解锁，不急着走也没关系——随时点击左侧关卡地图里的它就能继续。');
        $('feedback').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    $('modalOk').addEventListener('click', function () {
      $('modal').hidden = true;
      if (level.id < LEVELS.length) {
        state.current = level.id + 1;
        saveState(true);
        renderLevel();
      }
    });

    $('saveBtn').addEventListener('click', function () {
      clearTimeout(saveTimer);   // 取消待执行的防抖，立即保存当前内容
      saveState(false);
    });

    $('exportBtn').addEventListener('click', exportProgress);
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (e) {
      importProgress(e.target.files && e.target.files[0]);
      e.target.value = '';   // 允许重复选同一个文件
    });

    $('resetBtn').addEventListener('click', function () {
      const nextPaper = state.paper === 1 ? 0 : 1;
      if (!window.confirm('确定要清空所有闯关进度，从第 1 关重新开始吗？\n\n这次会自动换成另一套全新题目（' +
        (nextPaper === 1 ? 'B 卷' : 'A 卷') + '）的任务和小检测，示例与讲解保持不变。')) return;
      state = { version: 2, paper: nextPaper, current: 1, completed: [], taskPassed: [], quizPassed: [], drafts: {}, stdinSaved: {} };
      saveState(true);
      renderLevel();
      showToast('进度已清空，已从 ' + (nextPaper === 1 ? 'B 卷' : 'A 卷') + ' 第 1 关重新开始');
    });
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    bind();
    renderLevel();
    // 如果有正在防抖的输入，离开页面前立刻落盘，避免最后几个字丢失
    window.addEventListener('beforeunload', flushSave);
    window.addEventListener('pagehide', flushSave);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushSave();
    });
    // 初始化保存状态提示：显示上次保存时间（若本次是全新开始则显示提示语）
    if (lastSaveAt) {
      updateSaveStatus('已保存 ' + new Date(lastSaveAt).toLocaleTimeString('zh-CN', { hour12: false }), 'ok');
    }
  });
  function flushSave() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; saveState(true); }
  }
})();
