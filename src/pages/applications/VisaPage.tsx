import { Card, Progress } from 'antd';import { PageHeader, StatusTag } from '@/components/common';
export default function(){return <><PageHeader title='签证管理'/><Card><p>材料准备进度</p><Progress percent={68}/><p>面签时间：2026-06-08</p><p>当前状态：<StatusTag status='准备中'/></p><p>风险提醒：资金证明需补充</p></Card></>}
