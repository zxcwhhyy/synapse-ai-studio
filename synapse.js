import confetti from 'canvas-confetti';
import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------
  // 0. TOAST NOTIFICATION SYSTEM
  // -------------------------------------------------------------------
  function showToast(message, icon = '🧠') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg flex items-center gap-2.5';
    toast.innerHTML = `<span class="text-base flex-shrink-0">${icon}</span><span class="leading-tight">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // -------------------------------------------------------------------
  // 1. AMBIENT PARTICLES & NEURAL SYNAPSE CANVAS
  // -------------------------------------------------------------------
  const ambientCanvas = document.getElementById('synapse-ambient-canvas');
  if (ambientCanvas) {
    const actx = ambientCanvas.getContext('2d');
    let aw = ambientCanvas.width = window.innerWidth;
    let ah = ambientCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      aw = ambientCanvas.width = window.innerWidth;
      ah = ambientCanvas.height = window.innerHeight;
    });

    let mousePos = { x: aw / 2, y: ah / 2 };
    window.addEventListener('mousemove', (e) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
    });

    const particles = [];
    for (let i = 0; i < 32; i++) {
      particles.push({
        x: Math.random() * aw,
        y: Math.random() * ah,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.8,
        alpha: Math.random() * 0.35 + 0.15
      });
    }

    function animateAmbient() {
      actx.clearRect(0, 0, aw, ah);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            actx.strokeStyle = `rgba(217, 119, 6, ${0.08 * (1 - dist / 110)})`;
            actx.lineWidth = 0.7;
            actx.beginPath();
            actx.moveTo(particles[i].x, particles[i].y);
            actx.lineTo(particles[j].x, particles[j].y);
            actx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        const dx = mousePos.x - p.x;
        const dy = mousePos.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          p.x += (dx / dist) * 0.15;
          p.y += (dy / dist) * 0.15;
        }

        if (p.x < 0) p.x = aw;
        if (p.x > aw) p.x = 0;
        if (p.y < 0) p.y = ah;
        if (p.y > ah) p.y = 0;

        actx.fillStyle = `rgba(245, 158, 11, ${p.alpha})`;
        actx.beginPath();
        actx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        actx.fill();
      });

      requestAnimationFrame(animateAmbient);
    }
    animateAmbient();
  }

  // -------------------------------------------------------------------
  // 2. PROJECT FILES DATABASE & CODE STATE
  // -------------------------------------------------------------------
  const projectFiles = {
    jwt: {
      name: 'jwt.ts',
      path: 'src/auth/jwt.ts',
      coverage: '94.2%',
      nodesCount: 14,
      symbols: [
        { name: 'signAccessToken()', type: 'Function', color: 'text-purple-400' },
        { name: 'verifyPayload()', type: 'Function', color: 'text-purple-400' },
        { name: 'TokenPayload', type: 'Interface', color: 'text-cyan-400' },
        { name: 'TokenCache', type: 'Class', color: 'text-amber-400' }
      ],
      originalCode: `import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';

export interface TokenPayload {
  userId: string;
  role: 'admin' | 'developer' | 'auditor';
  permissions: string[];
  exp?: number;
}

export class TokenCache {
  private cache = new Map<string, TokenPayload>();

  public set(token: string, payload: TokenPayload): void {
    this.cache.set(token, payload);
  }

  public get(token: string): TokenPayload | undefined {
    return this.cache.get(token);
  }
}

const secretKey = Buffer.from(process.env.JWT_SECRET || 'dev-secret-384-bytes');

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey);

  return jwt;
}

export async function verifyPayload(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secretKey);
  return payload as unknown as TokenPayload;
}`,
      refactoredCode: `import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';

export interface TokenPayload {
  userId: string;
  role: 'admin' | 'developer' | 'auditor';
  permissions: string[];
  exp?: number;
}

// Optimized with automatic 3600s TTL and memory bounds to prevent OOM
export class TokenCache {
  private cache = new Map<string, { payload: TokenPayload; expiresAt: number }>();
  private readonly maxEntries = 5000;

  public set(token: string, payload: TokenPayload, ttlSeconds = 3600): void {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(token, { payload, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  public get(token: string): TokenPayload | undefined {
    const entry = this.cache.get(token);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(token);
      return undefined;
    }
    return entry.payload;
  }
}

const secretKey = Buffer.from(process.env.JWT_SECRET || 'dev-secret-384-bytes');

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey);

  return jwt;
}

export async function verifyPayload(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secretKey);
  return payload as unknown as TokenPayload;
}`,
      diffLines: [
        { type: 'same', text: "import { SignJWT, jwtVerify } from 'jose';" },
        { type: 'same', text: "import { createHash, randomBytes } from 'crypto';" },
        { type: 'same', text: "" },
        { type: 'same', text: "export interface TokenPayload {" },
        { type: 'same', text: "  userId: string;" },
        { type: 'same', text: "  role: 'admin' | 'developer' | 'auditor';" },
        { type: 'same', text: "  permissions: string[];" },
        { type: 'same', text: "  exp?: number;" },
        { type: 'same', text: "}" },
        { type: 'same', text: "" },
        { type: 'del', text: "  private cache = new Map<string, TokenPayload>();" },
        { type: 'add', text: "// Optimized with automatic 3600s TTL and memory bounds to prevent OOM" },
        { type: 'add', text: "  private cache = new Map<string, { payload: TokenPayload; expiresAt: number }>();" },
        { type: 'add', text: "  private readonly maxEntries = 5000;" },
        { type: 'same', text: "" },
        { type: 'del', text: "  public set(token: string, payload: TokenPayload): void {" },
        { type: 'del', text: "    this.cache.set(token, payload);" },
        { type: 'del', text: "  }" },
        { type: 'add', text: "  public set(token: string, payload: TokenPayload, ttlSeconds = 3600): void {" },
        { type: 'add', text: "    if (this.cache.size >= this.maxEntries) {" },
        { type: 'add', text: "      const oldestKey = this.cache.keys().next().value;" },
        { type: 'add', text: "      if (oldestKey) this.cache.delete(oldestKey);" },
        { type: 'add', text: "    }" },
        { type: 'add', text: "    this.cache.set(token, { payload, expiresAt: Date.now() + ttlSeconds * 1000 });" },
        { type: 'add', text: "  }" },
        { type: 'same', text: "" },
        { type: 'same', text: "  public get(token: string): TokenPayload | undefined {" },
        { type: 'add', text: "    const entry = this.cache.get(token);" },
        { type: 'add', text: "    if (!entry) return undefined;" },
        { type: 'add', text: "    if (Date.now() > entry.expiresAt) {" },
        { type: 'add', text: "      this.cache.delete(token);" },
        { type: 'add', text: "      return undefined;" },
        { type: 'add', text: "    }" },
        { type: 'add', text: "    return entry.payload;" },
        { type: 'del', text: "    return this.cache.get(token);" },
        { type: 'same', text: "  }" }
      ]
    },
    payment: {
      name: 'payment.ts',
      path: 'src/services/payment.ts',
      coverage: '91.8%',
      nodesCount: 12,
      symbols: [
        { name: 'handleWebhook()', type: 'Function', color: 'text-purple-400' },
        { name: 'validateSignature()', type: 'Function', color: 'text-purple-400' },
        { name: 'PaymentPayload', type: 'Interface', color: 'text-cyan-400' }
      ],
      originalCode: `import { createHmac } from 'crypto';

export interface PaymentPayload {
  eventId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
}

export function validateSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret);
  const digest = 'v1=' + hmac.update(payload).digest('hex');
  return digest === signature;
}

export async function handleWebhook(body: string, sig: string): Promise<PaymentPayload> {
  const isValid = validateSignature(body, sig, process.env.STRIPE_SECRET || '');
  if (!isValid) throw new Error('Invalid signature');
  return JSON.parse(body);
}`
    },
    synapse: {
      name: 'synapse.ts',
      path: 'src/ai/synapse.ts',
      coverage: '88.5%',
      nodesCount: 16,
      symbols: [
        { name: 'packContext()', type: 'Function', color: 'text-purple-400' },
        { name: 'embedQuery()', type: 'Function', color: 'text-purple-400' },
        { name: 'ContextPayload', type: 'Interface', color: 'text-cyan-400' }
      ],
      originalCode: `export interface ContextPayload {
  query: string;
  files: Array<{ path: string; content: string }>;
  tokenLimit: number;
}

export async function packContext(payload: ContextPayload): Promise<string> {
  let packed = \`System: You are an expert AI software architect.\\n\\n\`;
  let currentTokens = 0;

  for (const file of payload.files) {
    const fileTokens = Math.ceil(file.content.length / 4);
    if (currentTokens + fileTokens > payload.tokenLimit) break;
    packed += \`File: \${file.path}\\n\` + file.content + '\\n\\n';
    currentTokens += fileTokens;
  }

  return packed;
}`
    },
    test: {
      name: 'auth.test.ts',
      path: 'tests/auth.test.ts',
      coverage: '100%',
      nodesCount: 8,
      symbols: [
        { name: 'describe(Auth)', type: 'Test Suite', color: 'text-emerald-400' },
        { name: 'it(signAccessToken)', type: 'Test Case', color: 'text-emerald-400' },
        { name: 'it(verifyPayload)', type: 'Test Case', color: 'text-emerald-400' }
      ],
      originalCode: `import { signAccessToken, verifyPayload } from '../src/auth/jwt';

describe('Auth & JWT Suite', () => {
  it('should sign and verify valid JWT payload', async () => {
    const payload = { userId: 'usr_891', role: 'admin' as const, permissions: ['read', 'write'] };
    const token = await signAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = await verifyPayload(token);
    expect(decoded.userId).toBe('usr_891');
    expect(decoded.role).toBe('admin');
  });

  it('should enforce zero-trust signature check', async () => {
    await expect(verifyPayload('invalid.tampered.token')).rejects.toThrow();
  });
});`
    }
  };

  let currentFileKey = 'jwt';
  let isDiffActive = false;
  let isRefactored = false;

  // -------------------------------------------------------------------
  // 3. SYNTAX HIGHLIGHTER & LINE NUMBER GENERATOR
  // -------------------------------------------------------------------
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function highlightSyntax(code) {
    return code
      .split('\n')
      .map(line => {
        let l = escapeHtml(line);

        // Comments
        if (l.trim().startsWith('//')) {
          return `<span class="syn-comm">${l}</span>`;
        }

        // Keywords
        l = l.replace(/\b(import|export|from|interface|class|private|public|readonly|const|let|var|function|async|await|return|if|else|throw|new|as|type)\b/g, '<span class="syn-kw">$1</span>');

        // Types
        l = l.replace(/\b(string|number|boolean|void|Promise|TokenPayload|Map|Buffer|SignJWT|jwtVerify)\b/g, '<span class="syn-type">$1</span>');

        // Strings
        l = l.replace(/(['"`].*?['"`])/g, '<span class="syn-str">$1</span>');

        // Numbers
        l = l.replace(/\b(\d+)\b/g, '<span class="syn-num">$1</span>');

        return l;
      })
      .join('\n');
  }

  function renderEditor() {
    const file = projectFiles[currentFileKey];
    const editorCode = document.getElementById('editor-code');
    const editorGutter = document.getElementById('editor-gutter');
    const tabFilename = document.getElementById('tab-filename');

    tabFilename.textContent = file.name;
    document.getElementById('metric-coverage').textContent = file.coverage;
    document.getElementById('ast-node-count').textContent = `${file.nodesCount} Nodes`;

    // Render Symbol list
    const symbolList = document.getElementById('ast-symbol-list');
    symbolList.innerHTML = '';
    file.symbols.forEach(s => {
      const item = document.createElement('div');
      item.className = 'p-2 rounded-xl bg-[#120c08] border border-amber-900/30 flex items-center justify-between hover:border-amber-500/40 transition-colors cursor-pointer';
      item.innerHTML = `
        <span class="text-stone-300 font-bold">${s.name}</span>
        <span class="${s.color} text-[10px]">${s.type}</span>
      `;
      item.addEventListener('click', () => {
        showToast(`Inspecting AST symbol: ${s.name}`, '🌲');
      });
      symbolList.appendChild(item);
    });

    if (isDiffActive && file.diffLines) {
      // Render Diff View
      editorGutter.innerHTML = '';
      let diffHtml = '';
      file.diffLines.forEach((line, idx) => {
        const lineNum = idx + 1;
        editorGutter.innerHTML += `<div>${lineNum}</div>`;
        const prefix = line.type === 'add' ? '+ ' : line.type === 'del' ? '- ' : '  ';
        const cls = line.type === 'add' ? 'diff-add' : line.type === 'del' ? 'diff-del' : '';
        diffHtml += `<div class="${cls} px-1">${prefix}${escapeHtml(line.text)}</div>`;
      });
      editorCode.innerHTML = diffHtml;
      document.getElementById('diff-banner').classList.remove('hidden');
      document.getElementById('diff-banner').classList.add('flex');
    } else {
      // Normal Code View
      const codeToDisplay = isRefactored ? (file.refactoredCode || file.originalCode) : file.originalCode;
      const lines = codeToDisplay.split('\n');
      editorGutter.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
      editorCode.innerHTML = highlightSyntax(codeToDisplay);
      document.getElementById('diff-banner').classList.add('hidden');
      document.getElementById('diff-banner').classList.remove('flex');
    }
  }

  // File Tree Clicks
  document.querySelectorAll('.file-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('.file-item').forEach(f => {
        f.classList.remove('bg-amber-500/20', 'border-amber-500/40', 'text-amber-200');
        f.classList.add('text-stone-400');
      });
      const target = e.currentTarget;
      target.classList.add('bg-amber-500/20', 'border-amber-500/40', 'text-amber-200');
      target.classList.remove('text-stone-400');

      currentFileKey = target.getAttribute('data-file');
      isDiffActive = false;
      renderEditor();
      showToast(`Switched active workspace file to: ${projectFiles[currentFileKey].name}`, '📄');
    });
  });

  // -------------------------------------------------------------------
  // 4. DIFF REFACTORING ACTIONS
  // -------------------------------------------------------------------
  function triggerRefactorDiff() {
    if (currentFileKey !== 'jwt') {
      currentFileKey = 'jwt';
      document.querySelector('.file-item[data-file="jwt"]')?.click();
    }
    isDiffActive = true;
    renderEditor();
    showToast('AI Proposed Refactor generated! Review diff in editor.', '⚡');

    // Add Copilot Thought
    const thoughtContent = document.getElementById('thought-content');
    thoughtContent.innerHTML += `
      <p class="text-amber-400">> [Diff Synthesizer] Generated LRU memory bounds and 3600s TTL cache.</p>
    `;
    thoughtContent.scrollTop = thoughtContent.scrollHeight;
  }

  document.getElementById('btn-action-refactor')?.addEventListener('click', triggerRefactorDiff);
  document.getElementById('btn-header-refactor')?.addEventListener('click', triggerRefactorDiff);
  document.getElementById('btn-copilot-quick-fix')?.addEventListener('click', triggerRefactorDiff);

  document.getElementById('btn-accept-diff')?.addEventListener('click', () => {
    isDiffActive = false;
    isRefactored = true;
    renderEditor();

    confetti({
      particleCount: 60,
      spread: 65,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f59e0b', '#ffffff']
    });

    showToast('Refactor diff merged into jwt.ts! Memory bounds active ✓', '✅');
  });

  document.getElementById('btn-reject-diff')?.addEventListener('click', () => {
    isDiffActive = false;
    renderEditor();
    showToast('Diff discarded. Restored original branch.', '✕');
  });

  // -------------------------------------------------------------------
  // 5. INTERACTIVE AST NEURAL TOPOLOGY CANVAS (Canvas 2D)
  // -------------------------------------------------------------------
  const astCanvas = document.getElementById('ast-neural-canvas');
  if (astCanvas) {
    const nctx = astCanvas.getContext('2d');
    let nw = astCanvas.width = astCanvas.parentElement.clientWidth;
    let nh = astCanvas.height = astCanvas.parentElement.clientHeight;

    window.addEventListener('resize', () => {
      nw = astCanvas.width = astCanvas.parentElement.clientWidth;
      nh = astCanvas.height = astCanvas.parentElement.clientHeight;
    });

    const astNodes = [
      { id: 'root', label: 'Program (AST)', x: 40, y: nh / 2, color: '#f59e0b', r: 9 },
      { id: 'jwt', label: 'signAccessToken', x: nw * 0.35, y: nh * 0.3, color: '#38bdf8', r: 7 },
      { id: 'verify', label: 'verifyPayload', x: nw * 0.35, y: nh * 0.7, color: '#c084fc', r: 7 },
      { id: 'cache', label: 'TokenCache', x: nw * 0.65, y: nh * 0.3, color: '#34d399', r: 7 },
      { id: 'crypto', label: 'WebCrypto / HMAC', x: nw * 0.65, y: nh * 0.7, color: '#fb923c', r: 6 },
      { id: 'enclave', label: 'Zero-Trust Enclave', x: nw * 0.9, y: nh / 2, color: '#10b981', r: 8 }
    ];

    const astEdges = [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 4 },
      { from: 3, to: 5 },
      { from: 4, to: 5 }
    ];

    let packets = [];
    for (let i = 0; i < 8; i++) {
      packets.push({
        edgeIdx: Math.floor(Math.random() * astEdges.length),
        progress: Math.random(),
        speed: 0.008 + Math.random() * 0.006
      });
    }

    function renderAstCanvas() {
      nctx.clearRect(0, 0, nw, nh);

      // Re-center nodes dynamically on resize
      astNodes[0].y = nh / 2;
      astNodes[1].x = nw * 0.35; astNodes[1].y = nh * 0.3;
      astNodes[2].x = nw * 0.35; astNodes[2].y = nh * 0.7;
      astNodes[3].x = nw * 0.65; astNodes[3].y = nh * 0.3;
      astNodes[4].x = nw * 0.65; astNodes[4].y = nh * 0.7;
      astNodes[5].x = nw * 0.88; astNodes[5].y = nh / 2;

      // Draw Edges (curved synapses)
      astEdges.forEach(edge => {
        const n0 = astNodes[edge.from];
        const n1 = astNodes[edge.to];
        const cx = (n0.x + n1.x) / 2;

        nctx.beginPath();
        nctx.moveTo(n0.x, n0.y);
        nctx.bezierCurveTo(cx, n0.y, cx, n1.y, n1.x, n1.y);
        nctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
        nctx.lineWidth = 1.5;
        nctx.stroke();
      });

      // Draw Moving Neural Packets
      packets.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.edgeIdx = Math.floor(Math.random() * astEdges.length);
        }

        const edge = astEdges[p.edgeIdx];
        const n0 = astNodes[edge.from];
        const n1 = astNodes[edge.to];
        const cx = (n0.x + n1.x) / 2;

        const t = p.progress;
        const px = Math.pow(1 - t, 3) * n0.x + 3 * Math.pow(1 - t, 2) * t * cx + 3 * (1 - t) * Math.pow(t, 2) * cx + Math.pow(t, 3) * n1.x;
        const py = Math.pow(1 - t, 3) * n0.y + 3 * Math.pow(1 - t, 2) * t * n0.y + 3 * (1 - t) * Math.pow(t, 2) * n1.y + Math.pow(t, 3) * n1.y;

        nctx.beginPath();
        nctx.arc(px, py, 2.5, 0, Math.PI * 2);
        nctx.fillStyle = '#f59e0b';
        nctx.shadowColor = '#f59e0b';
        nctx.shadowBlur = 8;
        nctx.fill();
        nctx.shadowBlur = 0;
      });

      // Draw Nodes
      astNodes.forEach(node => {
        nctx.beginPath();
        nctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        nctx.fillStyle = node.color;
        nctx.shadowColor = node.color;
        nctx.shadowBlur = 10;
        nctx.fill();
        nctx.strokeStyle = '#ffffff';
        nctx.lineWidth = 1.5;
        nctx.stroke();
        nctx.shadowBlur = 0;

        // Label
        nctx.fillStyle = '#d6d3d1';
        nctx.font = '10px "Fira Code", monospace';
        nctx.textAlign = 'center';
        nctx.fillText(node.label, node.x, node.y - 12);
      });

      requestAnimationFrame(renderAstCanvas);
    }
    renderAstCanvas();

    // Node click
    astCanvas.addEventListener('click', (e) => {
      const rect = astCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      astNodes.forEach(n => {
        const d = Math.sqrt((mx - n.x) ** 2 + (my - n.y) ** 2);
        if (d <= n.r + 5) {
          showToast(`AST Node Selected: ${n.label} (Cyclomatic Complexity: 1)`, '🌲');
        }
      });
    });
  }

  // -------------------------------------------------------------------
  // 6. BOTTOM EXECUTION TERMINAL & JEST TEST SUITE
  // -------------------------------------------------------------------
  const terminalOutput = document.getElementById('terminal-output');

  function runJestTestSuite() {
    terminalOutput.innerHTML = `
      <div class="text-stone-500">> jest --runInBand --colors tests/auth.test.ts</div>
      <div class="text-amber-400 animate-pulse">> Running automated test runner v29.7.0...</div>
    `;

    setTimeout(() => {
      terminalOutput.innerHTML += `
        <div class="text-emerald-400 font-bold">PASS tests/auth.test.ts (142ms)</div>
        <div class="pl-3 text-stone-300">
          <div><span class="text-emerald-400 font-bold">✓</span> should sign and verify valid JWT payload <span class="text-stone-500">(14ms)</span></div>
          <div><span class="text-emerald-400 font-bold">✓</span> should enforce zero-trust signature check <span class="text-stone-500">(8ms)</span></div>
          <div><span class="text-emerald-400 font-bold">✓</span> should evict expired tokens with 3600s TTL <span class="text-stone-500">(22ms)</span></div>
          <div><span class="text-emerald-400 font-bold">✓</span> should reject tampered HMAC digests <span class="text-stone-500">(16ms)</span></div>
        </div>
        <div class="pt-2 text-stone-400 text-[10px] border-t border-stone-800">
          <div>Test Suites: <span class="text-emerald-400 font-bold">1 passed</span>, 1 total</div>
          <div>Tests:       <span class="text-emerald-400 font-bold">4 passed</span>, 4 total</div>
          <div>Snapshots:   <span class="text-emerald-400 font-bold">2 passed</span>, 2 total</div>
          <div>Time:        0.284 s, estimated 1 s</div>
          <div class="text-emerald-300 font-bold pt-1">Ran all test suites matching /auth/i.</div>
        </div>
      `;
      terminalOutput.scrollTop = terminalOutput.scrollHeight;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#f59e0b', '#38bdf8']
      });

      showToast('All 4 unit tests passed with 100% assertion coverage!', '🧪');
    }, 600);
  }

  document.getElementById('btn-run-tests')?.addEventListener('click', runJestTestSuite);
  document.getElementById('btn-action-gentests')?.addEventListener('click', runJestTestSuite);

  document.getElementById('btn-clear-terminal')?.addEventListener('click', () => {
    terminalOutput.innerHTML = '<div class="text-stone-500">> Console cleared.</div>';
  });

  // Terminal Tab Switching
  document.querySelectorAll('.term-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.term-tab-btn').forEach(b => {
        b.classList.remove('bg-amber-500', 'text-stone-950', 'font-bold');
        b.classList.add('text-stone-400');
      });
      const target = e.currentTarget;
      target.classList.remove('text-stone-400');
      target.classList.add('bg-amber-500', 'text-stone-950', 'font-bold');

      const mode = target.getAttribute('data-term');
      if (mode === 'test') {
        runJestTestSuite();
      } else if (mode === 'terminal') {
        terminalOutput.innerHTML = `
          <div class="text-stone-400">> zsh --login (synapse-dev-workspace)</div>
          <div class="text-stone-300">> git status</div>
          <div class="text-emerald-400">On branch main, working tree clean. AST cache synchronized.</div>
          <div class="text-stone-400">> _</div>
        `;
      } else if (mode === 'audit') {
        terminalOutput.innerHTML = `
          <div class="text-stone-400">> npm audit --omit=dev</div>
          <div class="text-emerald-400 font-bold">found 0 vulnerabilities in 84 scanned packages</div>
          <div class="text-stone-400">> Zero-Trust validation: PASS (SHA3-512 valid)</div>
        `;
      }
    });
  });

  // -------------------------------------------------------------------
  // 7. AI COPILOT & STREAMING REASONING
  // -------------------------------------------------------------------
  const modelSelect = document.getElementById('model-select');
  const copilotModelLabel = document.getElementById('copilot-model-label');
  const telemetrySpeed = document.getElementById('telemetry-speed');
  const telemetryTokens = document.getElementById('telemetry-tokens');

  const modelSpecs = {
    'claude-3-7': { name: 'Claude 3.7 Sonnet', speed: '86 tok/s', tokens: '18,420' },
    'deepseek-r1': { name: 'DeepSeek R1 (Reasoner)', speed: '62 tok/s', tokens: '24,180' },
    'gpt-4-5': { name: 'GPT-4.5 Turbo', speed: '98 tok/s', tokens: '16,200' },
    'gemini-2-5': { name: 'Gemini 2.5 Pro', speed: '112 tok/s', tokens: '32,450' }
  };

  modelSelect?.addEventListener('change', (e) => {
    const spec = modelSpecs[e.target.value] || modelSpecs['claude-3-7'];
    copilotModelLabel.textContent = spec.name;
    telemetrySpeed.textContent = spec.speed;
    telemetryTokens.textContent = spec.tokens;
    showToast(`Switched inference model to: ${spec.name}`, '🤖');
  });

  // Toggle Thought Stream Collapse
  const toggleThoughtBtn = document.getElementById('toggle-thought-btn');
  const thoughtContent = document.getElementById('thought-content');
  const thoughtChevron = document.getElementById('thought-chevron');

  toggleThoughtBtn?.addEventListener('click', () => {
    const isHidden = thoughtContent.classList.contains('hidden');
    thoughtContent.classList.toggle('hidden', !isHidden);
    thoughtChevron.textContent = isHidden ? '▼' : '▲';
  });

  // Chat Form & Prompt Chips
  const copilotForm = document.getElementById('copilot-input-form');
  const copilotInput = document.getElementById('copilot-input');
  const chatStream = document.getElementById('copilot-chat-stream');

  function submitPrompt(promptText) {
    if (!promptText) return;

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'p-3 rounded-2xl bg-[#1d140e] border border-amber-500/30 text-xs space-y-1 text-right';
    userMsg.innerHTML = `
      <div class="text-[10px] text-amber-400 font-bold">You</div>
      <p class="text-stone-200 text-left">${escapeHtml(promptText)}</p>
    `;
    chatStream.appendChild(userMsg);
    copilotInput.value = '';
    chatStream.scrollTop = chatStream.scrollHeight;

    // Simulate AI Thought Stream
    thoughtContent.innerHTML += `
      <p class="text-amber-300">> Analyzing request: "${escapeHtml(promptText.slice(0, 35))}..."</p>
      <p>> Synthesizing AST nodes & verifying TypeScript constraints...</p>
    `;
    thoughtContent.scrollTop = thoughtContent.scrollHeight;

    // Simulate AI Response
    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'p-3.5 rounded-2xl bg-[#140e0a] border border-amber-900/30 space-y-2 text-xs leading-relaxed';
      botMsg.innerHTML = `
        <div class="flex items-center justify-between text-[10px] text-stone-400">
          <span class="text-amber-400 font-bold">Synapse Assistant</span>
          <span>Just now</span>
        </div>
        <p class="text-stone-300">
          I analyzed your request. The optimal implementation adheres to strict memory bounds with LRU caching.
        </p>
        <div class="pt-1 flex gap-2">
          <button class="btn-chat-apply px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] transition-colors">
            ⚡ Apply to ${projectFiles[currentFileKey].name}
          </button>
        </div>
      `;
      botMsg.querySelector('.btn-chat-apply')?.addEventListener('click', triggerRefactorDiff);
      chatStream.appendChild(botMsg);
      chatStream.scrollTop = chatStream.scrollHeight;
    }, 650);
  }

  copilotForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitPrompt(copilotInput.value.trim());
  });

  copilotInput?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submitPrompt(copilotInput.value.trim());
    }
  });

  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      submitPrompt(prompt);
    });
  });

  // Action Bar Buttons
  document.getElementById('btn-action-explain')?.addEventListener('click', () => {
    submitPrompt(`Explain architecture and security model of ${projectFiles[currentFileKey].name}`);
  });
  document.getElementById('btn-action-security')?.addEventListener('click', () => {
    document.querySelector('.term-tab-btn[data-term="audit"]')?.click();
    showToast('Running Zero-Trust Security Vulnerability Audit...', '🔒');
  });

  // -------------------------------------------------------------------
  // 8. INITIALIZATION
  // -------------------------------------------------------------------
  renderEditor();
  runJestTestSuite();
  showToast('Synapse AI Developer Workspace v3.1 Ready', '🧠');
});

