import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';
import './index.css';

const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://taskflow-production-1d8a.up.railway.app';
axios.defaults.baseURL = apiBaseUrl;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
