import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './app/router';
import './styles/global.scss';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 12,
        padding: 20,
        paddingLG: 24,
        marginLG: 20,
      },
      components: {
        Card: {
          bodyPadding: 24,
          headerPadding: 20,
        },
      },
    }}>
      <App><BrowserRouter><AppRouter /></BrowserRouter></App>
    </ConfigProvider>
  </React.StrictMode>
);
