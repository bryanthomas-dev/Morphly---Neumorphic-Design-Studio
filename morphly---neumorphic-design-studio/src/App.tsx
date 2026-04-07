import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Copy, 
  Save, 
  Trash2, 
  LogOut, 
  LogIn, 
  Settings, 
  Layers, 
  Maximize, 
  Palette,
  Github,
  Check,
  ChevronRight,
  Search,
  User as UserIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc, 
  doc,
  User
} from './firebase';

// --- Types ---
type Shape = 'flat' | 'concave' | 'convex' | 'pressed';
type Direction = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type ContentType = 'button' | 'card' | 'input' | 'empty';

interface Design {
  id: string;
  userId: string;
  name: string;
  color: string;
  size: number;
  radius: number;
  dist: number;
  blur: number;
  intensity: number;
  shape: Shape;
  direction: Direction;
  createdAt: any;
}

// --- Utils ---
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

// --- Components ---
export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Studio State
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

  // --- Effects ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedDesigns([]);
      return;
    }
    const q = query(collection(db, 'designs'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const designs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Design));
      setSavedDesigns(designs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return unsubscribe;
  }, [user]);

  // --- Handlers ---
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Logged in successfully!');
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no need to show a generic "Login failed" error.
        return;
      }
      console.error(err);
      showToast('Login failed.');
    }
  };

  const handleLogout = () => signOut(auth);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!user) {
      showToast('Please login to save designs.');
      return;
    }
    try {
      await addDoc(collection(db, 'designs'), {
        userId: user.uid,
        name: `Design ${savedDesigns.length + 1}`,
        color, size, radius, dist, blur, intensity, shape, direction,
        createdAt: serverTimestamp()
      });
      showToast('Design saved!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'designs', id));
      showToast('Design deleted.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    showToast('Generating PNG...');
    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: color,
        scale: 2,
        logging: false
      });
      const link = document.createElement('a');
      link.download = 'morphly-design.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Exported!');
    } catch (err) {
      console.error(err);
      showToast('Export failed.');
    }
  };

  const copyCSS = () => {
    const { shadow, x1, y1, x2, y2, dark, light } = getShadow(color, dist, blur, intensity, direction, shape);
    const inset = shape === 'pressed' ? 'inset ' : '';
    const bgVal = shape === 'concave' ? `linear-gradient(145deg, ${colorLuminance(color, -0.1)}, ${colorLuminance(color, 0.1)})` :
                  shape === 'convex' ? `linear-gradient(145deg, ${colorLuminance(color, 0.1)}, ${colorLuminance(color, -0.1)})` : color;
    
    const css = `border-radius: ${radius}px;
background: ${bgVal};
box-shadow: ${inset}${x1}px ${y1}px ${blur}px ${dark},
            ${inset}${x2}px ${y2}px ${blur}px ${light};`;
    
    navigator.clipboard.writeText(css);
    showToast('CSS copied!');
  };

  const loadDesign = (d: Design) => {
    setColor(d.color);
    setSize(d.size);
    setRadius(d.radius);
    setDist(d.dist);
    setBlur(d.blur);
    setIntensity(d.intensity);
    setShape(d.shape);
    setDirection(d.direction);
    showToast('Design loaded.');
  };

  const addToPalette = (c: string) => {
    if (paletteHistory.includes(c)) return;
    setPaletteHistory(prev => [c, ...prev.slice(0, 7)]);
  };

  // --- Render Helpers ---
  const { shadow } = getShadow(color, dist, blur, intensity, direction, shape);
  const bgStyle = shape === 'concave' ? `linear-gradient(145deg, ${colorLuminance(color, -0.1)}, ${colorLuminance(color, 0.1)})` :
                  shape === 'convex' ? `linear-gradient(145deg, ${colorLuminance(color, 0.1)}, ${colorLuminance(color, -0.1)})` : color;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#e8e8ec]">Loading Morphly...</div>;

  return (
    <div className="min-h-screen bg-[#e8e8ec] text-[#1a1a2e] font-sans pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-10 py-4 backdrop-blur-md bg-white/40 border-b border-white/70">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-extrabold tracking-tighter">Morph<span className="text-[#6c63ff]">ly</span></h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Studio</span>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold">{user.displayName}</span>
                <button onClick={handleLogout} className="text-[10px] font-bold text-gray-500 hover:text-red-500 transition-colors">LOGOUT</button>
              </div>
              <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-[#6c63ff] text-white rounded-full text-sm font-bold shadow-lg shadow-[#6c63ff]/30 hover:opacity-90 transition-opacity"
            >
              <LogIn size={16} /> Login with Google
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">Design <span className="text-[#6c63ff]">neumorphic</span> elements.</h2>
          <p className="text-gray-500 text-lg">Customize, compare, and export professional UI components.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          
          {/* Left Column: Preview */}
          <div className="preview-panel rounded-[32px] p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Live Preview</span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-gray-500">COMPARE ALL</label>
                <button 
                  onClick={() => setCompare(!compare)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${compare ? 'bg-[#6c63ff]' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${compare ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="min-h-[400px] flex items-center justify-center relative">
              {compare ? (
                <div className="grid grid-cols-2 gap-8 w-full p-4">
                  {(['flat', 'concave', 'convex', 'pressed'] as Shape[]).map(s => (
                    <div key={s} className="flex flex-col items-center gap-3">
                      <span className="text-[10px] font-bold uppercase text-gray-400">{s}</span>
                      <div 
                        style={{
                          width: 140, height: 140, borderRadius: radius * (140/size),
                          background: s === 'concave' ? `linear-gradient(145deg, ${colorLuminance(color, -0.1)}, ${colorLuminance(color, 0.1)})` :
                                      s === 'convex' ? `linear-gradient(145deg, ${colorLuminance(color, 0.1)}, ${colorLuminance(color, -0.1)})` : color,
                          boxShadow: getShadow(color, dist * 0.6, blur * 0.6, intensity, direction, s).shadow
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div ref={previewRef} className="w-full h-full flex items-center justify-center relative">
                  {/* Corner Selectors */}
                  <div className="absolute inset-0 pointer-events-none">
                    {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as Direction[]).map(dir => (
                      <button
                        key={dir}
                        onClick={() => setDirection(dir)}
                        className={`absolute w-6 h-6 pointer-events-auto transition-opacity ${direction === dir ? 'opacity-100' : 'opacity-30'} ${
                          dir === 'top-left' ? 'top-4 left-4 border-t-2 border-l-2' :
                          dir === 'top-right' ? 'top-4 right-4 border-t-2 border-r-2' :
                          dir === 'bottom-left' ? 'bottom-4 left-4 border-b-2 border-l-2' :
                          'bottom-4 right-4 border-b-2 border-r-2'
                        } border-[#6c63ff] rounded-sm`}
                      />
                    ))}
                  </div>

                  <motion.div 
                    layout
                    style={{
                      width: size,
                      height: size,
                      borderRadius: radius,
                      background: bgStyle,
                      boxShadow: shadow,
                    }}
                    className="flex items-center justify-center overflow-hidden"
                  >
                    {content === 'button' && <span className="font-bold text-lg select-none" style={{ color }}>Click me</span>}
                    {content === 'card' && (
                      <div className="p-6 w-full text-left">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">REVENUE</div>
                        <div className="text-3xl font-black" style={{ color }}>$24,800</div>
                        <div className="text-xs text-gray-400 mt-1">↑ 12% this month</div>
                      </div>
                    )}
                    {content === 'input' && (
                      <div className="flex items-center gap-3 px-5 py-3 w-[85%] rounded-xl bg-white/10">
                        <Search size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-400">Search...</span>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2">
                {(['button', 'card', 'input', 'empty'] as ContentType[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setContent(c)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${content === c ? 'bg-[#6c63ff] text-white' : 'bg-white/50 text-gray-500 hover:bg-white'}`}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleExport}
                  className="flex-1 py-3 bg-gradient-to-br from-[#6c63ff] to-[#8b83ff] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#6c63ff]/30 hover:scale-[1.02] transition-transform"
                >
                  <Download size={18} /> Export PNG
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 bg-white/60 text-[#6c63ff] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-white hover:bg-white transition-colors"
                >
                  <Save size={18} /> Save
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="flex flex-col gap-6">
            
            {/* Color & Palette */}
            <div className="control-card rounded-[24px] p-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4 block">Color</span>
              <div className="flex items-center gap-4 mb-6">
                <input 
                  type="color" 
                  value={color} 
                  onChange={(e) => { setColor(e.target.value); addToPalette(e.target.value); }}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-transparent"
                />
                <input 
                  type="text" 
                  value={color.toUpperCase()} 
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 bg-white/50 border border-black/10 rounded-xl px-4 py-2 font-mono text-sm font-bold focus:outline-none focus:border-[#6c63ff]"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Recent Colors</span>
              <div className="flex flex-wrap gap-2">
                {paletteHistory.map((c, i) => (
                  <button 
                    key={i} 
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className="w-8 h-8 rounded-lg border-2 border-white shadow-sm hover:scale-110 transition-transform"
                  />
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="control-card rounded-[24px] p-6 flex flex-col gap-5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Dimensions</span>
              
              {[
                { label: 'Size', val: size, min: 60, max: 320, set: setSize, unit: 'px' },
                { label: 'Radius', val: radius, min: 0, max: 160, set: setRadius, unit: 'px' },
                { label: 'Distance', val: dist, min: 5, max: 50, set: setDist, unit: 'px' },
                { label: 'Blur', val: blur, min: 0, max: 100, set: setBlur, unit: 'px' },
                { label: 'Intensity', val: intensity, min: 0.01, max: 0.6, step: 0.01, set: setIntensity, unit: '' },
              ].map(s => (
                <div key={s.label} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">{s.label}</span>
                    <span className="text-xs font-mono font-bold text-[#6c63ff]">{s.val}{s.unit}</span>
                  </div>
                  <input 
                    type="range" 
                    min={s.min} max={s.max} step={s.step || 1} 
                    value={s.val} 
                    onChange={(e) => s.set(parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>

            {/* Shape Selector */}
            <div className="control-card rounded-[24px] p-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4 block">Shape</span>
              <div className="grid grid-cols-4 gap-2">
                {(['flat', 'concave', 'convex', 'pressed'] as Shape[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setShape(s)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${shape === s ? 'bg-[#6c63ff] border-[#6c63ff] text-white' : 'bg-white/50 border-black/5 text-gray-500 hover:bg-white'}`}
                  >
                    <div className={`w-6 h-3 border-2 border-current rounded-sm ${s === 'concave' ? 'rounded-b-lg' : s === 'convex' ? 'rounded-t-lg' : ''}`} />
                    <span className="text-[9px] font-bold uppercase">{s}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Output */}
            <div className="control-card rounded-[24px] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">CSS Output</span>
                <button onClick={copyCSS} className="p-2 bg-[#6c63ff] text-white rounded-lg hover:opacity-90 transition-opacity">
                  <Copy size={14} />
                </button>
              </div>
              <div className="code-wrap rounded-xl p-4 overflow-hidden">
                <pre className="text-[11px]">
                  <span className="prop">border-radius</span>: <span className="val">{radius}px</span>;<br />
                  <span className="prop">background</span>: <span className="val">{bgStyle.length > 20 ? 'linear-gradient(...)' : bgStyle}</span>;<br />
                  <span className="prop">box-shadow</span>: <span className="val">{shadow.split(',')[0]}</span>,<br />
                  <span className="val pl-24">{shadow.split(',')[1]}</span>;
                </pre>
              </div>
            </div>

            {/* Saved Designs */}
            {user && (
              <div className="control-card rounded-[24px] p-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4 block">Saved Designs ({savedDesigns.length})</span>
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {savedDesigns.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-xs italic">No designs saved yet.</div>
                  ) : (
                    savedDesigns.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white group">
                        <button 
                          onClick={() => loadDesign(d)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <div 
                            style={{ backgroundColor: d.color, borderRadius: 6, boxShadow: '2px 2px 5px rgba(0,0,0,0.1)' }} 
                            className="w-8 h-8 flex-shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold truncate max-w-[120px]">{d.name}</span>
                            <span className="text-[9px] text-gray-400 uppercase font-bold">{d.shape}</span>
                          </div>
                        </button>
                        <button 
                          onClick={() => handleDelete(d.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#1a1a2e] text-white rounded-2xl font-bold text-sm shadow-2xl z-[100] flex items-center gap-3"
          >
            <Check size={18} className="text-[#6c63ff]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-20 text-center py-10 border-t border-black/5">
        <div className="flex items-center justify-center gap-6 mb-4">
          <a href="#" className="text-gray-400 hover:text-[#6c63ff] transition-colors"><Github size={20} /></a>
          <a href="#" className="text-gray-400 hover:text-[#6c63ff] transition-colors font-bold text-sm">Documentation</a>
          <a href="#" className="text-gray-400 hover:text-[#6c63ff] transition-colors font-bold text-sm">Privacy</a>
        </div>
        <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">© 2026 Morphly Neumorphic Studio</p>
      </footer>
    </div>
  );
}
