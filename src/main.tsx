import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './app/router';
import './styles/global.scss';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={{ token: { colorPrimary: '#1677ff', borderRadius: 8 } }}>
      <BrowserRouter><AppRouter /></BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
