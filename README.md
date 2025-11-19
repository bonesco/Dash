# Gemini Todo App 🚀

A beautiful, AI-powered todo application built with React, Firebase, and Google's Gemini AI. Features natural language parsing, smart task prioritization, and intelligent task breakdown.

## ✨ Features

- **Natural Language Parsing** - Type "Call John tomorrow at 2pm urgent" and watch it auto-parse
- **AI-Powered Task Breakdown** - Break complex tasks into subtasks with Gemini
- **Smart Task Refinement** - Let AI rewrite tasks to be more actionable
- **Intelligent Prioritization** - AI sorts your tasks by urgency and importance
- **Keyboard-First Navigation** - Navigate your tasks without touching the mouse
- **Real-time Sync** - Firebase integration for cloud storage (optional)
- **Dark Mode UI** - Beautiful, modern interface inspired by Linear

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your Gemini API key:** [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 3. Run the App

```bash
npm run dev
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 🔑 Firebase Setup (Optional)

For cloud sync across devices:

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore Database and Authentication (Anonymous)
3. Copy your Firebase config and add to `.env`:

```env
VITE_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"..."}
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` or `Ctrl+K` | Focus input field |
| `↑` / `↓` | Navigate tasks |
| `Space` | Toggle task completion |
| `Enter` | Open task details |
| `Delete` / `Backspace` | Archive task |
| `Esc` | Return to input / Close modal |

## 🎯 Usage Examples

### Natural Language Input

The app automatically parses your input:

- `"Call John tomorrow"` → Due: Tomorrow
- `"Review PR at 3pm"` → Due: Today @ 3pm
- `"Fix bug urgent"` → Priority: High
- `"Meeting next week at 2pm urgent"` → Multiple tags

### AI Features

1. **Task Breakdown** - Select a task, click "Subtasks" to break it down into steps
2. **Task Refinement** - Select a task, click "Refine ✨" to make it more actionable
3. **Smart Prioritize** - Click the "Smart Prioritize" button to auto-sort by urgency

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Firebase** - Backend & real-time sync
- **Google Gemini AI** - Natural language understanding

## 📦 Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 🎨 Customization

### Settings Panel

Access the settings (gear icon) to customize:
- Auto-archive delay (ms)
- Default task priority
- Show/hide drag handles

### Styling

The app uses Tailwind CSS. Customize colors in `tailwind.config.js` or modify the theme in `src/App.jsx`.

## 🐛 Troubleshooting

**AI features not working?**
- Check that `VITE_GEMINI_API_KEY` is set in `.env`
- Verify your API key is valid at [Google AI Studio](https://aistudio.google.com/)

**Tasks not syncing?**
- Ensure Firebase config is correct in `.env`
- Check that Firestore and Authentication are enabled in Firebase Console

**App won't start?**
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Make sure you're using Node.js v16 or higher

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Credits

Built with ❤️ using Google's Gemini AI and inspired by Linear's beautiful UI.
