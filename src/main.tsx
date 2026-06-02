import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { App, ConfigProvider, FloatButton, theme as antdTheme } from 'antd';
import { BulbOutlined, MoonOutlined } from '@ant-design/icons';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './app/router';
import './styles/global.scss';

type ThemeMode = 'light' | 'dark';

function RootApp() {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem('themeMode') as ThemeMode) || 'light');

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const configTheme = useMemo(() => ({
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 12,
      padding: 20,
      paddingLG: 24,
      marginLG: 20,
      colorBgLayout: mode === 'dark' ? '#0f172a' : '#f3f6fb'
    },
    components: {
      Card: {
        bodyPadding: 24,
        headerPadding: 20
      }
    }
  }), [mode]);

  return <ConfigProvider theme={configTheme}>
    <App>
      <BrowserRouter><AppRouter /></BrowserRouter>
      <FloatButton
        icon={mode === 'dark' ? <BulbOutlined /> : <MoonOutlined />}
        tooltip={mode === 'dark' ? 'Light mode' : 'Dark mode'}
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      />
    </App>
  </ConfigProvider>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
