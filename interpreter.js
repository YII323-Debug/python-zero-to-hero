/* ============================================================
 * 迷你 Python 解释器（教学专用子集 · 进阶版）
 * 支持：print/input/变量/四则运算与取余//、比较/逻辑运算/
 *      if-else / while+break+continue / for+range /
 *      列表 / 字典 / 字符串方法 / f-string / 函数+默认参数 /
 *      递归 / 文件读写 / try-except / 类与对象
 * 所有错误都转成大白话，不暴露英文 Traceback。
 * ============================================================ */
(function (global) {
  'use strict';

  class PyError extends Error {
    constructor(message, line) {
      super(message);
      this.name = 'PyError';
      this.line = line || null;
    }
  }

  class Env {
    constructor(parent) { this.vars = new Map(); this.parent = parent || null; }
    get(name, line) {
      if (this.vars.has(name)) return this.vars.get(name);
      if (this.parent) return this.parent.get(name, line);
      throw new PyError('还没见过叫「' + name + '」的东西，先给它装一个值吧', line);
    }
    set(name, value) { this.vars.set(name, value); }
    has(name) { return this.vars.has(name) || (this.parent ? this.parent.has(name) : false); }
  }

  function isDict(v) { return !!(v && v.__dict); }
  function isObj(v) { return !!(v && v.__obj); }

  /* ---------- 表达式解析 ---------- */
  class ExprParser {
    constructor(tokens, interp, env, line) {
      this.toks = tokens; this.i = 0;
      this.interp = interp; this.env = env; this.line = line;
    }
    peek() { return this.toks[this.i] || null; }
    peek2() { return this.toks[this.i + 1] || null; }
    next() {
      const t = this.toks[this.i];
      if (!t) throw new PyError('这里好像少写了点内容', this.line);
      this.i++; return t;
    }
    isOp(v) { const t = this.peek(); return !!t && t.v === v; }
    parse() { return this.orExpr(); }

    /* or / and / not 逻辑运算 */
    orExpr() {
      let left = this.andExpr();
      while (this.isOp('or')) {
        this.next();
        const right = this.andExpr();
        left = !!left || !!right;
      }
      return left;
    }
    andExpr() {
      let left = this.notExpr();
      while (this.isOp('and')) {
        this.next();
        const right = this.notExpr();
        left = !!left && !!right;
      }
      return left;
    }
    notExpr() {
      if (this.isOp('not')) { this.next(); return !this.notExpr(); }
      return this.compare();
    }

    /* 比较：== != > < >= <= in / not in */
    compare() {
      let left = this.add();
      const ops = ['==', '!=', '>=', '<=', '>', '<', 'in'];
      while (this.peek()) {
        let op = this.peek().v;
        if (op === 'not' && this.peek2() && this.peek2().v === 'in') {
          this.next(); this.next(); op = 'not in';
        } else if (ops.indexOf(op) !== -1) {
          this.next();
        } else break;
        const right = this.add();
        left = this.interp.compare(op, left, right, this.line);
      }
      return left;
    }
    add() {
      let left = this.mul();
      while (this.isOp('+') || this.isOp('-')) {
        const op = this.next().v;
        const right = this.mul();
        left = op === '+' ? this.interp.add(left, right, this.line) : this.interp.sub(left, right, this.line);
      }
      return left;
    }
    mul() {
      let left = this.unary();
      while (['*', '/', '//', '%'].indexOf(this.peek() ? this.peek().v : '') !== -1) {
        const op = this.next().v;
        left = this.interp.mul(op, left, this.unary(), this.line);
      }
      return left;
    }
    unary() {
      if (this.isOp('-')) { this.next(); return this.interp.neg(this.unary(), this.line); }
      if (this.isOp('+')) { this.next(); return this.unary(); }
      return this.power();
    }
    power() {
      const base = this.postfix();
      if (this.isOp('**')) { this.next(); return Math.pow(this.interp.asNumber(base, this.line), this.interp.asNumber(this.power(), this.line)); }
      return base;
    }
    postfix() {
      let node = this.primary();
      while (true) {
        if (this.isOp('[')) {
          this.next();
          let start = null, end = null, step = null;
          if (!this.isOp(':')) start = this.parse();
          if (this.isOp(':')) {
            this.next();
            if (!this.isOp(']') && !this.isOp(':')) end = this.parse();
            if (this.isOp(':')) { this.next(); if (!this.isOp(']')) step = this.parse(); }
            if (!this.isOp(']')) throw new PyError('方括号没有关上，写法应该是 清单[0] 这样', this.line);
            this.next();
            node = this.interp.slice(node, start, end, step, this.line);
          } else {
            if (!this.isOp(']')) throw new PyError('方括号没有关上，写法应该是 清单[0] 这样', this.line);
            this.next();
            node = this.interp.index(node, start, this.line);
          }
        } else if (this.isOp('.')) {
          this.next();
          const name = this.next().v;
          if (this.isOp('(')) {
            this.next();
            node = this.interp.callMethod(node, name, this.args(), this.line);
          } else {
            node = this.interp.getAttr(node, name, this.line);
          }
        } else break;
      }
      return node;
    }
    args() {
      const out = [];
      while (this.peek() && this.peek().v !== ')') {
        out.push(this.parse());
        if (this.isOp(',')) { this.next(); continue; }
        break;
      }
      if (!this.isOp(')')) throw new PyError('小括号没有关上，检查一下括号是不是成对', this.line);
      this.next(); return out;
    }
    primary() {
      const t = this.next();
      if (t.t === 'num' || t.t === 'str') return t.v;
      if (t.t === 'fstr') {
        return String(t.v).replace(/\{([^{}]+)\}/g, (m, inner) => {
          const sub = this.interp.tokenize(inner.trim());
          const val = this.interp.evalTokens(sub, this.env, this.line);
          return this.interp.display(val);
        });
      }
      if (t.t === 'id') {
        if (t.v === 'True') return true;
        if (t.v === 'False') return false;
        if (t.v === 'None') return null;
        if (this.isOp('(')) {
          this.next();
          return this.interp.callFunction(t.v, this.args(), this.env, this.line);
        }
        return this.env.get(t.v, this.line);
      }
      if (t.v === '(') {
        const v = this.parse();
        if (!this.isOp(')')) throw new PyError('小括号没有关上', this.line);
        this.next(); return v;
      }
      if (t.v === '[') {
        const arr = [];
        while (this.peek() && this.peek().v !== ']') {
          arr.push(this.parse());
          if (this.isOp(',')) { this.next(); continue; }
          break;
        }
        if (!this.isOp(']')) throw new PyError('方括号没有关上，清单要写成 [ ... ]', this.line);
        this.next(); return arr;
      }
      if (t.v === '{') {
        const d = new Map();
        while (this.peek() && this.peek().v !== '}') {
          const key = this.parse();
          if (!this.isOp(':')) throw new PyError('字典要写成 {钥匙: 值} 这样，中间用冒号', this.line);
          this.next();
          const val = this.parse();
          d.set(key, val);
          if (this.isOp(',')) { this.next(); continue; }
          break;
        }
        if (!this.isOp('}')) throw new PyError('字典的大括号没有关上', this.line);
        this.next();
        return { __dict: true, data: d };
      }
      throw new PyError('这里写的东西电脑看不懂，检查一下标点', this.line);
    }
  }

  class Interpreter {
    constructor() { this.reset([]); }

    reset(inputs) {
      this.output = [];
      this.inputs = (inputs || []).slice();
      this.inputIdx = 0;
      this.files = {};
      this.functions = {};
      this.classes = {};
      this.steps = 0;
      this.maxSteps = 50000;
    }

    /* ---------- 显示/转换 ---------- */
    display(v) {
      if (v === null || v === undefined) return 'None';
      if (v === true) return 'True';
      if (v === false) return 'False';
      if (isDict(v)) {
        return '{' + Array.from(v.data.entries()).map(([k, val]) => this.repr(k) + ': ' + this.repr(val)).join(', ') + '}';
      }
      if (isObj(v)) return '<' + v.__class + ' 对象>';
      if (Array.isArray(v)) return '[' + v.map(x => this.repr(x)).join(', ') + ']';
      return String(v);
    }
    repr(v) { return typeof v === 'string' ? '"' + v + '"' : this.display(v); }
    asNumber(v, line, what) {
      if (typeof v === 'number') return v;
      if (typeof v === 'boolean') return v ? 1 : 0;
      throw new PyError('这里需要的是数字，可你给的是「' + this.display(v) + '」', line);
    }
    add(a, b, line) {
      if (typeof a === 'number' && typeof b === 'number') return a + b;
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
      throw new PyError('数字和文字不能直接加在一起哦', line);
    }
    sub(a, b, line) { return this.asNumber(a, line) - this.asNumber(b, line); }
    mul(op, a, b, line) {
      if (op === '*' && typeof a === 'string' && typeof b === 'number') return a.repeat(Math.max(0, Math.floor(b)));
      const x = this.asNumber(a, line), y = this.asNumber(b, line);
      if (op === '*') return x * y;
      if (op === '/') { if (y === 0) throw new PyError('不能除以 0，就像不能把东西分给 0 个人', line); return x / y; }
      if (op === '//') { if (y === 0) throw new PyError('不能除以 0', line); return Math.floor(x / y); }
      return x % y;
    }
    neg(a, line) { return -this.asNumber(a, line); }
    compare(op, a, b, line) {
      let r;
      switch (op) {
        case '==': r = (typeof a === typeof b && a === b); break;
        case '!=': r = !(typeof a === typeof b && a === b); break;
        case '>': r = this.asNumber(a, line) > this.asNumber(b, line); break;
        case '<': r = this.asNumber(a, line) < this.asNumber(b, line); break;
        case '>=': r = this.asNumber(a, line) >= this.asNumber(b, line); break;
        case '<=': r = this.asNumber(a, line) <= this.asNumber(b, line); break;
        case 'in':
        case 'not in': {
          let inside = false;
          if (Array.isArray(b)) inside = b.some(x => x === a);
          else if (isDict(b)) inside = b.data.has(a);
          else if (typeof b === 'string') inside = b.indexOf(String(a)) !== -1;
          else throw new PyError('「in」后面要跟着一串东西或文字', line);
          r = op === 'in' ? inside : !inside;
          break;
        }
        default: throw new PyError('这个比较符号电脑不认识', line);
      }
      return r;
    }
    index(obj, idx, line) {
      if (isDict(obj)) {
        if (!obj.data.has(idx)) throw new PyError('字典里没有「' + this.display(idx) + '」这把钥匙', line);
        return obj.data.get(idx);
      }
      if (!Array.isArray(obj) && typeof obj !== 'string') throw new PyError('只有清单或文字才能用 [ ] 取东西', line);
      const i = this.asNumber(idx, line);
      if (!Number.isInteger(i)) throw new PyError('方括号里要写第几个，比如 0、1、2', line);
      if (i < 0 || i >= obj.length) throw new PyError('这个位置还没有东西，只有 ' + obj.length + ' 项', line);
      return obj[i];
    }
    slice(obj, start, end, step, line) {
      if (!Array.isArray(obj) && typeof obj !== 'string') throw new PyError('只有清单或文字才能这样截取一段', line);
      const n = obj.length;
      const s = start === null ? (step !== null && step < 0 ? n - 1 : 0) : this.asNumber(start, line);
      const e = end === null ? (step !== null && step < 0 ? -1 : n) : this.asNumber(end, line);
      const st = step === null ? 1 : this.asNumber(step, line);
      const out = [];
      let i = s;
      if (st > 0) { while (i < e && i < n) { if (i >= 0) out.push(obj[i]); i += st; } }
      else if (st < 0) { while (i > e && i >= -n) { if (i < n) out.push(obj[i]); i += st; } }
      else throw new PyError('截取的步长不能是 0', line);
      return typeof obj === 'string' ? out.join('') : out;
    }
    getAttr(obj, name, line) {
      if (isObj(obj)) {
        if (obj.attrs.has(name)) return obj.attrs.get(name);
        throw new PyError('这个东西没有「' + name + '」这个属性', line);
      }
      throw new PyError('这个东西没有「' + name + '」这一部分', line);
    }
    setAttr(obj, name, value, line) {
      if (isObj(obj)) { obj.attrs.set(name, value); return; }
      throw new PyError('这个东西不能装「' + name + '」这样的属性', line);
    }

    callMethod(obj, name, args, line) {
      /* 清单方法 */
      if (Array.isArray(obj)) {
        switch (name) {
          case 'append': obj.push(args[0]); return null;
          case 'extend': (args[0] || []).forEach(x => obj.push(x)); return null;
          case 'insert': obj.splice(this.asNumber(args[0], line), 0, args[1]); return null;
          case 'pop': return obj.pop(args.length ? this.asNumber(args[0], line) : undefined);
          case 'remove': { const i = obj.indexOf(args[0]); if (i === -1) throw new PyError('清单里没有「' + this.display(args[0]) + '」，删不掉', line); obj.splice(i, 1); return null; }
          case 'clear': obj.length = 0; return null;
          case 'sort': obj.sort((a, b) => this.asNumber(a, line) - this.asNumber(b, line)); return null;
          case 'reverse': obj.reverse(); return null;
          case 'count': return obj.filter(x => x === args[0]).length;
          case 'index': { const i = obj.indexOf(args[0]); if (i === -1) throw new PyError('清单里没有「' + this.display(args[0]) + '」', line); return i; }
        }
      }
      /* 字符串方法 */
      if (typeof obj === 'string') {
        const s = args.length ? this.display(args[0]) : '';
        switch (name) {
          case 'upper': return obj.toUpperCase();
          case 'lower': return obj.toLowerCase();
          case 'strip': return obj.trim();
          case 'split': return s ? obj.split(s) : obj.trim().split(/\s+/);
          case 'replace': return obj.split(s).join(this.display(args[1]));
          case 'find': return obj.indexOf(s);
          case 'startswith': return obj.startsWith(s);
          case 'endswith': return obj.endsWith(s);
          case 'isdigit': return /^\d+$/.test(obj);
          case 'isalpha': return /^[A-Za-z]+$/.test(obj);
          case 'count': return obj.split(s).length - 1;
          case 'format': {
            let out = obj;
            args.forEach(a => { out = out.replace('{}', this.display(a)); });
            return out;
          }
        }
      }
      /* 字典方法 */
      if (isDict(obj)) {
        const k = args[0];
        switch (name) {
          case 'get': return obj.data.has(k) ? obj.data.get(k) : (args.length > 1 ? args[1] : null);
          case 'keys': return Array.from(obj.data.keys());
          case 'values': return Array.from(obj.data.values());
          case 'items': return Array.from(obj.data.entries()).map(([a, b]) => [a, b]);
          case 'pop': { const v = obj.data.get(k); obj.data.delete(k); return v; }
          case 'clear': obj.data.clear(); return null;
        }
      }
      /* 文件方法 */
      if (obj && obj.__file) {
        if (name === 'write') { obj.content += this.display(args[0]); this.files[obj.name] = obj.content; return null; }
        if (name === 'read') return this.files[obj.name] || '';
        if (name === 'readlines') return (this.files[obj.name] || '').split('\n').filter(x => x !== '');
        if (name === 'close') { this.files[obj.name] = obj.content; return null; }
      }
      /* 对象方法 */
      if (isObj(obj)) {
        const cls = this.classes[obj.__class];
        const m = cls && cls.methods[name];
        if (m) {
          const local = new Env(cls.env);
          local.set('self', obj);
          m.params.filter(p => p.name !== 'self').forEach((p, i) => local.set(p.name, args[i]));
          const r = this.execBlock(m.body, local, m.baseIndent);
          return r.value === undefined ? null : r.value;
        }
      }
      throw new PyError('电脑还不会「' + name + '」这个动作', line);
    }

    /* ---------- 函数/内置/类 ---------- */
    callFunction(name, args, env, line) {
      if (name === 'print') { this.output.push(args.map(a => this.display(a)).join(' ')); return null; }
      if (name === 'input') {
        if (args.length) this.output.push(this.display(args[0]) + '（你回答：' + (this.inputs[this.inputIdx] === undefined ? '' : this.inputs[this.inputIdx]) + '）');
        const v = this.inputs[this.inputIdx++];
        return v === undefined ? '' : v;
      }
      if (name === 'range') {
        let start = 0, end, step = 1;
        if (args.length === 1) end = this.asNumber(args[0], line);
        else if (args.length >= 2) { start = this.asNumber(args[0], line); end = this.asNumber(args[1], line); if (args[2] !== undefined) step = this.asNumber(args[2], line); }
        else throw new PyError('range 里写一个数就可以，比如 range(3)', line);
        const out = [];
        if (step > 0) for (let i = start; i < end; i += step) out.push(i);
        else for (let i = start; i > end; i += step) out.push(i);
        return out;
      }
      if (name === 'int') {
        const v = args[0];
        if (typeof v === 'number') return Math.trunc(v);
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (typeof v === 'string') {
          const n = parseInt(v.trim(), 10);
          if (isNaN(n)) throw new PyError('「' + v + '」不是数字，没法变成数字哦', line);
          return n;
        }
        throw new PyError('这个东西没法变成数字', line);
      }
      if (name === 'float') {
        const n = parseFloat(String(args[0]).trim());
        if (isNaN(n)) throw new PyError('「' + this.display(args[0]) + '」不是数字', line);
        return n;
      }
      if (name === 'str') return this.display(args[0]);
      if (name === 'bool') return !!args[0];
      if (name === 'len') {
        const v = args[0];
        if (typeof v === 'string' || Array.isArray(v)) return v.length;
        if (isDict(v)) return v.data.size;
        throw new PyError('只有文字、清单和字典能数长度', line);
      }
      if (name === 'sum') {
        const v = args[0];
        if (!Array.isArray(v)) throw new PyError('sum 要把一清单数字加起来', line);
        return v.reduce((a, b) => a + this.asNumber(b, line), 0);
      }
      if (name === 'max' || name === 'min') {
        const v = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        if (!v.length) throw new PyError('里面没有东西，比不出大小', line);
        return v.reduce((a, b) => (name === 'max' ? (b > a ? b : a) : (b < a ? b : a)));
      }
      if (name === 'sorted') {
        const v = args[0];
        if (!Array.isArray(v)) throw new PyError('sorted 要给一清单东西排序', line);
        return v.slice().sort((a, b) => this.asNumber(a, line) - this.asNumber(b, line));
      }
      if (name === 'abs') return Math.abs(this.asNumber(args[0], line));
      if (name === 'round') {
        const n = this.asNumber(args[0], line), d = args.length > 1 ? this.asNumber(args[1], line) : 0;
        return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
      }
      if (name === 'open') {
        const fname = this.display(args[0]);
        const mode = args.length > 1 ? this.display(args[1]) : 'r';
        let content = '';
        if (mode.indexOf('a') !== -1) content = this.files[fname] || '';
        else if (mode.indexOf('w') === -1) content = this.files[fname] || '';
        return { __file: true, name: fname, mode, content };
      }
      /* 类实例化 */
      if (this.classes[name]) {
        const obj = { __obj: true, __class: name, attrs: new Map() };
        const init = this.classes[name].methods['__init__'];
        if (init) {
          const local = new Env(this.classes[name].env);
          local.set('self', obj);
          init.params.filter(p => p.name !== 'self').forEach((p, i) => local.set(p.name, args[i]));
          this.execBlock(init.body, local, init.baseIndent);
        }
        return obj;
      }
      /* 自定义函数 */
      if (this.functions[name]) {
        const fn = this.functions[name];
        const local = new Env(fn.env);
        fn.params.forEach((p, i) => {
          if (i < args.length) local.set(p.name, args[i]);
          else if (p.def !== null) local.set(p.name, this.evalTokens(p.def, fn.env, line));
          else local.set(p.name, null);
        });
        const r = this.execBlock(fn.body, local, fn.baseIndent);
        return r.value === undefined ? null : r.value;
      }
      throw new PyError('电脑不认识「' + name + '」这个动作，看看是不是拼错了', line);
    }

    /* ---------- 词法 ---------- */
    tokenize(raw) {
      const tokens = [];
      let i = 0;
      while (i < raw.length) {
        const c = raw[i];
        if (c === ' ' || c === '\t') { i++; continue; }
        if (c === '#') break;
        if ((c === 'f' || c === 'F') && (raw[i + 1] === '"' || raw[i + 1] === "'")) {
          i++;
          const q = raw[i]; i++;
          let s = '';
          while (i < raw.length && raw[i] !== q) {
            if (raw[i] === '\\' && i + 1 < raw.length) {
              const n = raw[i + 1];
              s += (n === 'n' ? '\n' : n === 't' ? '\t' : n); i += 2;
            } else { s += raw[i]; i++; }
          }
          if (i >= raw.length) throw new PyError('引号没有成对，后面的话电脑看不懂');
          i++; tokens.push({ t: 'fstr', v: s }); continue;
        }
        if (c === '"' || c === "'") {
          const q = c; i++;
          let s = '';
          while (i < raw.length && raw[i] !== q) {
            if (raw[i] === '\\' && i + 1 < raw.length) {
              const n = raw[i + 1];
              s += (n === 'n' ? '\n' : n === 't' ? '\t' : n); i += 2;
            } else { s += raw[i]; i++; }
          }
          if (i >= raw.length) throw new PyError('引号没有成对，后面的话电脑看不懂');
          i++; tokens.push({ t: 'str', v: s }); continue;
        }
        if (/[0-9]/.test(c)) {
          let num = '';
          while (i < raw.length && /[0-9.]/.test(raw[i])) { num += raw[i]; i++; }
          tokens.push({ t: 'num', v: parseFloat(num) }); continue;
        }
        if (/[\p{L}\p{N}_]/u.test(c)) {
          let id = '';
          while (i < raw.length && /[\p{L}\p{N}_]/u.test(raw[i])) { id += raw[i]; i++; }
          tokens.push({ t: 'id', v: id }); continue;
        }
        const ops = ['==', '!=', '>=', '<=', '//', '**', '+', '-', '*', '/', '%', '>', '<', '=', '(', ')', '[', ']', '{', '}', ',', ':', '.'];
        let matched = false;
        for (let k = 0; k < ops.length; k++) {
          if (raw.startsWith(ops[k], i)) { tokens.push({ t: 'op', v: ops[k] }); i += ops[k].length; matched = true; break; }
        }
        if (!matched) throw new PyError('出现了一个电脑不认识的符号：' + c);
      }
      return tokens;
    }
    evalTokens(tokens, env, line) {
      const p = new ExprParser(tokens, this, env, line);
      const v = p.parse();
      if (p.peek()) throw new PyError('这一行后面多出了电脑看不懂的内容', line);
      return v;
    }

    /* ---------- 语句块 ---------- */
    step() {
      this.steps++;
      if (this.steps > this.maxSteps) throw new PyError('这个循环好像一直停不下来，检查一下有没有让情况发生变化');
    }
    collect(lines, from, parentIndent) {
      const child = []; let j = from;
      while (j < lines.length) {
        const ln = lines[j];
        if (ln.text.trim() === '' || ln.indent > parentIndent) { child.push(ln); j++; }
        else break;
      }
      return { child, next: j };
    }
    baseOf(child) {
      for (let k = 0; k < child.length; k++) if (child[k].text.trim() !== '') return child[k].indent;
      return 0;
    }

    execBlock(lines, env, baseIndent) {
      let i = 0;
      while (i < lines.length) {
        this.step();
        const ln = lines[i];
        if (ln.text.trim() === '') { i++; continue; }
        if (ln.indent !== baseIndent) throw new PyError('缩进不太对：靠前空出来的格子表示「这件事归谁管」，多空或少空两格试试', ln.lineNo);
        const t = this.tokenize(ln.text);
        if (!t.length) { i++; continue; }
        const first = t[0].v;

        /* if */
        if (first === 'if') {
          const colon = t.length - 1;
          if (!t[colon] || t[colon].v !== ':') throw new PyError('if 那一行的最后要加一个冒号「:」', ln.lineNo);
          const cond = this.evalTokens(t.slice(1, colon), env, ln.lineNo);
          const c = this.collect(lines, i + 1, ln.indent);
          if (cond) { const r = this.execBlock(c.child, env, this.baseOf(c.child)); if (r && r.control) return r; }
          if (c.next < lines.length) {
            const nt = this.tokenize(lines[c.next].text);
            if (nt.length && nt[0].v === 'else') {
              const ec = this.collect(lines, c.next + 1, lines[c.next].indent);
              if (!cond) { const r = this.execBlock(ec.child, env, this.baseOf(ec.child)); if (r && r.control) return r; }
              i = ec.next; continue;
            }
          }
          i = c.next; continue;
        }

        /* while */
        if (first === 'while') {
          const colon = t.length - 1;
          if (!t[colon] || t[colon].v !== ':') throw new PyError('while 那一行的最后要加一个冒号「:」', ln.lineNo);
          const condTokens = t.slice(1, colon);
          const c = this.collect(lines, i + 1, ln.indent);
          const base = this.baseOf(c.child);
          let guard = 0;
          while (this.evalTokens(condTokens, env, ln.lineNo)) {
            this.step(); guard++;
            if (guard > 20000) throw new PyError('这个循环好像一直停不下来', ln.lineNo);
            const r = this.execBlock(c.child, env, base);
            if (r && r.control === 'break') break;
            if (r && r.control === 'return') return r;
          }
          i = c.next; continue;
        }

        /* for */
        if (first === 'for') {
          const inIdx = t.findIndex(x => x.v === 'in');
          const colon = t.length - 1;
          if (inIdx < 2 || !t[colon] || t[colon].v !== ':') throw new PyError('for 要写成：for 名字 in 一串东西:  （最后有冒号）', ln.lineNo);
          const varName = t[1].v;
          const iterable = this.evalTokens(t.slice(inIdx + 1, colon), env, ln.lineNo);
          const c = this.collect(lines, i + 1, ln.indent);
          const base = this.baseOf(c.child);
          const loopOver = isDict(iterable) ? Array.from(iterable.data.keys()) : iterable;
          if (!Array.isArray(loopOver) && typeof loopOver !== 'string') throw new PyError('for 后面要跟着一串能一个个数出来的东西，比如 range(3) 或清单', ln.lineNo);
          for (const val of loopOver) {
            this.step(); env.set(varName, val);
            const r = this.execBlock(c.child, env, base);
            if (r && r.control === 'break') break;
            if (r && r.control === 'return') return r;
          }
          i = c.next; continue;
        }

        /* def */
        if (first === 'def') {
          const name = t[1] ? t[1].v : null;
          const open = t.findIndex(x => x.v === '(');
          let close = -1;
          for (let k = open + 1; k < t.length; k++) if (t[k].v === ')') { close = k; break; }
          if (!name || open < 0 || close < 0) throw new PyError('定义函数要写成：def 名字():  （最后有冒号）', ln.lineNo);
          const params = [];
          const ptoks = t.slice(open + 1, close);
          let pk = 0;
          while (pk < ptoks.length) {
            if (ptoks[pk].t !== 'id') { pk++; continue; }
            const pname = ptoks[pk].v; pk++;
            let def = null;
            if (ptoks[pk] && ptoks[pk].v === '=') { pk++; const start = pk; while (pk < ptoks.length && ptoks[pk].v !== ',') pk++; def = ptoks.slice(start, pk); }
            params.push({ name: pname, def });
            if (ptoks[pk] && ptoks[pk].v === ',') pk++;
          }
          const c = this.collect(lines, i + 1, ln.indent);
          this.functions[name] = { params, body: c.child, env, baseIndent: this.baseOf(c.child) };
          i = c.next; continue;
        }

        /* class */
        if (first === 'class') {
          const name = t[1] ? t[1].v : null;
          if (!name || !t[t.length - 1] || t[t.length - 1].v !== ':') throw new PyError('定义要写成：class 名字:  （最后有冒号）', ln.lineNo);
          const c = this.collect(lines, i + 1, ln.indent);
          const methods = {};
          let j = 0;
          while (j < c.child.length) {
            const ct = this.tokenize(c.child[j].text);
            if (ct[0] && ct[0].v === 'def' && ct[1]) {
              const mname = ct[1].v;
              const op = ct.findIndex(x => x.v === '(');
              let cl = -1;
              for (let k = op + 1; k < ct.length; k++) if (ct[k].v === ')') { cl = k; break; }
              const params = ct.slice(op + 1, cl).filter(x => x.t === 'id').map(x => ({ name: x.v, def: null }));
              const mc = this.collect(c.child, j + 1, c.child[j].indent);
              methods[mname] = { params, body: mc.child, baseIndent: this.baseOf(mc.child) };
              j = mc.next;
            } else j++;
          }
          this.classes[name] = { name, methods, env, body: c.child, baseIndent: this.baseOf(c.child) };
          i = c.next; continue;
        }

        /* try / except */
        if (first === 'try') {
          const c = this.collect(lines, i + 1, ln.indent);
          let failed = null;
          try {
            const r = this.execBlock(c.child, env, this.baseOf(c.child));
            if (r && r.control) return r;
            i = c.next; continue;
          } catch (e) {
            failed = e;
          }
          if (c.next < lines.length) {
            const et = this.tokenize(lines[c.next].text);
            if (et.length && et[0].v === 'except') {
              if (et[2] && et[2].v === 'as' && et[3]) env.set(et[3].v, failed.message);
              const ec = this.collect(lines, c.next + 1, lines[c.next].indent);
              const r = this.execBlock(ec.child, env, this.baseOf(ec.child));
              if (r && r.control) return r;
              i = ec.next; continue;
            }
          }
          throw failed;
        }

        /* return / break / continue */
        if (first === 'return') {
          const val = t.length > 1 ? this.evalTokens(t.slice(1), env, ln.lineNo) : null;
          return { control: 'return', value: val };
        }
        if (first === 'break') return { control: 'break' };
        if (first === 'continue') return { control: 'continue' };

        /* 对象属性赋值：obj.attr = 值 */
        if (t.length >= 5 && t[0].t === 'id' && t[1].v === '.' && t[2].t === 'id' && t[3].v === '=') {
          const obj = env.get(t[0].v, ln.lineNo);
          const val = this.evalTokens(t.slice(4), env, ln.lineNo);
          this.setAttr(obj, t[2].v, val, ln.lineNo);
          i++; continue;
        }
        /* 赋值：名字 = 值 / += / -= */
        if (t.length >= 3 && t[1] && (t[1].v === '=' || t[1].v === '+=' || t[1].v === '-=')) {
          if (t[0].t !== 'id') throw new PyError('等号左边要是一个名字，比如 price = 15', ln.lineNo);
          const op = t[1].v;
          const val = this.evalTokens(t.slice(2), env, ln.lineNo);
          if (op === '=') env.set(t[0].v, val);
          else {
            const old = env.get(t[0].v, ln.lineNo);
            env.set(t[0].v, op === '+=' ? this.add(old, val, ln.lineNo) : this.sub(old, val, ln.lineNo));
          }
          i++; continue;
        }
        /* 清单/字典指定位置赋值 */
        if (t.length >= 6 && t[0].t === 'id' && t[1].v === '[' && t[3].v === ']' && t[4].v === '=') {
          const target = env.get(t[0].v, ln.lineNo);
          const key = this.evalTokens([t[2]], env, ln.lineNo);
          const val = this.evalTokens(t.slice(5), env, ln.lineNo);
          if (isDict(target)) target.data.set(key, val);
          else if (Array.isArray(target)) target[this.asNumber(key, ln.lineNo)] = val;
          else throw new PyError('这个东西不能按位置装东西', ln.lineNo);
          i++; continue;
        }

        this.evalTokens(t, env, ln.lineNo);
        i++;
      }
      return { control: null };
    }

    run(code, inputs) {
      this.reset(inputs);
      try {
        const lines = String(code).split(/\r?\n/).map((raw, idx) => {
          let indent = 0;
          while (indent < raw.length && (raw[indent] === ' ' || raw[indent] === '\t')) indent += (raw[indent] === '\t' ? 4 : 1);
          return { indent, text: raw.slice(indent), lineNo: idx + 1 };
        });
        const global = new Env();
        this.execBlock(lines, global, 0);
        return { ok: true, output: this.output.slice(), env: global, files: Object.assign({}, this.files), classes: this.classes };
      } catch (e) {
        if (e instanceof PyError) {
          return { ok: false, output: this.output.slice(), error: e.message, line: e.line, env: new Env(), files: Object.assign({}, this.files), classes: this.classes };
        }
        return { ok: false, output: this.output.slice(), error: '电脑执行时遇到了一点麻烦：' + (e && e.message ? e.message : '未知问题'), line: null, env: new Env(), files: {}, classes: this.classes };
      }
    }
  }

  global.PyInterp = Interpreter;
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) module.exports = { PyInterp: (typeof window !== 'undefined' ? window : globalThis).PyInterp };
