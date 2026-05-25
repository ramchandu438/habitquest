# 📖 HabitQuest - Vintage Diary Ledger

Welcome to **HabitQuest**, a premium, highly aesthetic Single Page Application (SPA) habit tracker styled after an elegant, analog, black-and-white typewriter diary ledger. 

HabitQuest features full gamified experience-level progression, continuous streaks calculations, customizable reflections logs, zero-dependency interactive SVG graphics, and a standalone local desktop shell. It requires **zero database servers** and synchronizes all your routine tracking 100% offline in your local browser storage.

---

## 🌟 Standout Features

* **📜 ruled Notebook Styling:** A warm parchment paper canvas displaying faint ruled journal guide-lines, typewriter typography, and flat analog physical drop-shadows.
* **📈 Ink-Stamp Heatmap Density:** A 24-week contribution density matrix (GitHub contribution style) complete with custom typewriter paper tag tooltips displaying dates and logged tallies.
* **🏆 Experience Progression & Multipliers:** Earn `+10 XP` base rewards per log with dynamic multipliers (gain up to `+25 XP` extra for holding continuous streaks!).
* **📝 Daily Reflections Ledger:** A structured markdown journal timeline to log notes and capture small wins. Saving notes automatically records completions.
* **🪟 Native Windows App Integration:** Integrated with Electron to run as a clean, menu-free native desktop application shell.
* **📥 100% Data Portability:** Download secure backups via local `.json` database file exports and restore them anytime on any device.

---

## 🚀 Accessing the Application

You can access and run **HabitQuest** in three different ways depending on your needs.

### 🌐 Method 1: Play Instantly Online (No Setup Required)
The app is published live and fully interactive on the web! Simply click the link below to open it in your browser:
➡️ **[Play HabitQuest Live Web Version](https://ramchandu438.github.io/habitquest/)**

---

### 💻 Method 2: Running Locally in Developer Mode
If you want to run HabitQuest locally on your machine, modify styles, or check configurations, follow these simple terminal commands.

#### Prerequisites
* Make sure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed on your system.

#### Step-by-Step Launch
1. **Clone the repository:**
   ```bash
   git clone https://github.com/ramchandu438/habitquest.git
   cd habitquest
   ```
2. **Install local packaging dependencies:**
   ```bash
   npm install
   ```
3. **Launch the Local Development Web Host:**
   ```bash
   npm run dev
   ```
   *This starts a server at `http://localhost:3050` and automatically launches your browser!*
4. **Launch inside the Desktop App Shell:**
   ```bash
   npm run desktop
   ```
   *This opens HabitQuest directly inside a standalone, borderless Windows desktop frame!*

---

### 📦 Method 3: Compiling into a Standalone Desktop Executable (.exe)
If you want to package the application into a portable Windows executable (`HabitQuest.exe`) that runs without any terminal prompts, you can compile it locally in seconds:

1. **Open your terminal inside the project directory and run:**
   ```bash
   npm run package-win
   ```
2. **Retrieve your app:**
   * Once completed, go to your new local output folder:
     `dist/HabitQuest-win32-x64/`
   * Inside, you will find a compiled **`HabitQuest.exe`** binary.
3. **Set Up Desktop / Taskbar Shortcuts:**
   * **Taskbar:** Right-click `HabitQuest.exe` and select **Pin to Taskbar** or **Pin to Start** to launch the app instantly from your taskbar!
   * **Desktop Icon:** Right-click `HabitQuest.exe` and select **Send to** ➡️ **Desktop (create shortcut)**. Rename the shortcut to `HabitQuest` on your desktop!

---

## 🔒 Privacy & Offline Storage
HabitQuest runs **entirely client-side**. All habit cards, progression levels, streaks, reflections logs, and badges are stored strictly on your local browser's database (`LocalStorage`). No personal information, logs, or analytics ever leave your computer. 

To transfer your data to a different machine, use the **Export Database** and **Import Backup** buttons in the footer!
