# typing speed test ⌨️

a typing speed test i built from scratch using nothing but html, css and js. no frameworks, no libraries, just vanilla everything.

![Made with HTML](https://img.shields.io/badge/HTML-5-orange)
![Made with CSS](https://img.shields.io/badge/CSS-3-blue)
![Made with JS](https://img.shields.io/badge/JavaScript-ES6-yellow)

## live demo
[https://qasimshahid29.github.io/typingtest/]() ← coming soon

## what it does

- 15s, 30s and 60s modes
- live wpm + accuracy as you type
- wpm graph that draws itself in real time using canvas api
- mistake heatmap — shows you exactly which keys you keep fumbling
- saves your personal best per mode
- tracks your last few runs in a session history table
- if you hit 100+ wpm the screen goes crazy — particles, glow, glitch effect on the title
- dark glassmorphism ui with an animated background

## what i used

- html5
- css3 — glassmorphism, keyframe animations, the whole thing
- vanilla javascript — dom manipulation, canvas api, localstorage

## how to run it
```bash
git clone https://github.com/qasimshahid29/typingtest.git
cd typing-test

typing-test/
├── index.html      
├── style.css       
└── script.js       
```

## why i built this

wanted to strengthen my javascript and html fundamentals by building something i'd actually use. ended up going deeper than planned — canvas api, localstorage, particle systems, the works.