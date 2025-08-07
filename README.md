# 🏹 Gamify Menu 🎯

A **cinematic, gamified website navigation system** where users interact using a bow-and-arrow mechanism to hit floating menu icons. Designed with interactive animation, dynamic sound effects, and mobile responsiveness — this menu system turns navigation into a game.

---

## 📸 Preview

![Preview Screenshot](preview.png) <!-- Replace with your actual screenshot path -->

---

## 🚀 Features

- 🎯 **Target Mode**: Select and shoot a floating menu icon to navigate.
- 🧠 **Difficulty Mode**: Adjust animation speed with emoji-based modes: 🤣 Noob, 🙂 Easy, 🥶 Veteran.
- 🏹 **Hold-to-Fire Mechanic**: Press and hold mouse or touch to draw the arrow and release to shoot.
- 🔊 **Custom Sounds**: Fire, hit, miss, and difficulty change sounds.
- ✨ **Visual Feedback**:
  - Explosion particles on hit
  - Emoji rain when switching difficulty
  - Glow and hover states for interactivity
- 📱 **Mobile & Tablet Ready**: Responsive layout with toggle buttons (🎯, 🧠) instead of full dropdowns.
- 📍 **Compass & Cinematic Elements**: Decorative SVG compass and atmospheric UI.

---

## 📁 Folder Structure
 ```
│
├── assets/ # All images, icons, SVGs, audio
│ ├── arrow.svg
│ ├── compass.svg
│ ├── icon1.svg ...
│ ├── bg-music.mp3
│ └── shoot.mp3, hit.mp3, miss.mp3, etc.
│
├── index.html # Main HTML file
├── style.css # Complete visual styling (desktop + mobile)
├── script.js # All interaction logic, physics, UI control
└── README.md # This file!
 ```


---

## 🧪 Live Demo

> 💡 You can open `index.html` directly in any browser, or [Live Server](https://superb-gecko-26b001.netlify.app/)

Make sure all assets are correctly linked when hosting.

---

## 🕹 Controls

| Device   | Interaction        | Description                                 |
|----------|--------------------|---------------------------------------------|
| Desktop  | Hold Right Mouse   | Aim and shoot arrow                         |
| Mobile   | Tap & Hold Screen  | Aim and release to shoot                    |
| All      | 🎯 Button           | Opens the target selector menu              |
| All      | 🧠 Button           | Opens the difficulty selector menu          |
| All      | Click outside      | Closes any open menu dropdowns              |

---

## ⚙️ Customization

You can modify your menu icons and tooltips in `script.js` using the `menuTargets` array:

```js
let menuTargets = [
  { icon: "assets/icon1.svg", tooltip: "Home", url: "#home" },
  { icon: "assets/icon2.svg", tooltip: "About", url: "#about" },
  { icon: "assets/icon3.svg", tooltip: "Projects", url: "#projects" },
  // Add or remove icons as needed
];

