/* ============================================================
 * 20 关课程内容（参考《Python-100天》基础篇与进阶篇改编）
 * 规则：每关只讲当前必须用的内容；术语第一次出现先用生活类比；
 *      先感受例子再命名概念；任务只考本关；提示不给完整答案。
 * ============================================================ */
(function (global) {
  'use strict';

  function outHas(r, s) { return !!r.ok && r.output.some(function (x) { return String(x).indexOf(s) !== -1; }); }
  function varVal(r, n) { return r.ok && r.env.vars.has(n) ? r.env.vars.get(n) : undefined; }
  function dictVal(r, n, k) {
    const d = varVal(r, n);
    return d && d.__dict && d.data.has(k) ? d.data.get(k) : undefined;
  }
  function fileContent(r, name) { return r.ok && r.files ? r.files[name] : undefined; }
  function runFail(r) {
    return { passed: false, message: '这次电脑没跑通：' + (r.error || '再检查一下写法') + (r.line ? '（第 ' + r.line + ' 行）' : '') + '。别灰心，看看下面的小线索，改一改再来。' };
  }
  function ok(msg) { return { passed: true, message: msg }; }

  const LEVELS = [
    /* ================= 第 1 关 ================= */
    {
      id: 1,
      name: '让电脑开口说话',
      short: 'print 输出',
      subtitle: '写下想说的话，电脑就帮你显示在屏幕上',
      intro: `
        <p>想象你有一个特别听话的小助手。你写一张小纸条递给它，它就照着纸条上的内容，一字不差地念出来。</p>
        <p>这一关学完，你就能让电脑打印一张三行的小票——比如奶茶店的订单。要点是：一行代码对应屏幕上的一行。</p>
        <div class="callout goal">这一关结束，你能做到：让电脑按你写的顺序，逐行显示好几句话。</div>`,
      knowledge: `
        <p>有一个"传话口令"叫 <code class="inline">print</code>。把它想成一个<strong>小喇叭</strong>：把想说的话塞进它后面的小括号里，它就对着屏幕喊出来。</p>
        <div class="analogy"><div class="a-icon">喇叭</div><div class="a-text">print 像小喇叭。你递给它一句话，它就念一行。想念三行，就递三张纸条——也就是写三行 print。</div></div>
        <p>两条小规矩：要说的话放进小括号 ( )；如果是文字，要用引号 " " 包起来，像给话穿件外套。</p>
        <div class="callout tip">小技巧：一行 print 里用逗号隔开几样东西，电脑会用空格把它们连起来念，比如 print("A", "B") 会显示 A B。</div>`,
      example: {
        code: `print("奶茶小票")      # 第一行
print("珍珠奶茶 15元")  # 第二行
print("谢谢光临")       # 第三行
print("小计", 15, "元")  # 逗号把几样东西连起来`,
        notes: [
          '每一行开头的 # 是写给我们自己看的便签，电脑会跳过。',
          '三行 print 就会在屏幕上显示三行，顺序和你写的一样。',
          '最后一行里，文字和数字用逗号隔开，电脑自动用空格连起来。',
          '数字 15 没有穿引号外套，因为它本来就是数字。'
        ]
      },
      task: `
        <p>打印一张<strong>图书借阅条</strong>，三行依次是：<code class="inline">图书借阅条</code>、<code class="inline">Python入门 39元</code>、<code class="inline">请妥善保管</code>。</p>
        <p>再加一行，用逗号把 <code class="inline">押金</code> 和 <code class="inline">5</code> 连起来输出。想想这跟示例里的小票有什么不一样——文字要换成你自己的。</p>`,
      starter: `# 一行一行写出来\n`,
      hints: [
        '想让屏幕上出现几行，就写几行 print，每行放一句你想说的话。',
        '文字要穿引号外套；最后一行里有个数字 5，它本来就是数字，不用穿。',
        '想把文字和数字排在同一行，用逗号把它们隔开试试。'
      ],
      quiz: {
        question: 'print("A", "B") 会在屏幕上显示成什么样？',
        options: ['AB 紧贴在一起', 'A B 中间有空格', '报错，不能写两个', '只显示 A'],
        answer: 1,
        explain: '对！逗号会让电脑用空格把几样东西连起来。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/print\s*\(/.test(code)) return { passed: false, message: '这一关要用小喇叭 print 让电脑说话哦。' };
        if (!outHas(r, '图书借阅条') || !outHas(r, 'Python入门 39元') || !outHas(r, '请妥善保管')) return { passed: false, message: '借阅条的三行还没齐全，检查一下每行的文字是不是写对了。' };
        if (!outHas(r, '押金 5')) return { passed: false, message: '最后一行要用逗号把"押金"和 5 连起来，中间会有空格。' };
        return ok('很好！示例里的小票是奶茶，你换成了借阅条——这就是真正学会了。');
      }
    },

    /* ================= 第 2 关 ================= */
    {
      id: 2,
      name: '给东西贴标签存起来',
      short: '变量 = 盒子',
      subtitle: '用一个名字把信息装进盒子，以后随时取用',
      intro: `
        <p>家里杂物多时，我们会找几个盒子贴上标签。Python 里也一样：一个名字、一个等号，就把东西装进了一个盒子。</p>
        <p>盒子有个重要特点：<strong>后面的东西可以盖掉前面的</strong>。这一关要挑战"交换两个盒子的内容"——像把两杯饮料对调，你需要一个空杯子帮忙。</p>
        <div class="callout goal">这一关结束，你能做到：用第三个盒子帮忙，交换两个盒子里的东西。</div>`,
      knowledge: `
        <p>写法：<strong>名字 = 要装的东西</strong>。这种"贴了标签的盒子"行话叫 <code class="inline">变量</code>。</p>
        <div class="analogy"><div class="a-icon">盒子</div><div class="a-text">a = 10 是把 10 放进 a 盒子。再写 a = 20，就是把 20 放进去、原来的 10 被倒掉了。盒子还是那个盒子，里面的东西换了。</div></div>
        <p>交换两杯饮料时，你会先拿一个空杯：空杯 ← 甲杯，甲杯 ← 乙杯，乙杯 ← 空杯。变量交换也是这个道理。</p>
        <div class="callout tip">等号在这里不是"算等于"，而是"把右边装进左边"。所以 a = b 的意思是"把 b 里的东西倒进 a"。</div>`,
      example: {
        code: `a = 10         # a 盒子装 10
b = 20         # b 盒子装 20
t = a          # 空盒子 t 先装下 a 的 10
a = b          # a 改装 b 的 20
b = t          # b 改装 t 里存着的 10
print(a, b)    # 显示：20 10`,
        notes: [
          't 是临时盒子，专门用来"暂存"，免得 10 被盖掉就找不回来了。',
          'a = b 之后，a 和 b 暂时都是 20，但 t 里还留着原来的 10。',
          'b = t 把暂存的 10 还给 b，交换完成。',
          'print(a, b) 用逗号一次显示两个盒子，中间有空格。'
        ]
      },
      task: `
        <p>桌上有两杯饮料：<code class="inline">cup1</code> 装可乐，<code class="inline">cup2</code> 装雪碧。请<strong>对调</strong>两杯的内容，最后输出 cup1 和 cup2。</p>
        <p>期望看到：<code class="inline">雪碧 可乐</code>。示例里交换数字用的招数，这里换个东西照样管用。</p>`,
      starter: `# 对调两杯饮料\ncup1 = "可乐"\ncup2 = "雪碧"\n`,
      hints: [
        '直接把一杯倒进另一杯，原来那杯的东西就丢了。先想想怎么把原来的先存起来。',
        '示例里那个临时盒子 t 是干什么用的？这里也需要一个空杯子。',
        '交换完别忘了显示两个杯子，中间用逗号隔开。'
      ],
      quiz: {
        question: '执行 x = 5 再执行 x = 8 后，x 盒子里装的是？',
        options: ['5', '8', '5 和 8 都在', '空的'],
        answer: 1,
        explain: '没错！后来的会盖掉先前的，盒子里只剩 8。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (varVal(r, 'cup1') !== '雪碧' || varVal(r, 'cup2') !== '可乐') return { passed: false, message: '还没对调成功，cup1 应该是雪碧、cup2 应该是可乐。想想那个空杯子。' };
        if (!outHas(r, '雪碧 可乐')) return { passed: false, message: '对调对了，但还没显示出来，最后用 print 把两个杯子显示出来。' };
        return ok('漂亮！示例里换的是数字，你换的是饮料——招数是一样的。');
      }
    },

    /* ================= 第 3 关 ================= */
    {
      id: 3,
      name: '让电脑帮你算账',
      short: '数字与整除取余',
      subtitle: '分东西时，用 // 算能分几份、用 % 算剩下几个',
      intro: `
        <p>奶茶店算账用乘加，分东西时还要问两个问题："能装满几袋？""还剩几个？"</p>
        <p>比如 17 个苹果，每 5 个装一袋：能装满 3 袋，剩 2 个。电脑里有两个专门的符号帮你一次算出来。这一关学完，分东西、算找零都不在话下。</p>
        <div class="callout goal">这一关结束，你能做到：用 // 和 % 算出"分了几份、剩了多少"。</div>`,
      knowledge: `
        <p>四则运算符号：<code class="inline">+</code> 加、<code class="inline">-</code> 减、<code class="inline">*</code> 乘、<code class="inline">/</code> 除（结果是小数）。</p>
        <p>再认识两个：</p>
        <div class="analogy"><div class="a-icon">分苹果</div><div class="a-text">17 个苹果每 5 个装一袋。<strong>//</strong> 回答"能装满几袋"——答案是 3；<strong>%</strong> 回答"手上还剩几个"——答案是 2。它们读作"整除"和"取余"，但你只要记住"装满几份"和"剩下几个"。</div></div>
        <div class="callout tip">电脑先算乘除、后算加减。想改变顺序就加小括号，比如 (50 - 12) * 3。</div>`,
      example: {
        code: `apples = 17        # 一共有 17 个苹果
per = 5            # 每袋装 5 个
bags = apples // per  # 能装满几袋 → 3
left = apples % per   # 还剩几个 → 2
print(bags, left)     # 显示：3 2`,
        notes: [
          'apples // per 只取"装满的整袋数"，零头不算。',
          'apples % per 只要"装不满剩下的那几个"。',
          '17 = 5 × 3 + 2，所以袋子是 3，剩的是 2。',
          '这两个符号配合起来，特别适合分东西、算零钱。'
        ]
      },
      task: `
        <p>有 <code class="inline">23</code> 支铅笔，每 <code class="inline">4</code> 支装一盒。算出能装满几盒、还剩几支，用 print 一次输出两个数。</p>
        <p>期望看到：<code class="inline">5 3</code>。要求用变量、<code class="inline">//</code> 和 <code class="inline">%</code> 来算，不能直接写死答案。</p>`,
      starter: `# 分铅笔\n`,
      hints: [
        '先造两个盒子：一个装总数，一个装每盒的个数。',
        '示例里"装满几份"用的是哪个符号？"剩下几个"用的是哪个符号？',
        '最后用 print 一次显示两个数，中间用逗号隔开。'
      ],
      quiz: {
        question: '23 % 4 的结果是多少？',
        options: ['5', '3', '4', '2'],
        answer: 1,
        explain: '对！23 = 4 × 5 + 3，剩下的是 3。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\/\//.test(code) || !/%/.test(code)) return { passed: false, message: '这一关要同时用 // 和 % 来分东西，不能直接写答案哦。' };
        if (!outHas(r, '5 3')) return { passed: false, message: '结果应该是"装满 5 盒、剩 3 支"，检查一下两个符号是不是用反了。' };
        return ok('算对了！示例分的是苹果，你分的是铅笔——方法完全一样。');
      }
    },

    /* ================= 第 4 关 ================= */
    {
      id: 4,
      name: '让电脑听你说话',
      short: 'input 与数字变身',
      subtitle: '程序向你提问，把回答变成数字再计算',
      intro: `
        <p>前面都是我们叫电脑做事。现在反过来：让电脑问一句话，我们打字回答。</p>
        <p>但有个小坑：电脑把你打的字都当成<strong>文字</strong>。想拿它做加法，得先请一个"变身助手" int 把它变成真数字。这一关学完，你能做一个会问两个数、还算得出和的小程序。</p>
        <div class="callout goal">这一关结束，你能做到：提问 → 拿回答 → 变成数字 → 算出结果。</div>`,
      knowledge: `
        <p>提问口令叫 <code class="inline">input</code>。写成 input("你的问题")，电脑就显示问题、等你打字。</p>
        <div class="analogy"><div class="a-icon">提问</div><div class="a-text">input 像小记者，举着问题等你回答，然后把你说的话带回来。但它带回来的总是"文字"，哪怕你打的是 12，它也是"1"和"2"两个字符。</div></div>
        <p>变身助手 <code class="inline">int(...)</code>：把"12"这样的数字样子文字，变成真正的数字 12。就像把写着 12 的纸条，换成 12 枚硬币，这样才能相加。</p>
        <div class="callout note">电脑把你打的字当成一段文字，行话叫 <strong>字符串</strong>——就是"串起来的一串字"。记住"用引号包起来的文字"这个感觉就好。</div>`,
      example: {
        code: `a = input("第一个数：")   # 拿到的是文字
b = input("第二个数：")   # 拿到的也是文字
a = int(a)               # 把文字变成数字
b = int(b)               # 把文字变成数字
print(a + b)             # 现在是真正的加法`,
        notes: [
          'input 括号里写要问的话，引号别漏。',
          '如果直接 print(a + b)，两段文字会被"粘"起来，比如 "12" + "8" 变成 "128"。',
          'int(a) 把"12"变成数字 12，这样加号才是数学里的加法。',
          '也可以合着写：a = int(input("第一个数："))。'
        ]
      },
      task: `
        <p>让电脑依次问两个整数，输出它们的<strong>乘积</strong>（真正的数字相乘）。</p>
        <p>测试时输入 <code class="inline">6</code> 和 <code class="inline">7</code>，期望看到 <code class="inline">42</code>。示例里做的是加法，这次换个运算。</p>`,
      starter: `# 问两个数，求乘积\n`,
      stdin: { value: '6\n7', tip: '两次回答，一行一个：', multiline: true },
      hints: [
        '提问用 input("……")，问句写在引号里。',
        'input 拿回来的是文字，要先变成数字才能做数学运算。',
        '示例里做的是加法，这次要算乘积——想想该用哪个运算符号。'
      ],
      quiz: {
        question: 'input() 拿到的内容，直接拿来加会发生什么？',
        options: ['正常做数学加法', '被当成文字粘在一起', '自动变成数字', '会报错'],
        answer: 1,
        explain: '对！所以要用 int() 先变身，加法才是真的加法。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/input\s*\(/.test(code)) return { passed: false, message: '这一关要让电脑提问，记得用 input("……")。' };
        if (!/int\s*\(/.test(code)) return { passed: false, message: '回答是文字，要请 int(...) 帮它变成数字才能运算。' };
        if (!/\*/.test(code)) return { passed: false, message: '这次要算乘积，想想乘法用哪个符号。' };
        if (!outHas(r, '42')) return { passed: false, message: '乘积应该是 42，检查一下是不是忘了变身、或者用错了运算符号。' };
        return ok('成功！示例求的是和，你求的是积——提问和变身的招数你已经会用了。');
      }
    },

    /* ================= 第 5 关 ================= */
    {
      id: 5,
      name: '让电脑看情况做事',
      short: 'if 与范围判断',
      subtitle: '满足条件就打折，电脑自己会算',
      intro: `
        <p>奶茶店常有活动："满 50 减 10"。收银员会看金额：够 50 就减，不够就原价。</p>
        <p>这一关学完，你的程序也能"看情况做事"：它自己判断金额够不够，然后决定要不要打折。</p>
        <div class="callout goal">这一关结束，你能做到：用 if 加范围判断，让电脑自动打折。</div>`,
      knowledge: `
        <p>写法：<code class="inline">if 条件:</code>，下一行<strong>空两格</strong>写要做的事。末尾的冒号别忘。</p>
        <div class="analogy"><div class="a-icon">门卫</div><div class="a-text">if 像门口的检查员：条件对了才放行。空两格写的事，就是"归这位检查员管"的事。</div></div>
        <p>比大小用 <code class="inline">&gt;</code>、<code class="inline">&lt;</code>，也可以写 <code class="inline">&gt;=</code>（大于或等于）、<code class="inline">&lt;=</code>（小于或等于）。"满 50"就是 money &gt;= 50。</p>
        <div class="callout tip">if 下面空两格的事，条件成立才做；不成立就整个跳过，继续往下走。</div>`,
      example: {
        code: `money = int(input("消费金额："))  # 变身成数字
if money >= 50:                # 满 50 吗？
    money = money - 10         # 满了就减 10（空两格）
print(money)                   # 说出实付金额`,
        notes: [
          'money >= 50 读作"money 大于或等于 50"。',
          '只有条件成立，空两格那行 money = money - 10 才会执行。',
          'print(money) 没有空格，所以它总会执行——不管有没有打折。',
          '输入 60 会显示 50；输入 30 会显示 30。'
        ]
      },
      task: `
        <p>写一个<strong>运费程序</strong>：输入商品金额，如果<strong>不满 50 元</strong>，就加 5 元运费；满 50 元免运费。最后输出实付金额。</p>
        <p>测试输入 <code class="inline">30</code>，期望输出 <code class="inline">35</code>。示例判断的是"满没满"，这次要反过来判断"够不够"。</p>`,
      starter: `# 不满 50 加运费\n`,
      stdin: { value: '30', tip: '商品金额：' },
      hints: [
        '先用 int(input(...)) 拿到数字，问句自己写。',
        '示例判断的是"满没满"，这次要判断"不足"，想想该用哪个比较符号。',
        '条件成立时要加上运费，别写成减法。'
      ],
      quiz: {
        question: '符号 >= 是什么意思？',
        options: ['小于', '大于', '大于或等于', '不等于'],
        answer: 2,
        explain: '对！>= 就是"大于或等于"。这次任务用的是它的反义词 <。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/if\b/.test(code) || !/</.test(code)) return { passed: false, message: '要用 if 加 < 来判断"够不够 50"。' };
        if (!/\+/.test(code)) return { passed: false, message: '不足 50 要"加"运费，想想用哪个运算符号。' };
        if (!outHas(r, '35')) return { passed: false, message: '输入 30 应该显示 35（加了 5 元运费），检查一下判断和加法。' };
        return ok('对了！示例是"满了减钱"，你做的是"不足加钱"——判断的方向你把握住了。');
      }
    },

    /* ================= 第 6 关 ================= */
    {
      id: 6,
      name: '判断是不是一样',
      short: '== 与奇偶判断',
      subtitle: '用两个等号和取余，判断奇数和偶数',
      intro: `
        <p>"这个数是单数还是双数？"——商店分双、游戏分组都常要问这个。</p>
        <p>判断"是不是一样"用两个等号 ==；再看它除以 2 剩不剩 1，就能分出奇偶。这一关把这两样本领合起来用。</p>
        <div class="callout goal">这一关结束，你能做到：输入一个整数，让电脑告诉你它是奇数还是偶数。</div>`,
      knowledge: `
        <p>两个等号 <code class="inline">==</code> 用来问"两边一样吗"。注意：一个等号是装盒子，两个等号才是比较。</p>
        <div class="analogy"><div class="a-icon">开关</div><div class="a-text">比较的结果只有两种：一样（对）或不一样（错）。像灯开关只有开和关。电脑管"对"叫 True，"错"叫 False，这种只有对/错的值叫 <strong>布尔值</strong>。</div></div>
        <p>再看余数：一个偶数除以 2 正好分完，余数是 0；奇数除以 2 会剩 1。所以 <code class="inline">n % 2 == 0</code> 就是"n 是偶数吗"。</p>
        <div class="callout tip">再认识 else：意思是"否则"。if 条件不成立时，就做 else 下面空两格的事。if 和 else 要上下对齐。</div>`,
      example: {
        code: `n = int(input("一个整数："))
if n % 2 == 0:        # 除以 2 余数是 0 吗？
    print("偶数")     # 是偶数
else:                 # 否则
    print("奇数")     # 是奇数`,
        notes: [
          'n % 2 是 n 除以 2 的余数，只会是 0 或 1。',
          'n % 2 == 0 的意思：余数等于 0 吗？',
          'if 下面空两格的事在条件成立时做；else 下面空两格的事在不成立时做。',
          '输入 7 会显示"奇数"，输入 8 会显示"偶数"。'
        ]
      },
      task: `
        <p>输入一个整数，判断它<strong>能不能被 3 整除</strong>（除以 3 的余数是不是 0），输出 <code class="inline">能整除</code> 或 <code class="inline">不能整除</code>。</p>
        <p>测试输入 <code class="inline">9</code>，期望输出 <code class="inline">能整除</code>。示例判断的是除以 2，这次换成除以 3。</p>`,
      starter: `# 判断能不能被 3 整除\n`,
      stdin: { value: '9', tip: '一个整数：' },
      hints: [
        '先用 int(input(...)) 拿到数字。',
        '示例里判断奇偶看的是"除以 2 的余数"，这次该看除以几的余数？',
        '能整除、不能整除两种情况都要说到，用 if 和 else 分别输出。'
      ],
      quiz: {
        question: '9 % 3 的结果是多少？',
        options: ['0', '1', '3', '9'],
        answer: 0,
        explain: '对！9 除以 3 正好分完，余数是 0，所以能整除。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/==/.test(code) || !/%/.test(code)) return { passed: false, message: '要用 % 取余，再用 == 判断余数是不是 0。' };
        if (!/\belse\b/.test(code)) return { passed: false, message: '能整除、不能整除两种情况都要说到，加上 else: 吧。' };
        if (!outHas(r, '能整除')) return { passed: false, message: '输入 9 应该显示"能整除"，检查一下判断条件里的除数。' };
        return ok('完全正确！示例分的是奇偶，你判断的是整除——取余加判断的招数你掌握了。');
      }
    },

    /* ================= 第 7 关 ================= */
    {
      id: 7,
      name: '让电脑重复做事',
      short: 'for 与累加',
      subtitle: '用循环把一列数字加起来',
      intro: `
        <p>要算 1 加 2 加 3……一直加到 10，手算要写九次加法。电脑最擅长这种重复活。</p>
        <p>写法是"准备一个空总数 → 让电脑把每个数挨个加进去"。这一关学完，你能用几行代码算出一长串数的总和。</p>
        <div class="callout goal">这一关结束，你能做到：用 for 循环累加，算出 1 到 10 的和。</div>`,
      knowledge: `
        <p><code class="inline">for i in range(3):</code> 下面空两格的事会做 3 遍。i 每次不一样：电脑从 0 开始数，依次是 0、1、2。</p>
        <div class="analogy"><div class="a-icon">点名</div><div class="a-text">range(3) 像 3 个号码的点名册。i 每次代表当前号码。想从 1 数到 10，就写 range(1, 11)——含头不含尾，到 11 之前停。</div></div>
        <p>累加的套路：先准备 total = 0（空盒子），循环里写 total = total + i（把当前数加进去）。</p>
        <div class="callout tip">range(1, 11) 给的是 1 到 10 共 10 个数；range(10) 给的是 0 到 9。别数错啦。</div>`,
      example: {
        code: `total = 0                 # 准备一个空的总数盒子
for i in range(1, 11):    # i 依次是 1,2,...,10
    total = total + i     # 把当前的 i 加进去（空两格）
print(total)              # 显示：55`,
        notes: [
          'total = 0 是起点，就像记账本一开始是空的。',
          '循环每转一圈，i 就换一个数，total 就长大一点。',
          'range(1, 11) 到 11 为止但不包含 11，所以正好 1 到 10。',
          '最后 print(total) 写在循环外面（不空格），只显示一次最终结果。'
        ]
      },
      task: `
        <p>用 for 循环算出 <strong>2 到 8</strong> 的和（2+3+…+8），输出结果。期望看到 <code class="inline">35</code>。</p>
        <p>要求用一个总数变量累加，不能用现成的求和函数。示例算的是 1 到 10，这次范围变了。</p>`,
      starter: `# 累加 2 到 8\n`,
      hints: [
        '先准备一个空盒子装总数。',
        '示例里 range(1, 11) 是 1 到 10，那 2 到 8 该怎么写？记住"含头不含尾"。',
        '循环里把当前的数加进总数盒子，循环外再输出结果。'
      ],
      quiz: {
        question: 'range(2, 9) 一共会产生几个数？',
        options: ['7 个', '8 个', '9 个', '2 个'],
        answer: 0,
        explain: '对！它给 2 到 8，正好 7 个数——含头不含尾。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bfor\b/.test(code)) return { passed: false, message: '这一关要用 for 循环来累加。' };
        if (!outHas(r, '35')) return { passed: false, message: '2 到 8 的和应该是 35，检查一下 range 的写法和累加那一行。' };
        return ok('很好！示例累加的是 1 到 10，你换成了 2 到 8——循环的套路你已经会用了。');
      }
    },

    /* ================= 第 8 关 ================= */
    {
      id: 8,
      name: '用清单装一堆东西',
      short: '遍历清单找最大',
      subtitle: '一个一个看过去，自己找出最大值',
      intro: `
        <p>一张成绩单上有好几个分数，想找出最高的那个，你会一个一个比：看到更高的就记下来。</p>
        <p>电脑也能这样。这一关不用现成的 max 函数，而是靠循环和判断，自己把最大值找出来——这才是真正理解"遍历"。</p>
        <div class="callout goal">这一关结束，你能做到：遍历一张清单，找出里面最大的数。</div>`,
      knowledge: `
        <p>清单用方括号 <code class="inline">[ ]</code> 装一串东西，行话叫 <code class="inline">列表</code>。第 1 项是 [0]，电脑从 0 开始数。</p>
        <div class="analogy"><div class="a-icon">清单</div><div class="a-text">scores = [88, 92, 75, 96] 像一张写着四个分数的纸条。for s in scores 会把每个分数挨个交给 s，像老师逐个念名字。</div></div>
        <p>找最大的套路：先假设第 1 个就是最大的（best = scores[0]），然后挨个看，谁比 best 大就换人。</p>
        <div class="callout tip">这叫"打擂台"：先让第一个当擂主，后面谁赢了就换谁上，最后剩下的就是冠军。</div>`,
      example: {
        code: `scores = [88, 92, 75, 96]  # 一张成绩清单
best = scores[0]           # 先假设第 1 个最大
for s in scores:           # 挨个看每个分数
    if s > best:           # 如果有更大的
        best = s           # 就换人（空四格）
print(best)                # 显示：96`,
        notes: [
          'scores[0] 是清单的第 1 项，也就是 88。',
          'for s in scores 会把 88、92、75、96 依次交给 s。',
          'if s > best 成立时，best = s 要空四格——因为它同时在 for 和 if 里面。',
          '循环结束后，best 里就是最大值 96。'
        ]
      },
      task: `
        <p>四件商品的价格清单是 <code class="inline">prices = [15, 42, 8, 30]</code>。不用 max 函数，自己找出<strong>最贵的价格</strong>并输出。</p>
        <p>期望输出 <code class="inline">42</code>。示例找的是成绩最高的，这次找价格最贵的。</p>`,
      starter: `prices = [15, 42, 8, 30]\n`,
      hints: [
        '示例里先假设第一个是最大的，这里也要先选一个"擂主"。',
        '用循环挨个看每个数，谁比擂主大就换人。',
        '注意嵌在里面的那行要比外层多空两格。'
      ],
      quiz: {
        question: '在 prices = [15, 42, 8, 30] 里，prices[0] 是哪个数？',
        options: ['15', '42', '30', '8'],
        answer: 0,
        explain: '对！电脑从 0 开始数，第 0 个就是第一个 15。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (/\bmax\s*\(/.test(code)) return { passed: false, message: '这一关要自己找最大值，先别用现成的 max 哦。' };
        if (!/\bfor\b/.test(code) || !/\bif\b/.test(code)) return { passed: false, message: '要用 for 挨个看，再用 if 比较大小。' };
        if (!outHas(r, '42')) return { passed: false, message: '最贵的价格应该是 42，检查一下擂台的初始值和比较方向。' };
        return ok('漂亮！示例找的是最高分，你找的是最高价——"打擂台"的招数换什么清单都能用。');
      }
    },

    /* ================= 第 9 关 ================= */
    {
      id: 9,
      name: '把代码打包成小机器',
      short: '带参数的函数',
      subtitle: '给机器留两个口，喂不同的数进去',
      intro: `
        <p>一台"算面积"的机器，如果只能算固定的长和宽，就没啥用了。好的机器会留两个入口：你喂进去长和宽，它吐出面积。</p>
        <p>这两个入口叫"参数"。这一关学完，你能造一台机器，算 3×4、算 5×6，都不用改机器本身。</p>
        <div class="callout goal">这一关结束，你能做到：定义带参数、有返回值的函数，并用它算不同的题目。</div>`,
      knowledge: `
        <p>写 <code class="inline">def 名字(参数):</code>，下面空两格写机器做的事。想让它交出结果，就写 <code class="inline">return 结果</code>。</p>
        <div class="analogy"><div class="a-icon">按钮</div><div class="a-text">def 像造一台小机器。括号里的 w、h 是机器上的两个投料口。你调用 area(3, 4)，就是把 3 和 4 投进去，机器按里面的步骤算出结果，再用 return 递出来。</div></div>
        <p>参数的名字随你取，它只是"投料口的标签"。调用时按位置依次投进去。</p>
        <div class="callout tip">return 会把结果交出来，所以能直接写 print(area(3, 4))——先让机器算，再把递出来的结果打印。</div>`,
      example: {
        code: `def area(w, h):       # 造机器，两个投料口 w 和 h
    result = w * h    # 机器里的步骤（空两格）
    return result     # 把结果递出来

print(area(3, 4))     # 投 3 和 4 → 12
print(area(5, 6))     # 投 5 和 6 → 30`,
        notes: [
          'def area(w, h): 定义机器，末尾有冒号。',
          'w * h 用的是投进来的数，不是固定数字。',
          'return result 把算好的结果交出来。',
          '同一台机器，喂不同的数，得到不同的结果——这就是函数的威力。'
        ]
      },
      task: `
        <p>造一个叫 <code class="inline">perimeter</code> 的函数，接收长 w 和宽 h，返回长方形的<strong>周长</strong>（长加宽的和再乘 2）。</p>
        <p>然后调用两次，输出 w=3、h=4 和 w=5、h=6 的周长（<code class="inline">14</code> 和 <code class="inline">22</code>）。示例的机器算面积，这次要算周长。</p>`,
      starter: `# 造算周长的函数\n`,
      hints: [
        '定义机器写 def 名字(参数):，括号里就是投料口。',
        '示例里机器做的是长乘宽，这次要算周长——想想周长公式怎么写。',
        '造好机器后调用两次，每次喂不同的数进去。'
      ],
      quiz: {
        question: 'def perimeter(w, h): 里面的 w 和 h 叫什么？',
        options: ['参数', '答案', '清单', '变量盒子'],
        answer: 0,
        explain: '对！它们是函数的参数，像机器上的投料口。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bdef\s+perimeter\s*\(/.test(code)) return { passed: false, message: '要定义一个叫 perimeter 的函数。' };
        if (!/\breturn\b/.test(code)) return { passed: false, message: '函数要用 return 把结果交出来。' };
        if (!outHas(r, '14') || !outHas(r, '22')) return { passed: false, message: '两次调用应该分别输出 14 和 22，检查一下周长公式和调用时投进去的数。' };
        return ok('成功！示例造的是面积机器，你造的是周长机器——同一套造机器的方法。');
      }
    },

    /* ================= 第 10 关 ================= */
    {
      id: 10,
      name: '把东西存到本子上',
      short: '文件读写多行',
      subtitle: '一次写进好几行，再整本读回来',
      intro: `
        <p>日记本可以写好几行，关上明天再翻开还在。电脑里的文件也一样。</p>
        <p>这一关要写三行日记，还要能整本读回来。诀窍是文字里的换行符 <code class="inline">\n</code>——它就像按下回车键。</p>
        <div class="callout goal">这一关结束，你能做到：把好几行内容写进文件，再打开读出来。</div>`,
      knowledge: `
        <p>写文件的三步：open("名字.txt", "w") 拿本子 → f.write("内容") 写字 → f.close() 合上。</p>
        <div class="analogy"><div class="a-icon">本子</div><div class="a-text">open 像从抽屉拿出本子，"w" 表示要写。write 像往本子上写字。close 像把本子合上放回抽屉——不合上，内容可能没真正放好。</div></div>
        <p>想换行，在文字里写 <code class="inline">\n</code>：它代表"按一下回车"。比如 "第一行\n第二行" 就是两行。</p>
        <p>读回来：open("名字.txt", "r") 打开（r 是读），再用 f.read() 把整本内容取出来。</p>
        <div class="callout note">网页里的本子是"虚拟"的，不会真的写进硬盘，但写法和效果一样，放心练。</div>`,
      example: {
        code: `f = open("日记.txt", "w")       # 拿本子准备写
f.write("周一 开心\\n周二 一般\\n周三 很棒")  # 写三行
f.close()                        # 合上本子

g = open("日记.txt", "r")       # 重新打开来读
print(g.read())                 # 整本读出来显示`,
        notes: [
          '\\n 表示换行，写在一个字符串里就能分成多行。',
          '写完一定 close()，内容才算真正保存好。',
          '读的时候用 "r"，再用 g.read() 一次取出全部内容。',
          '屏幕上会分三行显示周一、周二、周三的记录。'
        ]
      },
      task: `
        <p>写入文件 <code class="inline">购物清单.txt</code>，内容依次是三行：<code class="inline">苹果</code>、<code class="inline">牛奶</code>、<code class="inline">面包</code>。</p>
        <p>然后打开文件，把整张清单读出来显示。示例写的是日记，这次换成购物清单。</p>`,
      starter: `# 写购物清单，再读出来\n`,
      hints: [
        '用 open("文件名", "w") 拿本子准备写，文件名要用引号包起来。',
        '三行内容之间要用换行符隔开，示例里用的是哪个符号？',
        '写完要合上本子，再用 "r" 打开读回来显示。'
      ],
      quiz: {
        question: '文字里的 \\n 表示什么？',
        options: ['一个空格', '换到下一行', '删除这行', '没有作用'],
        answer: 1,
        explain: '对！\\n 就是"按回车"，让后面的内容从新的一行开始。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        const c = fileContent(r, '购物清单.txt') || '';
        if (!c) return { passed: false, message: '还没看到"购物清单.txt"被写出来，先用 open("购物清单.txt", "w") 打开本子。' };
        if (c.indexOf('苹果') === -1 || c.indexOf('牛奶') === -1 || c.indexOf('面包') === -1) return { passed: false, message: '三样东西没写全，检查一下 write 里的内容和换行符。' };
        if (!outHas(r, '苹果')) return { passed: false, message: '文件写好了，但还没读出来显示，用 open(..., "r") 加 read() 再 print。' };
        return ok('很好！示例写的是日记，你写的是购物清单——写文件、读文件你都会了。');
      }
    },

    /* ================= 第 11 关 ================= */
    {
      id: 11,
      name: '阶段项目：记账本',
      short: '记账本（进阶）',
      subtitle: '把提问、清单、循环、判断、文件串成一个小工具',
      intro: `
        <p>前面十关的招式，现在合起来用。做一个能真正记账的小程序：问你三笔花了多少钱，算出总花费，花太多会提醒你，最后把结果存进文件。</p>
        <p>这是你的第一个<strong>阶段作品</strong>。我不会给整段答案，但会一步步给线索。卡住就点"给点提示"。</p>
        <div class="callout goal">这一关结束，你能独立跑通一个把多种招式合起来的小程序。</div>`,
      knowledge: `
        <p>这个记账本要做四件事：</p>
        <ol class="steps">
          <li><span class="sn">1</span>准备一张空清单 records，用来装账目；</li>
          <li><span class="sn">2</span>用 for 循环问 3 次金额，int 变成数字后 append 进清单；</li>
          <li><span class="sn">3</span>再用一个 for 循环把清单里的钱加起来，得到 total；</li>
          <li><span class="sn">4</span>如果 total &gt; 100，提醒"花超啦"，并把结果写进文件。</li>
        </ol>
        <div class="callout note">新朋友 <code class="inline">str(...)</code>：它和 int 相反，把数字变成文字。想让数字和文字粘起来写进文件，就要先请 str 把它变成文字。比如 "总花费" + str(105)。</div>`,
      example: {
        code: `# 几个小零件，看看它们各干什么（不是完整答案）
records = []                    # 空清单
records.append(20)              # 往清单里记一笔
print("小计" + str(88))         # 数字变文字才能粘起来

f = open("示例本.txt", "w")     # 拿本子
f.write("小计" + str(88))       # 写一行试试
f.close()                       # 合上本子`,
        notes: [
          '上面只是零件演示：没有问 3 次，也没有算总额，更不是你要交的作品。',
          'append 能把一笔账记进清单，str 能把数字变成文字。',
          '示例里的数字和文件名都是随意举的，跟任务答案没关系。',
          '"问 3 次"和"算总额"这两段循环，要你自己用前面学过的招数写出来。'
        ]
      },
      task: `
        <p>完成记账本。测试时依次输入 <code class="inline">40</code>、<code class="inline">35</code>、<code class="inline">30</code>（总和 105）。</p>
        <ul class="mini-list">
          <li>用 for 循环问 3 次金额，int 变成数字，append 进 records；</li>
          <li>再用 for 循环算出总额 total 并输出（应该是 105）；</li>
          <li>如果 total &gt; 100，输出 <code class="inline">花超啦</code>；</li>
          <li>把 <code class="inline">总花费105</code> 写进文件 <code class="inline">账本.txt</code>。</li>
        </ul>`,
      starter: `# 你的记账本，从这里开始\n`,
      stdin: { value: '40\n35\n30', tip: '三次金额，一行一个：', multiline: true },
      hints: [
        '先造一张空清单，准备装 3 笔账。',
        '问 3 次金额这件事，用 for 循环包住"提问、变身、记进清单"这三步。',
        '求总额要再用一个循环，套路和第 7 关一样。',
        '花超没超，要用 if 判断；提醒的话写在 if 下面空两格。',
        '写文件时数字要先变成文字，示例里请了谁帮忙？'
      ],
      quiz: {
        question: '想把数字 105 和文字"总花费"粘在一起，要请谁帮忙？',
        options: ['int()', 'str()', 'for', 'if'],
        answer: 1,
        explain: '对！str() 把数字变成文字，才能和文字粘起来。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/for\b/.test(code) || !/\.append\s*\(/.test(code)) return { passed: false, message: '要用 for 循环问 3 次，并用 append 把每笔钱记进清单。' };
        if (!outHas(r, '105')) return { passed: false, message: '总花费应该是 105，检查一下累加的循环。' };
        if (!outHas(r, '花超啦')) return { passed: false, message: '105 超过了 100，应该输出"花超啦"，检查一下 if。' };
        const c = fileContent(r, '账本.txt') || '';
        if (c.indexOf('总花费105') === -1) return { passed: false, message: '文件里应该写着"总花费105"，检查一下 write 那一行。' };
        return ok('恭喜阶段作品完成！提问、清单、循环、判断、文件，你全串起来了。');
      }
    },

    /* ================= 第 12 关（新增）================= */
    {
      id: 12,
      name: '一直问到对为止',
      short: 'while 循环',
      subtitle: '不知道要做几次时，用"只要…就一直做"',
      intro: `
        <p>前面的 for 循环适合"数着次数做"。但有些事不知道要做几次——比如输密码，输错就再来一次，直到输对为止。</p>
        <p>这时候用 while：它盯着一个条件，只要条件成立就一直做。这一关学完，你能做一个会反复要密码的小程序。</p>
        <div class="callout goal">这一关结束，你能做到：用 while 加 break，做"直到…才停"的重复。</div>`,
      knowledge: `
        <p>写法：<code class="inline">while 条件:</code>，下面空两格写要做的事。只要条件一直成立，就一直做。</p>
        <div class="analogy"><div class="a-icon">门卫</div><div class="a-text">while 像一个守门的："只要还没对上暗号，就不放你走。"每转一圈，它都重新看一眼条件。</div></div>
        <p>想立刻停下来，用 <code class="inline">break</code>：意思是"跳出这个循环，不做了"。</p>
        <div class="callout tip">写 while True: 就是"无条件一直重复"，然后靠里面的 break 在特定情况下跳出来——这是"直到…才停"的常用套路。</div>
        <div class="callout note">当心：如果 while 的条件永远不会变，电脑会一直转圈停不下来。记得在适当时候 break 或改变条件。</div>`,
      example: {
        code: `while True:                 # 一直重复
    pwd = input("密码：")    # 每次都问一次
    if pwd == "1234":        # 如果输对了
        print("欢迎")        # 说欢迎
        break                # 跳出循环，不做了`,
        notes: [
          'while True: 表示"无条件一直做"，True 就是"对、成立"。',
          '把提问写在循环里面，每转一圈就问一次。',
          'if pwd == "1234": 判断输没输对，注意空两格。',
          'break 在 if 里面，要空四格——它一执行，整个循环就结束了。'
        ]
      },
      task: `
        <p>写一个问答程序：<strong>一直问口令</strong>，直到输入 <code class="inline">quit</code>，就输出 <code class="inline">再见</code> 并停止。其他回答不用理会，继续问。</p>
        <p>测试时依次输入 <code class="inline">hello</code>、<code class="inline">hi</code>、<code class="inline">quit</code>。示例是"输对密码才停"，这次换成"输入某个词才停"。</p>`,
      starter: `# 一直问口令，输入 quit 才停\n`,
      stdin: { value: 'hello\nhi\nquit', tip: '三次回答，一行一个：', multiline: true },
      hints: [
        '示例里那个"一直重复"的循环，开头的关键字就是这一关的主角，先把它写出来。',
        '把提问写在循环里面，每转一圈问一次。',
        '示例里"输对了就 break"，这次什么时候该喊停？'
      ],
      quiz: {
        question: 'break 的作用是什么？',
        options: ['再循环一次', '跳出循环，不再重复', '暂停一秒', '什么也不做'],
        answer: 1,
        explain: '对！break 就像喊"停"，直接跳出整个循环。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bwhile\b/.test(code)) return { passed: false, message: '这一关要用 while 来做"一直重复"。' };
        if (!/\bbreak\b/.test(code)) return { passed: false, message: '输入 quit 之后要停下来，用 break 跳出循环。' };
        if (!outHas(r, '再见')) return { passed: false, message: '输入 quit 时应该输出"再见"，检查一下比较的那一行。' };
        return ok('对了！示例是密码对了才停，你是输入 quit 才停——"直到…才停"的套路你掌握了。');
      }
    },

    /* ================= 第 13 关（新增）================= */
    {
      id: 13,
      name: '给文字洗个澡',
      short: '字符串方法',
      subtitle: '去掉空格、改大小写、用 f-string 拼句子',
      intro: `
        <p>用户打字时常常带多余空格，或者大小写乱七八糟。直接拿来用会很别扭，得像洗衣服一样先"处理"一下。</p>
        <p>文字自带一些小工具：strip 去掉两边空格、upper 转大写、lower 转小写。再配上 f-string，拼句子特别顺手。这一关学完，你能把乱糟糟的输入整理漂亮。</p>
        <div class="callout goal">这一关结束，你能做到：清洗文字并用 f-string 拼出漂亮的句子。</div>`,
      knowledge: `
        <p>文字（字符串）后面加点、加小括号，就能用它的工具：</p>
        <div class="analogy"><div class="a-icon">洗衣服</div><div class="a-text">strip() 像剪掉衣服上多余的线头——去掉文字两边空格。upper() 像把衣服统一染成大写色，lower() 染成小写色。它们都不会改动原文字，而是给你一件"处理好的新衣服"。</div></div>
        <p>拼句子的新招 <code class="inline">f-string</code>：在引号前加个 f，就能把 {盒子} 直接写进文字里。</p>
        <div class="callout tip">写 f"你好，{name}" 就能把 name 的内容嵌进去，比用加号粘来粘去清楚多了。注意 f 要紧贴引号。</div>`,
      example: {
        code: `name = input("名字：")        # 可能带空格
name = name.strip()           # 去掉两边空格
print(name.upper())           # 转成大写显示
print(f"你好，{name}")        # 直接把 name 嵌进句子`,
        notes: [
          'strip() 去掉文字最前和最后的空格，中间的留着。',
          'upper() 返回全大写的新文字，lower() 则是全小写。',
          'f"你好，{name}" 里的 {name} 会被替换成 name 的内容。',
          '如果输入 "  xiaoming  "，strip 后是 xiaoming，upper 后是 XIAOMING。'
        ]
      },
      task: `
        <p>输入一个<strong>城市名</strong>，先去掉两边空格，再转成大写，最后用 f-string 输出 <code class="inline">城市：XXX</code>（XXX 是大写城市名）。</p>
        <p>测试输入 <code class="inline">  beijing  </code>（前后有空格），期望输出 <code class="inline">城市：BEIJING</code>。示例整理的是名字，这次整理城市。</p>`,
      starter: `# 清洗城市名再输出\n`,
      stdin: { value: '  beijing  ', tip: '城市名：' },
      hints: [
        '输入可能带空格，先想想示例里怎么去掉两边空格。',
        '要输出大写，用哪个工具？',
        '用 f-string 拼句子时，引号前面要加什么？'
      ],
      quiz: {
        question: '"hello".upper() 的结果是什么？',
        options: ['hello', 'HELLO', 'Hello', '报错'],
        answer: 1,
        explain: '对！upper() 把所有字母变成大写。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\.strip\s*\(/.test(code)) return { passed: false, message: '输入可能带空格，要先用 .strip() 去掉两边空格。' };
        if (!/\.upper\s*\(/.test(code)) return { passed: false, message: '要求输出大写城市名，用 .upper() 转换。' };
        if (!outHas(r, '城市：BEIJING')) return { passed: false, message: '应该输出"城市：BEIJING"，检查一下 f-string 的写法和冒号。' };
        return ok('很好！示例整理的是名字，你整理的是城市——文字清洗加 f-string 你都会用了。');
      }
    },

    /* ================= 第 14 关（新增）================= */
    {
      id: 14,
      name: '用钥匙找东西',
      short: '字典',
      subtitle: '给每样东西配一把专属钥匙',
      intro: `
        <p>通讯录里，你不会按"第几个"找人，而是按名字找电话。清单靠位置（0、1、2），现在要有一种靠"名字"找东西的容器——字典。</p>
        <p>字典里每样东西都配一把钥匙，说钥匙就能取到值。这一关学完，你能做一个简易通讯录。</p>
        <div class="callout goal">这一关结束，你能做到：建字典、按键取值、添加新的一项。</div>`,
      knowledge: `
        <p>字典用大括号 <code class="inline">{ }</code>，里面写"钥匙: 值"，用逗号隔开。</p>
        <div class="analogy"><div class="a-icon">钥匙</div><div class="a-text">phone = {"小明": "123"} 像一格储物柜："小明"是钥匙牌，"123"是柜子里的东西。你说 phone["小明"]，就像拿这把钥匙开对应的柜子。清单用数字当位置，字典用文字当钥匙。</div></div>
        <p>添加一项：<code class="inline">phone["小红"] = "456"</code>——就像新挂一个钥匙牌并放进去东西。</p>
        <div class="callout tip">钥匙要放在方括号里，用引号包起来（如果是文字）。取值时钥匙写错，电脑会提示"没找到这把钥匙"。</div>`,
      example: {
        code: `phone = {"小明": "123"}   # 建一本通讯录
phone["小红"] = "456"     # 添加一项
print(phone["小红"])      # 用钥匙取值 → 456
print(len(phone))         # 一共有几项 → 2`,
        notes: [
          '{"小明": "123"} 里，"小明"是钥匙，"123"是值，中间用冒号。',
          'phone["小红"] = "456" 给"小红"配了钥匙并放上电话。',
          'phone["小红"] 就是把这把钥匙插进去，取出里面的 456。',
          'len(phone) 能数出字典里一共有几项。'
        ]
      },
      task: `
        <p>建一个字典 <code class="inline">prices</code> 当水果价目表：先放入 <code class="inline">苹果: 5</code>，再添加 <code class="inline">香蕉: 3</code>，最后输出香蕉的价格。</p>
        <p>期望输出 <code class="inline">3</code>。示例建的是电话簿，这次建价目表。</p>`,
      starter: `# 水果价目表\n`,
      hints: [
        '字典用大括号，里面写"钥匙: 值"，钥匙是文字要加引号。',
        '添加一项用 字典名["新钥匙"] = 值。',
        '取值输出时，把钥匙写在方括号里。'
      ],
      quiz: {
        question: '字典里找东西，靠的是什么？',
        options: ['第几个位置', '钥匙（键）', '颜色', '大小'],
        answer: 1,
        explain: '对！字典靠"钥匙"也就是键来找值，不像清单靠位置。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        const banana = dictVal(r, 'prices', '香蕉');
        if (String(banana) !== '3') return { passed: false, message: '价目表里好像还没有"香蕉"这一项，想想怎么添加新的一项。' };
        if (!outHas(r, '3')) return { passed: false, message: '还没输出香蕉的价格，想想怎么用钥匙把值取出来显示。' };
        return ok('对了！示例查的是电话号码，你查的是水果价格——字典靠钥匙找东西，换个场景照样好使。');
      }
    },

    /* ================= 第 15 关（新增）================= */
    {
      id: 15,
      name: '给清单排排队',
      short: '列表进阶与切片',
      subtitle: '排序、追加、截取一段',
      intro: `
        <p>成绩单乱糟糟的，想从低到高排个序；只想看前三个，不想全打印——这些清单的小工具能帮你。</p>
        <p>sort 排序、append 追加、切片截取。这一关学完，你能把一清单数字整理得服服帖帖。</p>
        <div class="callout goal">这一关结束，你能做到：给清单排序、追加元素、用切片取出想要的一段。</div>`,
      knowledge: `
        <p>清单有几个常用工具：</p>
        <div class="analogy"><div class="a-icon">整理</div><div class="a-text">sort() 像把书架上的书按高矮排好。append(x) 像往清单末尾添一行。切片 scores[1:3] 像说"从第 1 个开始，拿两个走"——含头不含尾。</div></div>
        <p>注意 sort() 是<strong>直接把原清单排好</strong>，不需要接返回值；而 append() 也是直接改动原清单。</p>
        <div class="callout tip">排序后最小在第 0 个位置，最大在最后。想知道最后一项，用 scores[len(scores) - 1]，len 能数出清单有几项。</div>`,
      example: {
        code: `scores = [88, 75, 96, 92]  # 乱序成绩
scores.append(80)           # 末尾添一个
scores.sort()               # 从小到大排好
print(scores)               # [75, 80, 88, 92, 96]
print(scores[1:3])          # 截取第 1、2 个 → [80, 88]`,
        notes: [
          'append(80) 直接把 80 加到清单最后。',
          'sort() 直接把原清单改成从小到大排。',
          'scores[1:3] 取位置 1 和 2，不包含位置 3——"含头不含尾"。',
          '切片得到的是一小段新清单，所以会显示成 [80, 88] 的样子。'
        ]
      },
      task: `
        <p>把年龄清单 <code class="inline">ages = [30, 12, 25, 8]</code> 从小到大排序，先输出整个清单，再单独输出排序后的最后一个数（最大年龄）。</p>
        <p>期望：先显示 <code class="inline">[8, 12, 25, 30]</code>，再单独显示一行 <code class="inline">30</code>。示例排的是成绩，这次排年龄。</p>`,
      starter: `ages = [30, 12, 25, 8]\n`,
      hints: [
        '示例里让清单排好队用的是哪个工具？',
        '输出整个清单，直接 print 清单名就行。',
        '最大年龄在排好序的最后一个位置，想想怎么取最后一项。'
      ],
      quiz: {
        question: '清单排序后，最小的数在哪个位置？',
        options: ['最后', '第 0 个', '中间', '没有规律'],
        answer: 1,
        explain: '对！从小到大排，最小在第 0 个位置，最大在最后。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\.sort\s*\(/.test(code)) return { passed: false, message: '要给清单排序，想想用哪个工具。' };
        if (!outHas(r, '[8, 12, 25, 30]')) return { passed: false, message: '排序后整个清单应该是 [8, 12, 25, 30]，检查一下排序和输出。' };
        if (!r.output.some(function (x) { return String(x).trim() === '30'; })) return { passed: false, message: '还要单独输出一行最大年龄 30，想想怎么取清单的最后一项。' };
        return ok('很好！示例排的是成绩，你排的是年龄——排序工具换个清单照样好使。');
      }
    },

    /* ================= 第 16 关（新增）================= */
    {
      id: 16,
      name: '好几个条件一起判',
      short: 'and or not 与 in',
      subtitle: '把多个判断拼起来，做真正的闰年判断',
      intro: `
        <p>"既能被 4 整除、又不能被 100 整除，或者能被 400 整除"——闰年的规则听起来绕，其实就是把几个小判断用"并且""或者"连起来。</p>
        <p>这一关学完，你能把多个条件拼成一个判断，做出正经的闰年检查器。这是书里 Day07 的经典练习。</p>
        <div class="callout goal">这一关结束，你能做到：用 and / or / in 组合多个条件。</div>`,
      knowledge: `
        <p>四个连接词：</p>
        <div class="analogy"><div class="a-icon">连接</div><div class="a-text"><strong>and</strong> 是"并且"，两边都要对；<strong>or</strong> 是"或者"，一边对就行；<strong>not</strong> 是"不是"，把对错反过来；<strong>in</strong> 是"在…里面"，问一样东西在不在一串里。</div></div>
        <p>闰年规则（四年一闰、百年不闰、四百年再闰）：<br>(year % 4 == 0 and year % 100 != 0) or year % 400 == 0</p>
        <div class="callout tip">小括号能改变判断顺序，就像数学里一样。先算括号里的，再算括号外的。</div>`,
      example: {
        code: `year = int(input("年份："))
if (year % 4 == 0 and year % 100 != 0) or year % 400 == 0:
    print("闰年")     # 条件成立
else:
    print("平年")     # 否则

fruits = ["苹果", "香蕉"]
if "苹果" in fruits: # 问"苹果"在不在清单里
    print("有苹果")`,
        notes: [
          'and 两边都要成立；or 只要一边成立。',
          '小括号把"能被4整除且不能被100整除"先算成一组。',
          'in 判断"苹果"是不是清单里的一项。',
          '输入 2024 会显示"闰年"，输入 1900 会显示"平年"。'
        ]
      },
      task: `
        <p>输入年份，用闰年规则判断并输出 <code class="inline">闰年</code> 或 <code class="inline">平年</code>。</p>
        <p>测试输入 <code class="inline">1900</code>，期望输出 <code class="inline">平年</code>。注意：1900 能被 4 整除，但它是<strong>整百年</strong>——示例里的规则对整百年有额外规定，别只用一半。</p>`,
      starter: `# 闰年判断\n`,
      stdin: { value: '1900', tip: '年份：' },
      hints: [
        '先用 int(input(...)) 拿到年份数字。',
        '示例里的规则分成两部分，用 and 和 or 连起来，缺一部分就会判断错。',
        '1900 是整百年，想想规则里"百年不闰、四百年再闰"这一句。'
      ],
      quiz: {
        question: '条件 A and B 什么时候成立？',
        options: ['A、B 都成立', 'A 或 B 有一个成立', 'A 成立就行', '永远不会'],
        answer: 0,
        explain: '对！and 是"并且"，两边都得对。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\band\b/.test(code) || !/\bor\b/.test(code)) return { passed: false, message: '闰年规则要同时用到 and（并且）和 or（或者），少一个就会漏掉整百年的情况。' };
        if (!outHas(r, '平年') || outHas(r, '闰年')) return { passed: false, message: '1900 是平年，应该输出"平年"。检查一下是不是漏掉了整百年的规则。' };
        return ok('对了！示例测的是 2024，你测的 1900 是整百年陷阱——完整规则你真的掌握了。');
      }
    },

    /* ================= 第 17 关（新增）================= */
    {
      id: 17,
      name: '给程序装安全网',
      short: 'try except 异常',
      subtitle: '出错了也不崩，改用友好的提示',
      intro: `
        <p>用户非要输入文字而不是数字，程序就报错停住了——这体验很糟。好的程序会预判出错，出错时说句人话，而不是直接崩掉。</p>
        <p>try / except 就是这张安全网：把可能出错的代码放进 try，万一错了，就跳到 except 里执行备选方案。这一关学完，你的程序更结实了。</p>
        <div class="callout goal">这一关结束，你能做到：用 try / except 接住错误，给出友好提示。</div>`,
      knowledge: `
        <p>写法：<code class="inline">try:</code> 下面空两格放"可能会出错的代码"，再写 <code class="inline">except:</code> 下面空两格放"出错时怎么办"。</p>
        <div class="analogy"><div class="a-icon">安全网</div><div class="a-text">try 像走钢丝，下面张着一张网。正常走完就没事；万一摔了（出错），网接住你，改走 except 里的后路，程序不会整个垮掉。</div></div>
        <p>比如 int("abc") 变不出数字，就会"摔一跤"。有安全网时，程序不会崩，而是执行 except 里的提示。</p>
        <div class="callout tip">注意：except 和 try 要上下对齐（都不空格），它们各自管的事才空两格。</div>`,
      example: {
        code: `try:
    n = int(input("数字："))  # 可能出错：输入的不是数字
    print(n * n)              # 没出错就算平方
except:
    print("请输入数字")       # 出错时给友好提示`,
        notes: [
          'try 里放"可能出错"的代码：int(input(...))。',
          '如果一切正常，执行 try 里的 print(n * n)。',
          '如果 int 变身失败，try 里剩下的就不执行，直接跳到 except。',
          '屏幕上看不到吓人的英文报错，只有友好提示。'
        ]
      },
      task: `
        <p>写一个<strong>除法计算器</strong>：输入内容，尝试变成数字，输出 100 除以它的结果；<strong>如果输入的不是数字</strong>，就输出 <code class="inline">除数不合法</code>。</p>
        <p>测试输入 <code class="inline">abc</code>，期望输出 <code class="inline">除数不合法</code>。示例算的是平方，这次算除法，出错时的提示语也要换。</p>`,
      starter: `# 带安全网的除法计算器\n`,
      stdin: { value: 'abc', tip: '数字：' },
      hints: [
        '用 try: 开头，把可能出错的代码放在它下面空两格的地方。',
        '示例里出错的是"变身"那一步，这里也一样。',
        '出错时给友好提示，提示语写在 except 下面，内容要符合题意。'
      ],
      quiz: {
        question: 'try 里的代码出错时，程序会怎样？',
        options: ['直接崩溃', '跳到 except 执行', '什么都不做', '重新运行一遍'],
        answer: 1,
        explain: '对！安全网接住错误，改走 except 里的路。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\btry\b/.test(code) || !/\bexcept\b/.test(code)) return { passed: false, message: '要用 try 和 except 织一张安全网。' };
        if (!outHas(r, '除数不合法')) return { passed: false, message: '输入 abc 应该输出"除数不合法"，检查一下 except 里写了什么。' };
        return ok('不错！示例防的是平方计算器，你防的是除法计算器——安全网的招数通用。');
      }
    },

    /* ================= 第 18 关（新增）================= */
    {
      id: 18,
      name: '函数自己叫自己',
      short: '递归与默认参数',
      subtitle: '把大问题拆成一样的小问题',
      intro: `
        <p>算 5 的阶乘（5×4×3×2×1），可以换个想法：5! = 5 × 4!，而 4! = 4 × 3!……一直拆到 1! = 1。函数在里面调用自己，就叫递归。</p>
        <p>还有个小技巧：参数可以给默认值，调用时不填就用默认值。这一关学完，你能写更聪明的函数。</p>
        <div class="callout goal">这一关结束，你能做到：写一个递归函数算阶乘，并会用默认参数。</div>`,
      knowledge: `
        <p>递归的两个要点：</p>
        <div class="analogy"><div class="a-icon">套娃</div><div class="a-text">递归像俄罗斯套娃：一层打开里面还有一层一样的小娃。但必须有最小的一个——"到底了"的情况，否则会无限打开下去。这个"到底"叫<strong>出口</strong>。</div></div>
        <p>阶乘的出口是 n &lt;= 1 时直接返回 1；否则返回 n * fact(n - 1)——把问题拆小一号交给自己。</p>
        <p>默认参数：写 <code class="inline">def f(a, n=2):</code>，调用 f(3) 时 n 自动是 2。</p>
        <div class="callout note">递归的逻辑比较绕，第一次觉得难很正常。先照着套路写一遍，跑通了再慢慢体会。</div>`,
      example: {
        code: `def fact(n):
    if n <= 1:            # 出口：最小的问题
        return 1
    return n * fact(n - 1)  # 拆小一号，交给自己

print(fact(5))            # 120

def power(a, n=2):        # n 不填就默认 2
    return a ** n
print(power(3))           # 9`,
        notes: [
          'if n <= 1: return 1 是出口，没有它就会无限调用。',
          'return n * fact(n - 1) 把 5! 拆成 5 × 4!，层层往下。',
          'fact(5) 的结果是 120。',
          'power(3) 没传 n，就用默认值 2，结果是 3 的平方 9。'
        ]
      },
      task: `
        <p>写一个递归函数 <code class="inline">sum_to(n)</code>，算 1+2+…+n 的和，输出 <code class="inline">sum_to(6)</code> 的结果。</p>
        <p>期望输出 <code class="inline">21</code>。要求函数里真的调用自己。示例算的是阶乘（用乘），这次算的是累加（用加）。</p>`,
      starter: `# 递归求和\n`,
      hints: [
        '递归要有"出口"：最小的问题直接返回答案，想想 n 等于 1 时和是多少。',
        '示例里阶乘是 n 乘以更小的自己，这次是累加——该用哪个运算符号？',
        '最后调用这个函数，喂进去 6，再把结果输出。'
      ],
      quiz: {
        question: '递归函数必须有的是什么？',
        options: ['一个出口（结束条件）', '很多参数', 'while 循环', '文件操作'],
        answer: 0,
        explain: '对！没有出口就会无限调用下去，程序停不了。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bsum_to\s*\(/.test(code) || !/sum_to\s*\(\s*n\s*-\s*1/.test(code)) return { passed: false, message: '递归要在函数里调用自己，也就是用 n - 1 再调一次自己。' };
        if (!outHas(r, '21')) return { passed: false, message: 'sum_to(6) 应该是 21，检查一下出口和累加那一行。' };
        return ok('厉害！示例递归算的是乘法（阶乘），你递归算的是加法（累加）——递归的套路你真的懂了。');
      }
    },

    /* ================= 第 19 关（新增）================= */
    {
      id: 19,
      name: '照着图纸造东西',
      short: '类与对象',
      subtitle: '把数据和动作打包成一个"物件"',
      intro: `
        <p>造房子前先有图纸：图纸规定房子有什么（几间房）、能做什么（开门关门）。照着图纸造出来的每栋房子，都有自己的房间。</p>
        <p>图纸叫"类"，造出来的房子叫"对象"。这一关学完，你能定义自己的类，创建对象，让它按你写的方法行动。</p>
        <div class="callout goal">这一关结束，你能做到：定义类、写 __init__ 和对象方法、创建对象并调用方法。</div>`,
      knowledge: `
        <p>定义类写 <code class="inline">class 名字:</code>，里面用 def 写方法（就是对象能做的事）。</p>
        <div class="analogy"><div class="a-icon">图纸</div><div class="a-text">class Cat 是"猫的图纸"。__init__ 是"出厂装配"：造猫时给它起名字，self.name = name 就是把名字贴在这只猫身上。self 指"这个对象自己"。</div></div>
        <p>方法里第一个参数习惯叫 self，代表"我自己"。调用方法时不用管它，电脑会自动传。</p>
        <div class="callout tip">创建对象就像按图纸造猫：c = Cat("小橘")。然后 c.speak() 就是让这只猫做"说话"这个动作。</div>`,
      example: {
        code: `class Cat:                    # 图纸：猫
    def __init__(self, name): # 出厂装配
        self.name = name      # 贴上名字
    def speak(self):          # 猫会做的动作
        print(self.name + "喵喵")

c = Cat("小橘")               # 按图纸造一只猫
c.speak()                     # 让它说话 → 小橘喵喵`,
        notes: [
          'class Cat: 定义一张叫 Cat 的图纸，末尾有冒号。',
          '__init__ 在创建对象时自动运行，用来装配属性。',
          'self.name 是"这只猫自己的名字"，不同猫可以有不同名字。',
          'c.speak() 调用对象的方法，self 不用你传，电脑自动带上。'
        ]
      },
      task: `
        <p>定义一个类 <code class="inline">Dog</code>：用 __init__ 接收名字存到对象自己身上；写一个 <code class="inline">bark</code> 方法，输出 <code class="inline">名字 + "汪汪"</code>。</p>
        <p>然后创建 <code class="inline">d = Dog("小黑")</code>，调用 <code class="inline">d.bark()</code>，期望输出 <code class="inline">小黑汪汪</code>。示例造的是猫，这次造狗。</p>`,
      starter: `# 定义 Dog 类\n`,
      hints: [
        '定义图纸用 class 名字:，名字换成题目要求的。',
        '__init__ 是"出厂装配"，把传进来的名字贴到对象自己身上。',
        '方法里用存好的名字拼出叫声，调用方法时不用你传 self。'
      ],
      quiz: {
        question: '方法里的 self 指的是什么？',
        options: ['这个对象自己', '类别的名字', '一个数字', '没有作用'],
        answer: 0,
        explain: '对！self 代表"这个对象自己"，靠它访问自己的属性。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bclass\s+Dog\b/.test(code)) return { passed: false, message: '要用 class 定义一只狗的类。' };
        if (!/self\s*\.\s*name/.test(code)) return { passed: false, message: '要用 self.name 把名字存到对象自己身上。' };
        if (!outHas(r, '小黑汪汪')) return { passed: false, message: '调用 bark 方法应该输出"小黑汪汪"，检查一下方法里的拼接。' };
        return ok('很好！示例造的是猫，你造的是狗——图纸和对象的套路你已经入门了。');
      }
    },

    /* ================= 第 20 关（新增·终极项目）================= */
    {
      id: 20,
      name: '终极项目：单词打卡工具',
      short: '终极项目',
      subtitle: '字典 + 文件 + 循环 + 提问，做出一个真能用的小工具',
      intro: `
        <p>走到这里，你已经会变量、计算、提问、判断、循环、清单、字典、函数、文件、异常处理。现在是终极挑战：做一个<strong>单词背诵打卡工具</strong>。</p>
        <p>它能让你往单词本里加新单词，然后把整本单词表保存进文件、还能读出来复习。这是你独立完成的第二个完整作品，比记账本更复杂，也更接近真实的小工具。</p>
        <div class="callout goal">这一关结束，你会做一个能保存、能读取的单词本——真正的完整项目。</div>`,
      knowledge: `
        <p>这个工具要做四件事：</p>
        <ol class="steps">
          <li><span class="sn">1</span>用字典 words 存单词和意思，先放两个进去；</li>
          <li><span class="sn">2</span>输入一个新单词和新意思，用 keys 的方式加进字典；</li>
          <li><span class="sn">3</span>用 for 循环遍历字典，把每个词写成一行存进文件；</li>
          <li><span class="sn">4</span>重新打开文件，把整本单词表读出来显示。</li>
        </ol>
        <div class="callout note">写文件时每个词一行，用 \\n 换行，比如 "apple=苹果\\n"。之后读出来就能一行一个词条，方便复习。</div>
        <div class="callout tip">遍历字典用 for key in words:，key 会依次是每个钥匙（单词），再用 words[key] 取出意思。这些招式前面都学过，现在是它们合体的时候。</div>`,
      example: {
        code: `# 几个小零件，看看怎么用（不是完整答案）
d = {"apple": "苹果"}        # 建一个字典
d["book"] = "书"              # 添一项

f = open("示例词本.txt", "w") # 拿本子
f.write("apple=苹果\\n")      # 写一行试试
f.close()                     # 合上本子`,
        notes: [
          '上面只是零件演示：字典里只有一个词，文件里也只写了一行，不是你要交的工具。',
          '给字典添新的一项，用 字典名["新钥匙"] = 值。',
          '示例里的词和文件名都跟任务无关，别照搬。',
          '"把每个词都写进去"和"读出来复习"这两段，要你自己用循环和 read 搭出来。'
        ]
      },
      task: `
        <p>完成单词打卡工具。测试时输入新单词 <code class="inline">cat</code> 和意思 <code class="inline">猫</code>。</p>
        <ul class="mini-list">
          <li>字典 words 先放 <code class="inline">apple: 苹果</code> 和 <code class="inline">book: 书</code>；</li>
          <li>输入新单词和意思，加进字典；</li>
          <li>用 for 循环把所有词条写进 <code class="inline">words.txt</code>，每个一行，格式 <code class="inline">单词=意思</code>；</li>
          <li>再打开文件，把整本内容读出来显示（要能看到 apple、book、cat 三行）。</li>
        </ul>`,
      starter: `# 你的单词打卡工具，从这里开始\n`,
      stdin: { value: 'cat\n猫', tip: '新单词和意思，一行一个：', multiline: true },
      hints: [
        '先建好字典，把两个初始单词放进去。',
        '输入的新单词和新意思，要像示例演示的那样，作为新的钥匙和值加进字典。',
        '把每个词条写成一行存进文件，要用 for 挨个走一遍字典——示例只写了一行，循环得自己搭。',
        '写完合上本子，再用 "r" 打开读出来复习。'
      ],
      quiz: {
        question: '遍历字典时，for key in words 里的 key 是什么？',
        options: ['每个值（意思）', '每个钥匙（单词）', '数字序号', '文件名'],
        answer: 1,
        explain: '对！key 是每个钥匙，也就是单词，再用 words[key] 取意思。'
      },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bfor\b/.test(code) || !/open\s*\(/.test(code)) return { passed: false, message: '项目要用 for 循环遍历，还要用 open 把内容存进文件。' };
        const c = fileContent(r, 'words.txt') || '';
        if (c.indexOf('apple=苹果') === -1 || c.indexOf('cat=猫') === -1) return { passed: false, message: '文件里应该有 apple、book、cat 三行词条，检查一下循环写入的格式。' };
        if (!outHas(r, 'apple')) return { passed: false, message: '文件写好了，但还没读出来显示，最后用 open(..., "r") 加 read() 再 print。' };
        return ok('恭喜！你独立完成了终极项目——一个能保存、能读取的单词打卡工具。从零基础走到这里，非常了不起！');
      }
    }
  ];

  /* ============================================================
   * B 卷：点“重新开始”后换用的另一套题目
   * 只换 task / starter / stdin / hints / quiz / check；
   * 示例 example 与知识点 knowledge 始终沿用关卡顶层，不随题组变化。
   * ============================================================ */
  const ALTS = {
    1: {
      task: `<p>打印一张<strong>快递单</strong>，三行依次是：<code class="inline">快递单</code>、<code class="inline">收件人 小李</code>、<code class="inline">地址 幸福路5号</code>。</p><p>再加一行，用逗号把 <code class="inline">运费</code> 和 <code class="inline">8</code> 连起来输出。</p>`,
      starter: `# 一行一行写出来\n`,
      hints: ['屏幕上要出现几行，就写几行 print。', '文字用引号包起来；最后一行的 8 是数字，不用引号。', '想让文字和数字排在同一行，用逗号隔开。'],
      quiz: { question: 'print("合计", 30) 会显示成什么样？', options: ['合计30', '合计 30', '报错', '只显示合计'], answer: 1, explain: '对！逗号会让电脑用空格把文字和数字连起来。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/print\s*\(/.test(code)) return { passed: false, message: '这一关要用小喇叭 print 让电脑说话哦。' };
        if (!outHas(r, '快递单') || !outHas(r, '收件人 小李') || !outHas(r, '地址 幸福路5号')) return { passed: false, message: '快递单的三行还没齐全，检查一下每行的文字。' };
        if (!outHas(r, '运费 8')) return { passed: false, message: '最后一行要用逗号把"运费"和 8 连起来。' };
        return ok('很好！换成了快递单，你照样能让电脑逐行打印。');
      }
    },
    2: {
      task: `<p>两个盒子：<code class="inline">boxA</code> 装 7，<code class="inline">boxB</code> 装 3。请<strong>对调</strong>里面的东西，最后输出 boxA 和 boxB。</p><p>期望看到 <code class="inline">3 7</code>。示例里换数字用的招数，这里换个名字照样管用。</p>`,
      starter: `# 对调两个盒子\nboxA = 7\nboxB = 3\n`,
      hints: ['直接倒来倒去会弄丢原来的东西，先找个空盒子存一下。', '示例里那个临时盒子是干什么用的？这里也需要一个。', '对调完别忘了显示两个盒子，中间用逗号。'],
      quiz: { question: '执行 a = 3 再执行 a = 9 后，a 盒子里装的是？', options: ['3', '9', '3 和 9 都在', '空的'], answer: 1, explain: '没错！后来的会盖掉先前的，盒子里只剩 9。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (varVal(r, 'boxA') !== 3 || varVal(r, 'boxB') !== 7) return { passed: false, message: '还没对调成功，boxA 应该是 3、boxB 应该是 7。想想那个空盒子。' };
        if (!outHas(r, '3 7')) return { passed: false, message: '对调对了，但还没显示出来，最后用 print 把两个盒子显示出来。' };
        return ok('漂亮！示例里换的是 a 和 b，你换的是 boxA 和 boxB——招数通用。');
      }
    },
    3: {
      task: `<p>有 <code class="inline">29</code> 本书，每 <code class="inline">6</code> 本摞成一摞。算出能摞几摞、还剩几本，用 print 一次输出两个数。</p><p>期望看到 <code class="inline">4 5</code>。用变量、<code class="inline">//</code> 和 <code class="inline">%</code> 来算。</p>`,
      starter: `# 摞书\n`,
      hints: ['先造两个盒子：一个装总数，一个装每摞的本数。', '示例里"装满几份"用的是哪个符号？"剩下几个"用的是哪个符号？', '最后用 print 一次显示两个数，中间用逗号。'],
      quiz: { question: '29 % 6 的结果是多少？', options: ['4', '5', '6', '1'], answer: 1, explain: '对！29 = 6 × 4 + 5，剩下的是 5。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\/\//.test(code) || !/%/.test(code)) return { passed: false, message: '这一关要同时用 // 和 % 来分东西，不能直接写答案哦。' };
        if (!outHas(r, '4 5')) return { passed: false, message: '结果应该是"摞 4 摞、剩 5 本"，检查一下两个符号是不是用反了。' };
        return ok('算对了！示例分的是苹果，你摞的是书——方法完全一样。');
      }
    },
    4: {
      task: `<p>让电脑依次问两个整数，输出<strong>第一个减去第二个</strong>的差（真正数字相减）。</p><p>测试时输入 <code class="inline">50</code> 和 <code class="inline">20</code>，期望看到 <code class="inline">30</code>。</p>`,
      starter: `# 问两个数，求差\n`,
      stdin: { value: '50\n20', tip: '两次回答，一行一个：', multiline: true },
      hints: ['提问用 input("……")，问句写在引号里。', 'input 拿回来的是文字，要先变成数字才能做减法。', '示例算的是乘积，这次要算差——想想用哪个运算符号。'],
      quiz: { question: 'input() 拿到的内容是什么？', options: ['数字', '文字', '自动识别', '空的'], answer: 1, explain: '对！是文字，所以要用 int() 变身才能做数学运算。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/input\s*\(/.test(code)) return { passed: false, message: '这一关要让电脑提问，记得用 input("……")。' };
        if (!/int\s*\(/.test(code)) return { passed: false, message: '回答是文字，要请 int(...) 帮它变成数字才能运算。' };
        if (!/-/.test(code)) return { passed: false, message: '这次要求差，想想减法用哪个符号。' };
        if (!outHas(r, '30')) return { passed: false, message: '差应该是 30，检查一下是不是忘了变身、或者减反了。' };
        return ok('成功！示例求的是积，你求的是差——提问和变身的招数你会用了。');
      }
    },
    5: {
      task: `<p>写一个收银程序：输入金额，<strong>满 100 就减 20</strong>，最后输出实付金额。</p><p>测试输入 <code class="inline">150</code>，期望输出 <code class="inline">130</code>。示例是满 50 减 10，这次门槛和优惠都变了。</p>`,
      starter: `# 满 100 减 20\n`,
      stdin: { value: '150', tip: '消费金额：' },
      hints: ['先用 int(input(...)) 拿到数字。', '示例判断的是"满 50"，这次门槛变了，判断里的数字也要跟着变。', '满就减 20，不满足就原价——不满足时那行不执行。'],
      quiz: { question: '150 >= 100 是对还是错？', options: ['对', '错'], answer: 0, explain: '对！150 比 100 大，所以条件成立，要减 20。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/if\b/.test(code) || !/>=/.test(code)) return { passed: false, message: '要用 if 加 >= 来判断"满没满 100"。' };
        if (!outHas(r, '130')) return { passed: false, message: '输入 150 应该显示 130（减了 20），检查一下判断和减法。' };
        return ok('对了！示例是满 50 减 10，你是满 100 减 20——判断的招数你掌握了。');
      }
    },
    6: {
      task: `<p>输入一个整数，判断它<strong>是不是 5 的倍数</strong>（除以 5 的余数是不是 0），输出 <code class="inline">是5的倍数</code> 或 <code class="inline">不是5的倍数</code>。</p><p>测试输入 <code class="inline">20</code>，期望输出 <code class="inline">是5的倍数</code>。</p>`,
      starter: `# 判断是不是 5 的倍数\n`,
      stdin: { value: '20', tip: '一个整数：' },
      hints: ['先用 int(input(...)) 拿到数字。', '看余数就知道是不是倍数——示例里判断奇偶看的是除以 2 的余数，这次该看除以几？', '是、不是两种情况都要说到，用 if 和 else 分别输出。'],
      quiz: { question: '20 % 5 的结果是多少？', options: ['0', '1', '4', '5'], answer: 0, explain: '对！20 除以 5 正好分完，余数是 0，所以是 5 的倍数。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/==/.test(code) || !/%/.test(code)) return { passed: false, message: '要用 % 取余，再用 == 判断余数是不是 0。' };
        if (!/\belse\b/.test(code)) return { passed: false, message: '是、不是两种情况都要说到，加上 else: 吧。' };
        if (!outHas(r, '是5的倍数')) return { passed: false, message: '输入 20 应该显示"是5的倍数"，检查一下判断条件里的除数。' };
        return ok('完全正确！示例判断的是奇偶，你判断的是 5 的倍数——取余加判断你会用了。');
      }
    },
    7: {
      task: `<p>用 for 循环算出 <strong>3 到 9</strong> 的和（3+4+…+9），输出结果。期望看到 <code class="inline">42</code>。</p><p>要求用一个总数变量累加，不能用现成的求和函数。</p>`,
      starter: `# 累加 3 到 9\n`,
      hints: ['先准备一个空盒子装总数。', '示例里 range(1, 11) 是 1 到 10，那 3 到 9 该怎么写？记住"含头不含尾"。', '循环里把当前的数加进总数盒子，循环外再输出结果。'],
      quiz: { question: 'range(3, 10) 一共会产生几个数？', options: ['6 个', '7 个', '10 个', '3 个'], answer: 1, explain: '对！它给 3 到 9，正好 7 个数——含头不含尾。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bfor\b/.test(code)) return { passed: false, message: '这一关要用 for 循环来累加。' };
        if (!outHas(r, '42')) return { passed: false, message: '3 到 9 的和应该是 42，检查一下 range 的写法和累加那一行。' };
        return ok('很好！示例累加的是 1 到 10，你换成了 3 到 9——循环的套路你会用了。');
      }
    },
    8: {
      task: `<p>四天的气温清单是 <code class="inline">temps = [31, 5, 27, 19]</code>。不用 min 函数，自己找出<strong>最低的气温</strong>并输出。</p><p>期望输出 <code class="inline">5</code>。示例找的是最大值，这次要找最小的——比较的方向要反过来。</p>`,
      starter: `temps = [31, 5, 27, 19]\n`,
      hints: ['示例里先假设第一个是最大的，这次要找最小，擂主该怎么选？', '用循环挨个看，只有比擂主更小才换人。', '注意嵌在里面的那行要比外层多空两格。'],
      quiz: { question: '要找最小值，if 里该用哪个符号比较？', options: ['>', '<', '==', '='], answer: 1, explain: '对！只有比当前最小值更小（<）才换人。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (/\bmin\s*\(/.test(code)) return { passed: false, message: '这一关要自己找最小值，先别用现成的 min 哦。' };
        if (!/\bfor\b/.test(code) || !/\bif\b/.test(code)) return { passed: false, message: '要用 for 挨个看，再用 if 比较大小。' };
        if (!outHas(r, '5')) return { passed: false, message: '最低气温应该是 5，检查一下擂主的初始值和比较方向。' };
        return ok('漂亮！示例找的是最大值，你找的是最小值——比较方向反过来就对了。');
      }
    },
    9: {
      task: `<p>造一个叫 <code class="inline">double</code> 的函数，接收一个数 x，返回它的<strong>两倍</strong>。</p><p>然后调用两次，输出 <code class="inline">double(7)</code> 和 <code class="inline">double(12)</code> 的结果（<code class="inline">14</code> 和 <code class="inline">24</code>）。</p>`,
      starter: `# 造翻倍机器\n`,
      hints: ['定义机器写 def 名字(参数):，括号里就是投料口。', '示例机器算的是周长，这次机器要做的是"翻倍"——想想公式。', '造好机器后调用两次，每次喂不同的数。'],
      quiz: { question: 'return 的作用是什么？', options: ['把结果交出来', '开始一个循环', '做判断', '定义变量'], answer: 0, explain: '对！return 把机器算好的结果交出来。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bdef\s+double\s*\(/.test(code)) return { passed: false, message: '要定义一个叫 double 的函数。' };
        if (!/\breturn\b/.test(code)) return { passed: false, message: '函数要用 return 把结果交出来。' };
        if (!outHas(r, '14') || !outHas(r, '24')) return { passed: false, message: '两次调用应该分别输出 14 和 24，检查一下翻倍公式和调用时投进去的数。' };
        return ok('成功！示例造的是周长机器，你造的是翻倍机器——造机器的套路通用。');
      }
    },
    10: {
      task: `<p>写入文件 <code class="inline">待办.txt</code>，内容依次是三行：<code class="inline">写作业</code>、<code class="inline">买牛奶</code>、<code class="inline">散步</code>。</p><p>然后打开文件，把整张清单读出来显示。</p>`,
      starter: `# 写待办清单，再读出来\n`,
      hints: ['用 open("文件名", "w") 拿本子准备写。', '三行内容之间要用换行符隔开，示例里用的是哪个符号？', '写完要合上本子，再用 "r" 打开读回来显示。'],
      quiz: { question: '写完文件后为什么要 close()？', options: ['让内容真正保存好', '让文件变大', '没有作用', '为了能再写一次'], answer: 0, explain: '对！合上本子，内容才算真正保存好。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        const c = fileContent(r, '待办.txt') || '';
        if (!c) return { passed: false, message: '还没看到"待办.txt"被写出来，先用 open("待办.txt", "w") 打开本子。' };
        if (c.indexOf('写作业') === -1 || c.indexOf('买牛奶') === -1 || c.indexOf('散步') === -1) return { passed: false, message: '三件待办没写全，检查一下 write 里的内容和换行符。' };
        if (!outHas(r, '写作业')) return { passed: false, message: '文件写好了，但还没读出来显示，用 open(..., "r") 加 read() 再 print。' };
        return ok('很好！示例写的是购物清单，你写的是待办清单——写文件、读文件你都会了。');
      }
    },
    11: {
      task: `<p>完成记账本。测试时依次输入 <code class="inline">25</code>、<code class="inline">30</code>、<code class="inline">20</code>（总和 75）。</p><ul class="mini-list"><li>用 for 循环问 3 次金额，int 变成数字，append 进 records；</li><li>再用 for 循环算出总额 total 并输出（应该是 75）；</li><li>这次总和没超过 100，所以<strong>不要</strong>输出"花超啦"；</li><li>把 <code class="inline">总花费75</code> 写进文件 <code class="inline">账本.txt</code>。</li></ul>`,
      starter: `# 你的记账本，从这里开始\n`,
      stdin: { value: '25\n30\n20', tip: '三次金额，一行一个：', multiline: true },
      hints: ['先造一张空清单，准备装 3 笔账。', '问 3 次金额这件事，用 for 循环包住"提问、变身、记进清单"这三步。', '求总额要再用一个循环，套路和第 7 关一样。', '这次总额没超过 100，所以提醒那行不会执行——但你仍要写对判断。', '写文件时数字要先变成文字，示例里请了谁帮忙？'],
      quiz: { question: '想把数字 75 和文字"总花费"粘在一起，要请谁帮忙？', options: ['int()', 'str()', 'for', 'if'], answer: 1, explain: '对！str() 把数字变成文字，才能和文字粘起来。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/for\b/.test(code) || !/\.append\s*\(/.test(code)) return { passed: false, message: '要用 for 循环问 3 次，并用 append 把每笔钱记进清单。' };
        if (!outHas(r, '75')) return { passed: false, message: '总花费应该是 75，检查一下累加的循环。' };
        if (outHas(r, '花超啦')) return { passed: false, message: '75 没有超过 100，不应该输出"花超啦"，检查一下 if 的条件。' };
        const c = fileContent(r, '账本.txt') || '';
        if (c.indexOf('总花费75') === -1) return { passed: false, message: '文件里应该写着"总花费75"，检查一下 write 那一行。' };
        return ok('恭喜阶段作品完成！这次总额没超支，你的判断没有误报。');
      }
    },
    12: {
      task: `<p>写一个问答程序：<strong>一直问口令</strong>，直到输入 <code class="inline">ok</code>，就输出 <code class="inline">完成</code> 并停止。其他回答不用理会，继续问。</p><p>测试时依次输入 <code class="inline">go</code>、<code class="inline">on</code>、<code class="inline">ok</code>。</p>`,
      starter: `# 一直问口令，输入 ok 才停\n`,
      stdin: { value: 'go\non\nok', tip: '三次回答，一行一个：', multiline: true },
      hints: ['示例里那个"一直重复"的循环，开头的关键字就是这一关的主角。', '把提问写在循环里面，每转一圈问一次。', '示例里"输对了就 break"，这次什么时候该停？'],
      quiz: { question: 'break 的作用是什么？', options: ['再循环一次', '跳出循环，不再重复', '暂停一秒', '什么也不做'], answer: 1, explain: '对！break 就像喊"停"，直接跳出整个循环。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bwhile\b/.test(code)) return { passed: false, message: '这一关要用 while 来做"一直重复"。' };
        if (!/\bbreak\b/.test(code)) return { passed: false, message: '输入 ok 之后要停下来，用 break 跳出循环。' };
        if (!outHas(r, '完成')) return { passed: false, message: '输入 ok 时应该输出"完成"，检查一下比较的那一行。' };
        return ok('对了！示例是输入 quit 才停，你是输入 ok 才停——"直到…才停"的套路你掌握了。');
      }
    },
    13: {
      task: `<p>输入一个<strong>昵称</strong>，先去掉两边空格，再转成小写，最后用 f-string 输出 <code class="inline">昵称：xxx</code>（xxx 是小写昵称）。</p><p>测试输入 <code class="inline">  TOM  </code>（前后有空格），期望输出 <code class="inline">昵称：tom</code>。</p>`,
      starter: `# 清洗昵称再输出\n`,
      stdin: { value: '  TOM  ', tip: '昵称：' },
      hints: ['输入可能带空格，先想想示例里怎么去掉两边空格。', '要输出小写，用哪个工具？', '用 f-string 拼句子时，引号前面要加什么？'],
      quiz: { question: '"HI".lower() 的结果是什么？', options: ['HI', 'hi', 'Hi', '报错'], answer: 1, explain: '对！lower() 把所有字母变成小写。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\.strip\s*\(/.test(code)) return { passed: false, message: '输入可能带空格，要先用 .strip() 去掉两边空格。' };
        if (!/\.lower\s*\(/.test(code)) return { passed: false, message: '要求输出小写昵称，用 .lower() 转换。' };
        if (!outHas(r, '昵称：tom')) return { passed: false, message: '应该输出"昵称：tom"，检查一下 f-string 的写法和冒号。' };
        return ok('很好！示例整理的是城市，你整理的是昵称——文字清洗你都会用了。');
      }
    },
    14: {
      task: `<p>建一个字典 <code class="inline">scores</code> 当成绩单：先放入 <code class="inline">语文: 90</code>，再添加 <code class="inline">数学: 95</code>，最后输出数学的成绩。</p><p>期望输出 <code class="inline">95</code>。示例建的是价目表，这次建成绩单。</p>`,
      starter: `# 成绩单\n`,
      hints: ['字典用大括号，里面写"钥匙: 值"，钥匙是文字要加引号。', '添加一项用 字典名["新钥匙"] = 值。', '取值输出时，把钥匙写在方括号里。'],
      quiz: { question: '字典里找东西，靠的是什么？', options: ['第几个位置', '钥匙（键）', '颜色', '大小'], answer: 1, explain: '对！字典靠"钥匙"也就是键来找值。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (String(dictVal(r, 'scores', '数学')) !== '95') return { passed: false, message: '成绩单里好像还没有"数学"这一项，想想怎么添加新的一项。' };
        if (!outHas(r, '95')) return { passed: false, message: '还没输出数学成绩，想想怎么用钥匙把值取出来显示。' };
        return ok('对了！示例查的是水果价格，你查的是考试成绩——字典靠钥匙找东西。');
      }
    },
    15: {
      task: `<p>把身高清单 <code class="inline">heights = [150, 172, 160, 145]</code> 从小到大排序，先输出整个清单，再单独输出最矮的身高。</p><p>期望：先显示 <code class="inline">[145, 150, 160, 172]</code>，再单独显示一行 <code class="inline">145</code>。示例输出的是最大值，这次输出最小值。</p>`,
      starter: `heights = [150, 172, 160, 145]\n`,
      hints: ['示例里让清单排好队用的是哪个工具？', '输出整个清单，直接 print 清单名就行。', '最矮的在排好序的第一个位置，想想怎么取第一项。'],
      quiz: { question: '清单从小到大排序后，最小的数在哪个位置？', options: ['最后', '第 0 个', '中间', '没有规律'], answer: 1, explain: '对！从小到大排，最小在第 0 个位置。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\.sort\s*\(/.test(code)) return { passed: false, message: '要给清单排序，想想用哪个工具。' };
        if (!outHas(r, '[145, 150, 160, 172]')) return { passed: false, message: '排序后整个清单应该是 [145, 150, 160, 172]，检查一下排序和输出。' };
        if (!r.output.some(function (x) { return String(x).trim() === '145'; })) return { passed: false, message: '还要单独输出一行最矮身高 145，想想怎么取清单的第一项。' };
        return ok('很好！示例取的是最大值，你取的是最小值——排序工具换个场景照样好使。');
      }
    },
    16: {
      task: `<p>输入年份，用闰年规则判断并输出 <code class="inline">闰年</code> 或 <code class="inline">平年</code>。</p><p>测试输入 <code class="inline">2000</code>，期望输出 <code class="inline">闰年</code>。示例测的是 1900（平年），这次是 2000——整百年里只有"四百年"的才能过。</p>`,
      starter: `# 闰年判断\n`,
      stdin: { value: '2000', tip: '年份：' },
      hints: ['先用 int(input(...)) 拿到年份数字。', '示例里的规则分成两部分，用 and 和 or 连起来，缺一部分就会判断错。', '2000 是整百年，想想规则里"四百年再闰"那一句。'],
      quiz: { question: '条件 A or B 什么时候成立？', options: ['A、B 都成立', 'A 或 B 有一个成立就行', 'A 成立才行', '永远不会'], answer: 1, explain: '对！or 是"或者"，一边对就成立。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\band\b/.test(code) || !/\bor\b/.test(code)) return { passed: false, message: '闰年规则要同时用到 and（并且）和 or（或者），少一个就会漏掉整百年的情况。' };
        if (!outHas(r, '闰年') || outHas(r, '平年')) return { passed: false, message: '2000 是闰年，应该输出"闰年"。检查一下是不是漏掉了四百年的规则。' };
        return ok('对了！示例测的是 1900，你测的是 2000——两个整百年陷阱都分清了。');
      }
    },
    17: {
      task: `<p>写一个程序：输入内容，尝试变成数字并输出它<strong>加 100</strong> 的结果；<strong>如果输入的不是数字</strong>，就输出 <code class="inline">请输入整数</code>。</p><p>测试输入 <code class="inline">xyz</code>，期望输出 <code class="inline">请输入整数</code>。</p>`,
      starter: `# 带安全网的加法计算器\n`,
      stdin: { value: 'xyz', tip: '数字：' },
      hints: ['用 try: 开头，把可能出错的代码放在它下面空两格的地方。', '示例里出错的是"变身"那一步，这里也一样。', '出错时给友好提示，提示语写在 except 下面，内容要符合题意。'],
      quiz: { question: 'int("abc") 会发生什么？', options: ['变成 0', '变成 abc', '出错', '变成 1'], answer: 2, explain: '对！变不出数字就会出错，所以需要 try/except 接住它。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\btry\b/.test(code) || !/\bexcept\b/.test(code)) return { passed: false, message: '要用 try 和 except 织一张安全网。' };
        if (!outHas(r, '请输入整数')) return { passed: false, message: '输入 xyz 应该输出"请输入整数"，检查一下 except 里写了什么。' };
        return ok('不错！示例防的是除法计算器，你防的是加法计算器——安全网的招数通用。');
      }
    },
    18: {
      task: `<p>写一个递归函数 <code class="inline">fib(n)</code>：n 小于等于 1 时返回 n，否则返回 <code class="inline">fib(n-1) + fib(n-2)</code>。输出 <code class="inline">fib(6)</code> 的结果。</p><p>期望输出 <code class="inline">8</code>。示例递归算的是累加，这次是斐波那契数列——一个函数里要调用自己两次。</p>`,
      starter: `# 递归求斐波那契数\n`,
      hints: ['递归要有"出口"：最小的问题直接返回答案，想想 n 是 0 或 1 时返回什么。', '示例里函数调用自己一次，这次要调用两次，把它们加起来。', '最后调用这个函数，喂进去 6，再把结果输出。'],
      quiz: { question: '递归函数必须有的是什么？', options: ['一个出口（结束条件）', '很多参数', 'while 循环', '文件操作'], answer: 0, explain: '对！没有出口就会无限调用下去，程序停不了。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bfib\s*\(/.test(code) || !/fib\s*\(\s*n\s*-\s*1/.test(code) || !/fib\s*\(\s*n\s*-\s*2/.test(code)) return { passed: false, message: '递归要在函数里调用自己两次，也就是用 n - 1 和 n - 2 各调一次。' };
        if (!outHas(r, '8')) return { passed: false, message: 'fib(6) 应该是 8，检查一下出口和相加那一行。' };
        return ok('厉害！示例递归只调用自己一次，你调用了两次——递归的套路你真的懂了。');
      }
    },
    19: {
      task: `<p>定义一个类 <code class="inline">Book</code>：用 __init__ 接收书名 title 存到对象自己身上；写一个 <code class="inline">show</code> 方法，输出 <code class="inline">书名 + "这本书"</code>。</p><p>然后创建 <code class="inline">b = Book("Python入门")</code>，调用 <code class="inline">b.show()</code>，期望输出 <code class="inline">Python入门这本书</code>。</p>`,
      starter: `# 定义 Book 类\n`,
      hints: ['定义图纸用 class 名字:，名字换成题目要求的。', '__init__ 是"出厂装配"，把传进来的书名贴到对象自己身上。', '方法里用存好的书名拼出介绍，调用方法时不用你传 self。'],
      quiz: { question: '方法里的 self 指的是什么？', options: ['这个对象自己', '类别的名字', '一个数字', '没有作用'], answer: 0, explain: '对！self 代表"这个对象自己"，靠它访问自己的属性。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bclass\s+Book\b/.test(code)) return { passed: false, message: '要用 class 定义书的类。' };
        if (!/self\s*\.\s*title/.test(code)) return { passed: false, message: '要用 self.title 把书名存到对象自己身上。' };
        if (!outHas(r, 'Python入门这本书')) return { passed: false, message: '调用 show 方法应该输出"Python入门这本书"，检查一下方法里的拼接。' };
        return ok('很好！示例造的是狗，你造的是书——图纸和对象的套路你已经入门了。');
      }
    },
    20: {
      task: `<p>完成<strong>费用打卡工具</strong>。测试时输入新项目 <code class="inline">午餐</code> 和金额 <code class="inline">20</code>。</p><ul class="mini-list"><li>字典 costs 先放两个项目：<code class="inline">早餐</code> 对应 <code class="inline">"10"</code>、<code class="inline">车费</code> 对应 <code class="inline">"5"</code>（金额都用引号包成文字，跟示例里的单词本一样）；</li><li>输入新项目和金额，加进字典；</li><li>用 for 循环把所有项目写进 <code class="inline">花费.txt</code>，每个一行，格式 <code class="inline">项目=金额</code>；</li><li>再打开文件，把整本内容读出来显示（要能看到早餐、车费、午餐三行）。</li></ul>`,
      starter: `# 你的费用打卡工具，从这里开始\n`,
      stdin: { value: '午餐\n20', tip: '新项目和金额，一行一个：', multiline: true },
      hints: ['先建好字典，把两个初始项目放进去。', '输入的新项目和金额，要像示例演示的那样加进字典。', '把每个项目写成一行存进文件，要用 for 挨个走一遍字典——示例只写了一行，循环得自己搭。', '写完合上本子，再用 "r" 打开读出来复习。'],
      quiz: { question: '遍历字典时，for key in costs 里的 key 是什么？', options: ['每个值（金额）', '每个钥匙（项目）', '数字序号', '文件名'], answer: 1, explain: '对！key 是每个钥匙，也就是项目，再用 costs[key] 取金额。' },
      check: function (r, code) {
        if (!r.ok) return runFail(r);
        if (!/\bfor\b/.test(code) || !/open\s*\(/.test(code)) return { passed: false, message: '项目要用 for 循环遍历，还要用 open 把内容存进文件。' };
        const c = fileContent(r, '花费.txt') || '';
        if (c.indexOf('早餐=10') === -1 || c.indexOf('午餐=20') === -1) return { passed: false, message: '文件里应该有早餐、车费、午餐三行，检查一下循环写入的格式。' };
        if (!outHas(r, '早餐')) return { passed: false, message: '文件写好了，但还没读出来显示，最后用 open(..., "r") 加 read() 再 print。' };
        return ok('恭喜！你独立完成了费用打卡工具——终极项目换个主题，你照样能做出来。从零基础走到这里，非常了不起！');
      }
    }
  };
  LEVELS.forEach(function (lv) { if (ALTS[lv.id]) lv.alt = ALTS[lv.id]; });

  global.LEVELS = LEVELS;
})(typeof window !== 'undefined' ? window : globalThis);
