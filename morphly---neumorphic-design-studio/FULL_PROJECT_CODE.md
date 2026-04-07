# Morphly - Neumorphic Design Studio
## Full Project Code for GitHub

Este arquivo contém todo o código necessário para o projeto. Para usar, separe cada bloco de código em seu respectivo arquivo conforme indicado.

---

### 1. `package.json`
```json
{
  "name": "morphly-neumorphic-studio",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@google/genai": "^1.29.0",
    "firebase": "^10.8.0",
    "html2canvas": "^1.4.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^4.1.14",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

---

### 2. `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    },
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "noEmit": true
  }
}
```

---

### 3. `vite.config.ts`
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
```

---

### 4. `firebase-applet-config.json`
```json
{
  "projectId": "gen-lang-client-0842421557",
  "appId": "1:698349071502:web:23c30c0ab4bcdfaa23addf",
  "apiKey": "AIzaSyBma7-hC9ova6ejZW461DR6nSBQZNB4waA",
  "authDomain": "gen-lang-client-0842421557.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-9a6570a3-ea7f-4af5-815d-df5525f11a97",
  "storageBucket": "gen-lang-client-0842421557.firebasestorage.app",
  "messagingSenderId": "698349071502",
  "measurementId": ""
}
```

---

### 5. `firebase-blueprint.json`
```json
{
  "entities": {
    "UserDesign": {
      "title": "User Design",
      "description": "A neumorphic design saved by a user.",
      "type": "object",
      "properties": {
        "userId": { "type": "string", "description": "The UID of the user who saved the design." },
        "name": { "type": "string", "description": "The name of the design." },
        "color": { "type": "string", "description": "The base hex color." },
        "size": { "type": "number", "description": "The size of the element." },
        "radius": { "type": "number", "description": "The border radius." },
        "dist": { "type": "number", "description": "The shadow distance." },
        "blur": { "type": "number", "description": "The shadow blur." },
        "intensity": { "type": "number", "description": "The shadow intensity." },
        "shape": { "type": "string", "enum": ["flat", "concave", "convex", "pressed"] },
        "direction": { "type": "string", "enum": ["top-left", "top-right", "bottom-left", "bottom-right"] },
        "createdAt": { "type": "string", "format": "date-time" }
      },
      "required": ["userId", "color", "size", "radius", "dist", "blur", "intensity", "shape", "direction", "createdAt"]
    }
  },
  "firestore": {
    "/designs/{designId}": {
      "schema": "UserDesign",
      "description": "Collection of neumorphic designs saved by users."
    }
  }
}
```

---

### 6. `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /designs/{designId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
  }
}
```

---

### 7. `src/main.tsx`
```typescript
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

---

### 8. `src/firebase.ts`
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc };
export type { User };
```

---

### 9. `src/index.css`
```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

:root {
  --bg: #e8e8ec;
  --accent: #6c63ff;
}

body {
  background: var(--bg);
  color: #1a1a2e;
  min-height: 100vh;
}

input[type=range] {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  outline: none;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(108, 99, 255, 0.4);
}
```

---

### 10. `src/App.tsx`
```tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Copy, Save, Trash2, LogIn, Search, Github, Check 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, 
  collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc, User 
} from './firebase';

type Shape = 'flat' | 'concave' | 'convex' | 'pressed';
type Direction = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type ContentType = 'button' | 'card' | 'input' | 'empty';

interface Design {
  id: string; userId: string; name: string; color: string; size: number;
  radius: number; dist: number; blur: number; intensity: number;
  shape: Shape; direction: Direction; createdAt: any;
}

function colorLuminance(hex: string, lum: number): string {
  hex = String(hex).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  let rgb = '#', c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i * 2, 2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)))).toString(16);
    rgb += ('00' + c).substr(c.length);
  }
  return rgb;
}

function getShadow(color: string, dist: number, blur: number, intensity: number, direction: Direction, shape: Shape) {
  const dark = colorLuminance(color, -intensity);
  const light = colorLuminance(color, intensity);
  let x1, y1, x2, y2;
  switch (direction) {
    case 'top-left': x1 = dist; y1 = dist; x2 = -dist; y2 = -dist; break;
    case 'top-right': x1 = -dist; y1 = dist; x2 = dist; y2 = -dist; break;
    case 'bottom-left': x1 = dist; y1 = -dist; x2 = -dist; y2 = dist; break;
    case 'bottom-right': x1 = -dist; y1 = -dist; x2 = dist; y2 = dist; break;
  }
  const inset = shape === 'pressed' ? 'inset ' : '';
  return {
    shadow: `${inset}${x1}px ${y1}px ${blur}px ${dark}, ${inset}${x2}px ${y2}px ${blur}px ${light}`,
    dark, light, x1, y1, x2, y2
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState('#e8e8ec');
  const [size, setSize] = useState(260);
  const [radius, setRadius] = useState(40);
  const [dist, setDist] = useState(20);
  const [blur, setBlur] = useState(40);
  const [intensity, setIntensity] = useState(0.15);
  const [shape, setShape] = useState<Shape>('flat');
  const [direction, setDirection] = useState<Direction>('top-left');
  const [content, setContent] = useState<ContentType>('button');
  const [compare, setCompare] = useState(false);
  const [paletteHistory, setPaletteHistory] = useState<string[]>(['#e8e8ec', '#d5e8f0', '#f0e6d5', '#e5d5f0']);
  const [savedDesigns, setSavedDesigns] = useState<Design[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!user) { setSavedDesigns([]); return; }
    const q = query(collection(db, 'designs'), where('userId', '==', user.uid));
    return onSnapshot(q, (s) => {
      const ds = s.docs.map(d => ({ id: d.id, ...d.data() } as Design));
      setSavedDesigns(ds.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Logado com sucesso!');
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return;
      showToast('Erro ao logar.');
    }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSave = async () => {
    if (!user) return showToast('Faça login para salvar.');
    try {
      await addDoc(collection(db, 'designs'), {
        userId: user.uid, name: `Design ${savedDesigns.length + 1}`,
        color, size, radius, dist, blur, intensity, shape, direction, createdAt: serverTimestamp()
      });
      showToast('Design salvo!');
    } catch { showToast('Erro ao salvar.'); }
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { backgroundColor: color, scale: 2 });
    const link = document.createElement('a');
    link.download = 'morphly.png'; link.href = canvas.toDataURL(); link.click();
    showToast('Exportado!');
  };

  const copyCSS = () => {
    const { shadow, x1, y1, x2, y2, dark, light } = getShadow(color, dist, blur, intensity, direction, shape);
    const inset = shape === 'pressed' ? 'inset ' : '';
    const bg = shape === 'concave' ? `linear-gradient(145deg, ${colorLuminance(color, -0.1)}, ${colorLuminance(color, 0.1)})` :
               shape === 'convex' ? `linear-gradient(145deg, ${colorLuminance(color, 0.1)}, ${colorLuminance(color, -0.1)})` : color;
    navigator.clipboard.writeText(`border-radius: ${radius}px;\nbackground: ${bg};\nbox-shadow: ${inset}${x1}px ${y1}px ${blur}px ${dark}, ${inset}${x2}px ${y2}px ${blur}px ${light};`);
    showToast('CSS Copiado!');
  };

  const { shadow: currentShadow } = getShadow(color, dist, blur, intensity, direction, shape);
  const currentBg = shape === 'concave' ? `linear-gradient(145deg, ${colorLuminance(color, -0.1)}, ${colorLuminance(color, 0.1)})` :
                    shape === 'convex' ? `linear-gradient(145deg, ${colorLuminance(color, 0.1)}, ${colorLuminance(color, -0.1)})` : color;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#e8e8ec]">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#e8e8ec] text-[#1a1a2e] font-sans pb-20">
      <header className="sticky top-0 z-50 flex items-center justify-between px-10 py-4 backdrop-blur-md bg-white/40 border-b border-white/70">
        <h1 className="text-2xl font-extrabold tracking-tighter">Morph<span className="text-[#6c63ff]">ly</span></h1>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold">{user.displayName}</span>
            <button onClick={() => signOut(auth)} className="text-[10px] font-bold text-gray-500">SAIR</button>
          </div>
        ) : (
          <button onClick={handleLogin} className="px-4 py-2 bg-[#6c63ff] text-white rounded-full text-sm font-bold">Login com Google</button>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="bg-white/50 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-white">
          <div className="min-h-[400px] flex items-center justify-center relative" ref={previewRef}>
            <motion.div 
              layout
              style={{ width: size, height: size, borderRadius: radius, background: currentBg, boxShadow: currentShadow }}
              className="flex items-center justify-center"
            >
              {content === 'button' && <span className="font-bold" style={{ color }}>Botão</span>}
              {content === 'input' && <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg"><Search size={14} /><span>Busca...</span></div>}
            </motion.div>
          </div>
          <div className="flex gap-4 mt-8">
            <button onClick={handleExport} className="flex-1 py-3 bg-[#6c63ff] text-white rounded-xl font-bold">Exportar PNG</button>
            <button onClick={handleSave} className="px-6 bg-white rounded-xl font-bold border border-gray-200">Salvar</button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white/50 backdrop-blur-xl rounded-[24px] p-6 border border-white">
            <span className="text-[11px] font-bold uppercase text-gray-500 mb-4 block">Controles</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-12 rounded-lg mb-4" />
            <div className="flex flex-col gap-4">
              {[{ l: 'Size', v: size, s: setSize, min: 60, max: 300 }, { l: 'Radius', v: radius, s: setRadius, min: 0, max: 150 }].map(i => (
                <div key={i.l}><div className="flex justify-between text-xs font-bold"><span>{i.l}</span><span>{i.v}px</span></div><input type="range" min={i.min} max={i.max} value={i.v} onChange={(e) => i.s(parseInt(e.target.value))} className="w-full" /></div>
              ))}
            </div>
            <button onClick={copyCSS} className="w-full mt-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold">Copiar CSS</button>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-bold shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

### 11. `index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Morphly — Neumorphic Design Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
