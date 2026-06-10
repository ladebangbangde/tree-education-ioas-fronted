import { Button, Card, Form, Input, message } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export default function LoginPage(){
  const nav = useNavigate();
  const loc = useLocation();
  const loginByApi = useAuthStore(s=>s.loginByApi);
  const [loading, setLoading] = useState(false);