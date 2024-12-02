// Backend (Node.js/Express) - server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Configure required headers for WebContainer
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Sample endpoint providing project files
app.get('/api/project-files', (req, res) => {
  // Example project files structure
  const files = {
    'package.json': {
      file: {
        contents: `{
          "name": "vite-starter",
          "private": true,
          "version": "0.0.0",
          "type": "module",
          "scripts": {
            "dev": "vite",
            "build": "vite build",
            "preview": "vite preview"
          },
          "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
          "devDependencies": {
            "@vitejs/plugin-react": "^4.0.0",
            "vite": "^4.3.9"
          }
        }`
      }
    },
    'index.html': {
      file: {
        contents: `
          <!DOCTYPE html>
          <html>
            <head>
              <title>WebContainer Demo</title>
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.jsx"></script>
            </body>
          </html>
        `
      }
    },
    'src': {
      directory: {
        'main.jsx': {
          file: {
            contents: `
              import React from 'react'
              import ReactDOM from 'react-dom/client'
              import App from './App'
              
              ReactDOM.createRoot(document.getElementById('root')).render(
                <React.StrictMode>
                  <App />
                </React.StrictMode>
              )
            `
          }
        },
        'App.jsx': {
          file: {
            contents: `
              import React from 'react'
              
              function App() {
                return <h1>Hello from WebContainer!</h1>
              }
              
              export default App
            `
          }
        }
      }
    }
  };
  
  res.json(files);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
