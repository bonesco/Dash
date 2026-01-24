import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Check,
  Calendar,
  Clock,
  MoreHorizontal,
  GripVertical,
  Plus,
  Command,
  Search,
  Inbox,
  Zap,
  ArrowRight,
  Sparkles,
  Loader2,
  CornerDownRight,
  Layout,
  Target,
  History,
  X,
  Trash2,
  ListFilter,
  Settings as SettingsIcon,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoPreview } from './VideoPreview';

// --- FIREBASE IMPORTS AND SETUP ---
// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase SDK stub (these must be installed in a real environment)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, orderBy, deleteDoc, runTransaction } from 'firebase/firestore';

let app, auth, db;

// --- GEMINI API SETUP ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; // API Key from environment

// Helper for Gemini API calls with backoff
const callGemini = async (prompt, schemaType = "ARRAY") => {
  const delays = [1000, 2000, 4000, 8000, 16000];

  for (let i = 0; i <= delays.length; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: schemaType === "ARRAY" ? {
                type: "ARRAY",
                items: { type: "STRING" }
              } : {
                type: "OBJECT",
                properties: {
                  sortedIds: { type: "ARRAY", items: { type: "STRING" } },
                  newTitle: { "type": "STRING" }
                }
              }
            }
          })
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
      if (i === delays.length) throw error;
      console.warn(`Gemini API call failed, retrying in ${delays[i]}ms...`);
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

// --- CONSTANTS ---
const TIME_PATTERNS = [
  /\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i,
  /\b(?:at\s+)(\d{1,2}(?::\d{2})?)\b/i,
];

const STATIC_KEYWORDS = {
  tomorrow: { label: 'Tomorrow', color: 'text-orange-400' },
  today: { label: 'Today', color: 'text-emerald-400' },
  urgent: { label: 'Urgent', color: 'text-red-500', priority: 'High' },
  next_week: { label: 'Next Week', color: 'text-purple-400' },
};

// --- PARSING LOGIC (Moved outside component for global availability) ---
const parseInput = (text, defaultPriority) => {
    let cleanText = text;
    let dueDate = null;
    let priority = defaultPriority;
    let extractedTime = null;
    const tags = [];

    // 1. Static Keywords (Urgent, Tomorrow, Today)
    Object.keys(STATIC_KEYWORDS).forEach(key => {
      const phrase = key.replace('_', ' ');
      const regex = new RegExp(`\\b${phrase}\\b`, 'i');
      if (regex.test(cleanText)) {
        cleanText = cleanText.replace(regex, "").trim();
        const keyword = STATIC_KEYWORDS[key];

        if (keyword.priority) priority = keyword.priority;
        else dueDate = keyword.label;

        tags.push({
          label: keyword.priority ? keyword.label.toUpperCase() : keyword.label.split(' ')[0].toUpperCase(),
          color: keyword.color,
          icon: keyword.priority ? Zap : Calendar
        });
      }
    });

    // 2. Time Patterns
    TIME_PATTERNS.forEach(pattern => {
      const match = cleanText.match(pattern);
      if (match) {
        cleanText = cleanText.replace(pattern, "").replace(/\s+/, " ").trim();
        extractedTime = match[1];

        // Add time tag only if a time was detected and a date wasn't already parsed from static keywords
        if (extractedTime && !tags.some(t => t.icon === Clock && t.label === extractedTime.toUpperCase())) {
             tags.push({ label: extractedTime.toUpperCase(), color: 'text-sky-400', icon: Clock });
        }
      }
    });

    // 3. Final Metadata
    const finalDue = extractedTime ? (dueDate ? `${dueDate} @ ${extractedTime}` : `Today @ ${extractedTime}`) : dueDate;

    // Filter out duplicate tags
    const uniqueTags = tags.filter((tag, index, self) =>
      index === self.findIndex((t) => (t.label === tag.label && t.icon === tag.icon))
    );

    return { cleanText, due: finalDue, priority, tags: uniqueTags };
};


// --- COMPONENTS ---

const LinearCheckbox = ({ checked, onChange, size = "md" }) => {
  return (
    <motion.div
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      animate={{ scale: checked ? 1 : 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`
        rounded-[4px] border cursor-pointer flex items-center justify-center transition-all duration-200
        ${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
        ${checked
          ? 'bg-indigo-500 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
          : 'bg-white/5 border-white/10 hover:border-white/30'}
      `}
    >
      {checked && <Check size={size === "sm" ? 8 : 10} className="text-white stroke-[3]" />}
    </motion.div>
  );
};


const TagPill = ({ label, color, icon: Icon = Calendar }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 ${color} shadow-sm`}
  >
    <Icon size={10} />
    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">{label}</span>
  </motion.div>
);

// Detail View Modal Component
const TaskDetailModal = ({ task, onClose, updateTask, deleteSubtask, settings }) => {
  const [localTitle, setLocalTitle] = useState(task.title);
  const [localDue, setLocalDue] = useState(task.due || '');
  const [localPriority, setLocalPriority] = useState(task.priority || 'Low');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Save changes on title blur
  const handleTitleBlur = () => {
    if (localTitle.trim() !== task.title) {
      updateTask(task.id, { title: localTitle.trim() });
    }
  };

  // Save changes on metadata change
  const handleMetadataChange = (key, value) => {
    updateTask(task.id, { [key]: value });
  };

  const handleAddSubtask = (e) => {
    if (e.key === 'Enter' && newSubtaskTitle.trim()) {
      const newSubtask = {
        id: Math.random().toString(36).substr(2, 9),
        title: newSubtaskTitle.trim(),
        status: 'todo'
      };
      updateTask(task.id, { subtasks: [...task.subtasks, newSubtask] });
      setNewSubtaskTitle('');
    }
  };

  const toggleSubtask = (subtaskId) => {
    const newSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, status: st.status === 'done' ? 'todo' : 'done' } : st
    );
    updateTask(task.id, { subtasks: newSubtasks });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-[#101113] border-l border-white/[0.08] shadow-2xl z-50 flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-4 border-b border-white/[0.06] flex-shrink-0">
        <h2 className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Task Details</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Title Editor */}
        <div>
          <textarea
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full bg-transparent text-xl font-bold text-white tracking-tight resize-none border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2 -m-2 transition-all duration-150"
            rows={Math.min(5, localTitle.split('\n').length)}
            style={{ minHeight: '3rem' }}
          />
        </div>

        {/* Metadata Controls */}
        <div className="space-y-4">
          <DetailField
            label="Priority"
            value={localPriority}
            onChange={(val) => { setLocalPriority(val); handleMetadataChange('priority', val); }}
            options={['Low', 'Medium', 'High']}
          />
          <DetailField
            label="Due Date"
            value={localDue}
            onChange={(val) => { setLocalDue(val); handleMetadataChange('due', val); }}
            placeholder="e.g., Tomorrow, Today @ 5pm"
          />
          <DetailField
            label="Project"
            value={task.project || 'Inbox'}
            onChange={(val) => handleMetadataChange('project', val)}
            placeholder="e.g., Design, Marketing"
          />
        </div>

        {/* Subtasks */}
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <h3 className="text-sm text-gray-400 font-semibold">Subtasks ({task.subtasks.filter(s => s.status !== 'done').length})</h3>

          <AnimatePresence initial={false}>
            {task.subtasks.map((subtask) => (
              <motion.div
                key={subtask.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                className="flex items-center gap-3 py-1.5"
              >
                <LinearCheckbox
                  size="sm"
                  checked={subtask.status === 'done'}
                  onChange={() => toggleSubtask(subtask.id)}
                />
                <span className={`flex-1 text-sm ${subtask.status === 'done' ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                  {subtask.title}
                </span>
                <button
                  onClick={() => deleteSubtask(task.id, subtask.id)}
                  className="p-1 opacity-0 hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={handleAddSubtask}
            placeholder="Add a new subtask (Enter)"
            className="w-full bg-white/5 border border-white/10 text-sm p-2 rounded-lg placeholder-gray-600 text-gray-200 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Footer Actions (Archive/Delete) */}
      <div className="p-4 border-t border-white/[0.06] flex-shrink-0 flex justify-between">
        <button
          onClick={() => { updateTask(task.id, { archived: true }); onClose(); }}
          className="text-sm text-gray-500 hover:text-white flex items-center gap-2 transition-colors"
        >
          <History size={14} />
          Archive
        </button>
        <button
          onClick={() => { updateTask(task.id, { deleted: true }); onClose(); }} // Add proper delete logic later
          className="text-sm text-red-400 hover:text-red-300 flex items-center gap-2 transition-colors"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </motion.div>
  );
};

// Helper component for detail fields
const DetailField = ({ label, value, onChange, options, placeholder = "" }) => (
  <div>
    <label className="block text-[10px] text-gray-500 font-semibold uppercase mb-1">{label}</label>
    {options ? (
      <div className="flex gap-2">
        {options.map(option => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`text-xs px-3 py-1 rounded-full transition-all duration-150 ${
              value === option
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                : 'bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 text-sm p-2 rounded-lg placeholder-gray-600 text-gray-200 outline-none focus:border-indigo-500 transition-colors"
      />
    )}
  </div>
);

// Settings Panel Component
const SettingsPanel = ({ settings, setSettings, onClose }) => {
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-[#101113] border-l border-white/[0.08] shadow-2xl z-50 flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-4 border-b border-white/[0.06] flex-shrink-0">
        <h2 className="text-sm text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-2">
            <SettingsIcon size={16} />
            App Settings
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Auto-Archive Delay */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-200">Auto-Archive Delay</h3>
          <p className="text-xs text-gray-500">Time (in ms) before a completed task is moved to the archive.</p>
          <input
            type="number"
            value={settings.autoArchiveDelay}
            onChange={(e) => handleSettingChange('autoArchiveDelay', Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 text-sm p-2 rounded-lg placeholder-gray-600 text-gray-200 outline-none focus:border-indigo-500 transition-colors mt-2"
          />
        </div>

        {/* Default Priority */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-200">Default New Task Priority</h3>
          <p className="text-xs text-gray-500">The priority assigned when not specified during creation.</p>
          <DetailField
            label=""
            value={settings.defaultPriority}
            onChange={(val) => handleSettingChange('defaultPriority', val)}
            options={['Low', 'Medium', 'High']}
          />
        </div>

        {/* Show Task Handle */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-200">Show Drag Handle</h3>
            <p className="text-xs text-gray-500">Show the grip icon for manual reordering.</p>
          </div>
          <button
            onClick={() => handleSettingChange('showHandle', !settings.showHandle)}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
              settings.showHandle ? 'bg-indigo-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                settings.showHandle ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
};


// Main App Component
export default function LinearCommandApp() {
  const [tasks, setTasks] = useState([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

  const [inputValue, setInputValue] = useState("");
  const [detectedTags, setDetectedTags] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(new Set());
  const [refiningTaskId, setRefiningTaskId] = useState(null);
  const [isSorting, setIsSorting] = useState(false);
  const [viewMode, setViewMode] = useState('focus');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [detailTask, setDetailTask] = useState(null); // Task object for detail view
  const [showSettings, setShowSettings] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  // Settings state (in-memory for this version)
  const [settings, setSettings] = useState({
    autoArchiveDelay: 700,
    defaultPriority: 'Low',
    showHandle: true,
  });

  const inputRef = useRef(null);
  const listRef = useRef(null);

  const spring = { type: "spring", stiffness: 300, damping: 30 };

  // --- FIREBASE INITIALIZATION AND REALTIME LISTENER ---
  useEffect(() => {
    try {
      if (Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase config is empty. Using mock data.");
        setIsAuthReady(true);
        return;
      }

      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(auth, initialAuthToken);
            } else {
              await signInAnonymously(auth);
            }
          } catch (error) {
            console.error("Firebase Auth Error:", error);
            setIsAuthReady(true);
          }
        } else {
          setUserId(user.uid);
          setIsAuthReady(true);
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Error setting up Firebase:", e);
      setIsAuthReady(true);
    }
  }, []);

  // Firestore Realtime Listener
  useEffect(() => {
    if (!isAuthReady || !userId) return;

    const taskCollectionPath = `/artifacts/${appId}/users/${userId}/tasks`;
    const q = collection(db, taskCollectionPath);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure subtasks are correctly handled (should be arrays)
        subtasks: doc.data().subtasks && Array.isArray(doc.data().subtasks) ? doc.data().subtasks : [],
      })).filter(t => !t.deleted)
         .sort((a, b) => (a.order || 0) - (b.order || 0));

      setTasks(fetchedTasks);
    }, (error) => {
      console.error("Firestore Task Snapshot Error:", error);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId]);

  // Firestore Updater Helper
  const updateTaskInFirestore = useCallback(async (taskId, updates) => {
    if (!userId) { console.error("User not authenticated."); return; }
    try {
      const taskRef = doc(db, `/artifacts/${appId}/users/${userId}/tasks`, taskId);
      await setDoc(taskRef, updates, { merge: true });
    } catch (e) {
      console.error("Failed to update task in Firestore:", e);
    }
  }, [userId]);

  // Combined Task Action (for Detail Modal)
  const handleUpdateTask = (taskId, updates) => {
    updateTaskInFirestore(taskId, updates);
    // If the task being edited is the detail task, update the local state too
    setDetailTask(prev => prev && prev.id === taskId ? { ...prev, ...updates } : prev);
  };

  // Detail Modal Subtask Deletion
  const handleDeleteSubtask = (parentId, subtaskId) => {
      const parentTask = tasks.find(t => t.id === parentId);
      if (!parentTask) return;
      const newSubtasks = parentTask.subtasks.filter(st => st.id !== subtaskId);
      updateTaskInFirestore(parentId, { subtasks: newSubtasks });
  };

  // --- UI PARSING LOGIC FOR TAGS (Uses external parseInput) ---
  useEffect(() => {
    // FIX: Use the globally defined parseInput function and pass necessary state
    const { tags } = parseInput(inputValue, settings.defaultPriority);
    setDetectedTags(tags);
  }, [inputValue, settings.defaultPriority]);


  // Filtering Logic
  const activeTasks = tasks.filter(t => !t.archived);
  const focusTasks = activeTasks.filter(t => (t.due && t.due.includes('Today')) || t.priority === 'High');
  const otherTasks = activeTasks.filter(t => !focusTasks.includes(t));
  const archivedTasks = tasks.filter(t => t.archived);

  let displayedTasks = [];
  if (viewMode === 'archive') {
      displayedTasks = archivedTasks;
  } else {
      displayedTasks = viewMode === 'focus' ? [...focusTasks, ...otherTasks] : activeTasks;
  }

  // --- KEYBOARD NAVIGATION ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (detailTask || showSettings) {
        if (e.key === 'Escape') {
          setDetailTask(null);
          setShowSettings(false);
        }
        return;
      }

      const isInputFocused = document.activeElement === inputRef.current;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (isInputFocused && displayedTasks.length > 0) {
             setSelectedIndex(0);
             inputRef.current.blur();
          } else {
             setSelectedIndex(prev => Math.min(prev + 1, displayedTasks.length - 1));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (selectedIndex === 0 || selectedIndex === -1) {
             setSelectedIndex(-1);
             inputRef.current.focus();
          } else {
             setSelectedIndex(prev => Math.max(prev - 1, 0));
          }
          break;
        case ' ': // Spacebar to toggle
          e.preventDefault();
          if (selectedIndex >= 0 && displayedTasks[selectedIndex]) {
            toggleTask(displayedTasks[selectedIndex].id);
          }
          break;
        case 'Enter': // Enter to open detail view
          if (!isInputFocused && selectedIndex >= 0 && displayedTasks[selectedIndex]) {
            e.preventDefault();
            setDetailTask(displayedTasks[selectedIndex]);
          }
          break;
        case 'Backspace':
        case 'Delete':
           if (!isInputFocused && selectedIndex >= 0 && displayedTasks[selectedIndex]) {
              const taskToArchive = displayedTasks[selectedIndex];
              updateTaskInFirestore(taskToArchive.id, { archived: true });
              setSelectedIndex(prev => Math.min(prev, displayedTasks.length - 2));
           }
           break;
        case 'Escape':
           setSelectedIndex(-1);
           inputRef.current.focus();
           break;
        case 'k':
           if (e.metaKey || e.ctrlKey) {
             e.preventDefault();
             inputRef.current.focus();
           }
           break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, displayedTasks, userId, detailTask, showSettings, updateTaskInFirestore]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedIndex !== -1 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // --- ACTIONS ---
  const handleAddTask = async (e) => {
    if (e.key === 'Enter' && inputValue.trim() && userId) {
      // FIX: Use the globally defined parseInput for task creation
      const { cleanText, due, priority } = parseInput(inputValue, settings.defaultPriority);

      const newTask = {
        title: cleanText,
        status: 'todo',
        due: due,
        priority,
        project: 'Inbox',
        subtasks: [],
        archived: false,
        deleted: false,
        order: tasks.reduce((max, t) => Math.max(max, t.order || 0), 0) + 1,
        createdAt: new Date().toISOString(),
      };

      try {
        const taskCollectionRef = collection(db, `/artifacts/${appId}/users/${userId}/tasks`);
        const docRef = doc(taskCollectionRef);
        await setDoc(docRef, newTask);
        setInputValue("");
      } catch (e) {
        console.error("Failed to add task:", e);
      }
    }
  };

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const isCompleting = task.status !== 'done';

    updateTaskInFirestore(id, {
      status: isCompleting ? 'done' : 'todo',
    });

    if (isCompleting) {
      setTimeout(() => {
        updateTaskInFirestore(id, { archived: true });
      }, settings.autoArchiveDelay);
    }
  };

  // Gemini API Feature 1: Break Down Task into Subtasks (simplified to use handleUpdateTask)
  const handleBreakDown = async (task) => {
    // ... (logic remains the same, but calls handleUpdateTask instead of updateTaskInFirestore)
    if (loadingTasks.has(task.id)) return;
    setLoadingTasks(prev => new Set(prev).add(task.id));
    try {
      const prompt = `You are a helpful project manager. Break down "${task.title}" into 3 concise subtasks. Return ONLY a JSON array of strings.`;
      const subtaskTitles = await callGemini(prompt, "ARRAY");
      if (Array.isArray(subtaskTitles)) {
        const newSubtasks = subtaskTitles.map(title => ({
          id: Math.random().toString(36).substr(2, 9),
          title: title,
          status: 'todo'
        }));
        handleUpdateTask(task.id, { subtasks: [...task.subtasks, ...newSubtasks] });
      }
    } catch (error) { console.error("AI Breakdown Error:", error); }
    finally { setLoadingTasks(prev => { const next = new Set(prev); next.delete(task.id); return next; }); }
  };

  // Gemini API Feature 2: Refine Task Title (simplified to use handleUpdateTask)
  const handleTaskRefinement = async (task) => {
    // ... (logic remains the same, but calls handleUpdateTask instead of updateTaskInFirestore)
    if (refiningTaskId || task.archived) return;
    setRefiningTaskId(task.id);
    try {
      const prompt = `You are a productivity expert. Rewrite the following task title to be more concise, actionable, and clear. Return ONLY a JSON object: { "newTitle": "The rewritten task title here" } for the task: "${task.title}".`;
      const result = await callGemini(prompt, "OBJECT");

      if (result?.newTitle) {
        handleUpdateTask(task.id, { title: result.newTitle });
      }
    } catch (error) {
      console.error("AI Refinement Error:", error);
    } finally {
      setRefiningTaskId(null);
    }
  };

  // Gemini API Feature 3: Smart Sort
  const handleSmartSort = async () => {
    // ... (logic remains the same)
    if (isSorting || activeTasks.length < 2 || !userId) return;
    setIsSorting(true);

    try {
        const taskList = activeTasks.map(t => ({ id: t.id, title: t.title, due: t.due, priority: t.priority }));
        const prompt = `Sort these tasks by urgency/importance. High priority/Today is urgent. Return JSON object { "sortedIds": [] } based on IDs. Tasks: ${JSON.stringify(taskList)}`;
        const result = await callGemini(prompt, "OBJECT");

        if (result?.sortedIds && db) {
            const sortedIds = result.sortedIds;
            const taskCollectionRef = collection(db, `/artifacts/${appId}/users/${userId}/tasks`);

            await runTransaction(db, async (transaction) => {
                let orderCounter = 1;

                sortedIds.forEach(id => {
                    const taskRef = doc(taskCollectionRef, id);
                    transaction.update(taskRef, { order: orderCounter++ });
                });

                tasks.filter(t => t.archived).forEach(t => {
                    const taskRef = doc(taskCollectionRef, t.id);
                    transaction.update(taskRef, { order: t.order || 9999 });
                });
            });
        }
    } catch (error) { console.error("Smart Sort Error:", error); }
    finally { setIsSorting(false); }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-[#E0E0E0] font-sans selection:bg-indigo-500/30 flex flex-col items-center pt-[12vh]">

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* MAIN CONTAINER */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[700px] bg-[#16181A]/80 backdrop-blur-2xl rounded-xl border border-white/[0.08] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden relative z-10 ring-1 ring-white/5 flex flex-col max-h-[80vh]"
      >

        {/* HEADER */}
        <div className="relative border-b border-white/[0.06] bg-[#181A1D]/50 backdrop-blur-md z-20 flex-shrink-0">
          <div className="flex items-center px-4 h-14 gap-3">
            <div className={`transition-all duration-300 ${inputValue ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : selectedIndex === -1 ? 'text-white' : 'text-gray-500'}`}>
               {inputValue ? <Zap size={20} className="fill-indigo-500/20" /> : <Search size={20} />}
            </div>

            <input
              ref={inputRef}
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleAddTask}
              placeholder={viewMode === 'archive' ? "Search archive..." : "Add a task (e.g. 'Call John at 2pm urgent')..."}
              className="flex-1 bg-transparent text-[15px] placeholder-gray-600 text-gray-100 outline-none h-full font-normal tracking-tight"
            />

            <div className="flex gap-2">
              <AnimatePresence>
                {detectedTags.map((tag, i) => (
                  <TagPill key={i} label={tag.label} color={tag.color} icon={tag.icon} />
                ))}
              </AnimatePresence>

              {!inputValue && (
                <div className="flex items-center gap-1 text-[10px] font-medium text-gray-600 border border-white/[0.06] px-1.5 py-1 rounded bg-white/[0.02]">
                  <span className="font-mono text-xs">⌘</span>
                  <span>K</span>
                </div>
              )}

              <button
                  onClick={() => setShowSettings(true)}
                  className="p-1 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                  title="Settings"
              >
                  <SettingsIcon size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* TASK LIST AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2 relative min-h-[300px]">

          <div className="px-5 py-3 flex justify-between items-center text-[10px] font-semibold text-gray-500 uppercase tracking-widest opacity-70 sticky top-0 bg-[#16181A]/95 backdrop-blur z-10">
             {viewMode === 'archive' ? (
                <div className="flex items-center gap-2 text-indigo-400">
                    <History size={12} />
                    <span>Archive</span>
                </div>
             ) : (
                <div className="flex items-center gap-2">
                    <Target size={12} />
                    <span>Focus</span>
                </div>
             )}
             <span>{viewMode === 'archive' ? `${archivedTasks.length} items` : `${displayedTasks.length} items`}</span>
          </div>

          <div ref={listRef} className="px-2 pb-4">
            <AnimatePresence initial={false} mode='popLayout'>
              {displayedTasks.map((task, index) => {
                 const isBacklogStart = viewMode === 'focus' && index === focusTasks.length && focusTasks.length > 0 && index > 0;
                 const isSelected = index === selectedIndex;
                 const isTaskRefining = refiningTaskId === task.id;
                 const isTaskBreakingDown = loadingTasks.has(task.id);
                 const isDone = task.status === 'done';
                 const taskHighPriority = task.priority === 'High';

                 return (
                  <React.Fragment key={task.id}>
                    {isBacklogStart && (
                        <motion.div layout className="px-3 py-4 mt-4 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                            <Layout size={12} />
                            <span>Backlog / Later</span>
                            <div className="h-[1px] flex-1 bg-white/[0.04]" />
                        </motion.div>
                    )}

                    <motion.div
                      layout
                      transition={spring}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: isDone ? 0.5 : 1,
                        y: 0,
                        scale: isSelected ? 1.00 : 1,
                        backgroundColor: isSelected ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0)",
                        borderColor: isSelected ? "rgba(255,255,255,0.1)" : "transparent"
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        paddingTop: 0,
                        paddingBottom: 0,
                        transition: { duration: 0.3 }
                      }}
                      onClick={() => setDetailTask(task)}
                      className={`
                        group flex flex-col px-3 py-3 rounded-lg cursor-pointer select-none relative border border-transparent
                        ${!isSelected && 'hover:bg-white/[0.04]'}
                      `}
                    >
                      {/* Main Task Row */}
                      <div className="flex items-center gap-3 w-full">
                          {isSelected && (
                             <motion.div layoutId="active-bar" className="absolute left-0 top-3 bottom-3 w-[3px] bg-indigo-500 rounded-r" />
                          )}

                          {settings.showHandle && viewMode !== 'archive' && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isSelected ? 0.5 : 0 }}
                                className={`transition-opacity -ml-1 text-gray-600 ${isSelected ? 'opacity-50 text-gray-400' : 'opacity-0 group-hover:opacity-100'}`}
                              >
                                <GripVertical size={14} />
                              </motion.div>
                          )}

                          <LinearCheckbox
                            checked={isDone}
                            onChange={() => toggleTask(task.id)}
                          />

                          <div className="flex-1 flex flex-col justify-center min-w-0">
                            {/* TRUNCATION IMPLEMENTED HERE */}
                            <span className={`
                                text-[13px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis min-w-0
                                ${isDone ? 'line-through text-gray-500' : isSelected ? 'text-white font-medium' : 'text-gray-200 font-medium'}
                            `}>
                              {task.title}
                            </span>
                          </div>

                          {/* AI Action Block */}
                          {viewMode !== 'archive' && isSelected && (
                              <motion.div
                                key="selected-actions"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2"
                              >
                                  {/* AI Refine Button */}
                                  <button
                                      onClick={(e) => { e.stopPropagation(); handleTaskRefinement(task); }}
                                      disabled={isTaskRefining || isTaskBreakingDown}
                                      className="h-5 px-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded flex items-center gap-1 text-[9px] text-yellow-400 font-medium disabled:opacity-50 disabled:cursor-wait"
                                      title="Refine Title (AI)"
                                  >
                                      {isTaskRefining ? <Loader2 size={9} className="animate-spin" /> : <Zap size={9} />}
                                      <span>{isTaskRefining ? 'Refining...' : 'Refine ✨'}</span>
                                  </button>

                                  {/* AI Breakdown Button */}
                                  <button
                                      onClick={(e) => { e.stopPropagation(); handleBreakDown(task); }}
                                      disabled={isTaskBreakingDown || isTaskRefining}
                                      className="h-5 px-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded flex items-center gap-1 text-[9px] text-indigo-400 font-medium disabled:opacity-50 disabled:cursor-wait"
                                      title="Break Down into Subtasks (AI)"
                                  >
                                      {isTaskBreakingDown ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                                      <span>{isTaskBreakingDown ? 'Breaking Down...' : 'Subtasks'}</span>
                                  </button>
                              </motion.div>
                          )}

                          {/* Simplified Metadata */}
                          <div className={`flex items-center gap-2 text-xs text-gray-500 font-mono transition-opacity duration-200 w-24 justify-end ${isSelected ? 'opacity-100' : 'group-hover:opacity-0'}`}>
                            {task.due && (
                              <div className={`flex items-center gap-1.5 ${task.due.includes('Today') ? 'text-emerald-400/90' : 'text-gray-500'}`}>
                                <Calendar size={10} />
                                <span className="text-[10px] uppercase tracking-wider truncate">{task.due.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>
                      </div>

                      {/* Subtasks summary - shown below main task */}
                      {task.subtasks && task.subtasks.length > 0 && (
                          <div className="pl-8 pt-1 flex items-center gap-2 text-[10px] text-gray-600">
                             <ListFilter size={10} />
                             <span>{task.subtasks.filter(s => s.status === 'todo').length} of {task.subtasks.length} subtasks remaining</span>
                          </div>
                      )}


                    </motion.div>
                  </React.Fragment>
                 );
              })}
            </AnimatePresence>

            {!isAuthReady && (
              <div className="py-20 flex flex-col items-center justify-center text-gray-600 gap-3">
                 <Loader2 size={24} className="animate-spin text-indigo-400" />
                 <span className="text-sm font-medium">Connecting to Cloud...</span>
              </div>
            )}
            {isAuthReady && displayedTasks.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-gray-600 gap-3">
                 <div className="p-3 rounded-full bg-white/[0.02] border border-white/[0.05]">
                    {viewMode === 'archive' ? <History size={24} /> : <Inbox size={24} strokeWidth={1.5} />}
                 </div>
                 <span className="text-sm font-medium">{viewMode === 'archive' ? "No history yet" : "All caught up"}</span>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="h-10 border-t border-white/[0.06] bg-[#16181A]/90 backdrop-blur-md flex items-center justify-between px-4 text-[11px] text-gray-500 font-medium flex-shrink-0">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 hover:text-gray-300 cursor-pointer transition-colors group">
               <Plus size={10} />
               <span>Create</span>
             </div>
             <div className="w-[1px] h-3 bg-white/10" />

             <button
                onClick={handleSmartSort}
                disabled={isSorting || viewMode === 'archive' || !isAuthReady || activeTasks.length < 2}
                className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${isSorting ? 'text-indigo-400' : 'hover:text-indigo-400'} ${viewMode === 'archive' || !isAuthReady || activeTasks.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Use AI to re-sort the current list based on priority and due dates."
             >
               {isSorting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="group-hover:fill-indigo-400/20" />}
               <span>{isSorting ? 'Prioritize Focus' : 'Smart Prioritize'}</span>
             </button>
          </div>

          <div className="flex items-center gap-4">
            <button
                onClick={() => setShowVideoPreview(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition-colors text-gray-500 hover:text-indigo-400"
                title="Watch promo video"
            >
                <Play size={12} />
                <span>Video</span>
            </button>
            <button
                onClick={() => setViewMode(prev => prev === 'archive' ? 'focus' : 'archive')}
                className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition-colors ${viewMode === 'archive' ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-500'}`}
                title={viewMode === 'archive' ? "Switch to Focus/Active view" : "Switch to Archive/History view"}
            >
                <History size={12} />
                <span>History</span>
            </button>

            <div className="flex items-center gap-2 pl-4 border-l border-white/5">
               {selectedIndex !== -1 && (
                 <span className="text-[9px] font-mono text-gray-600 mr-2">
                    {selectedIndex + 1}/{displayedTasks.length}
                 </span>
               )}
              <div className="relative flex items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${viewMode === 'archive' ? 'bg-indigo-500' : 'bg-emerald-500'} z-10`} />
                  <div className={`absolute w-3 h-3 rounded-full ${viewMode === 'archive' ? 'bg-indigo-500/20' : 'bg-emerald-500/20'} animate-pulse`} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 text-gray-600 text-xs font-mono opacity-40 flex gap-4">
        <span>↑↓ to navigate</span>
        <span>Space to toggle</span>
        <span>Enter for details</span>
        <span>Del to archive</span>
      </div>

      {/* TASK DETAIL MODAL */}
      <AnimatePresence>
        {detailTask && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setDetailTask(null)}>
            <TaskDetailModal
              task={detailTask}
              onClose={() => setDetailTask(null)}
              updateTask={handleUpdateTask}
              deleteSubtask={handleDeleteSubtask}
              settings={settings}
            />
          </div>
        )}
      </AnimatePresence>

      {/* SETTINGS PANEL */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
            <SettingsPanel
              settings={settings}
              setSettings={setSettings}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* VIDEO PREVIEW */}
      {showVideoPreview && (
        <VideoPreview onClose={() => setShowVideoPreview(false)} />
      )}

    </div>
  );
}
