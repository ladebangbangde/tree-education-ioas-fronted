import { useMemo, useState } from 'react';
import { App, Button, Descriptions, Drawer, Form, Input, Modal, Select, Space, Table, Tabs, Tag, Timeline, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

type ActionKind = 'view'|'edit'|'more'|'assign'|'follow'|'convert'|'highIntent'|'batch'|'export'|'new'|'preview'|'publish'|'offline'|'permission'|'log'|'file'|'config'|'stage'|'advisor'|'resetPassword';
type AnyRecord = object;

const drawerActions = new Set<ActionKind>(['view','edit','more','follow','preview','permission','log','file','config']);
const modalActions = new Set<ActionKind>(['assign','convert','highIntent','batch','export','new','publish','offline','stage','advisor','resetPassword']);
const actionTitles: Record<ActionKind, string> = {
  view:'查看详情', edit:'编辑详情', more:'更多操作', assign:'分配顾问', follow:'记录跟进', convert:'转学生档案', highIntent:'标记高意向', batch:'批量操作', export:'导出数据', new:'新建', preview:'预览详情', publish:'发布确认', offline:'下线确认', permission:'配置权限', log:'查看日志', file:'资料文件详情', config:'配置详情', stage:'服务阶段变更', advisor:'更换顾问', resetPassword:'重置密码'
};

function valueOf(record: AnyRecord | undefined, keys: string[], fallback = '-') {
  const source = (record || {}) as Record<string, unknown>;
  const found = keys.map(k => source[k]).find(v => v !== undefined && v !== null && v !== '');
  return String(found ?? fallback);
}

function RecordDescriptions({ record }: { record?: AnyRecord }) {
  const entries = Object.entries(record || {}).slice(0, 12);
  return <Descriptions bordered column={2} size='small' items={entries.map(([key, value]) => ({ label: key, children: typeof value === 'boolean' ? (value ? '是' : '否') : String(value) }))} />;
}

function TimelineDetail({ owner }: { owner: string }) {
  return <Timeline items={[
    { color: 'green', children: `${owner} 完成首次沟通，确认申请目标与预算。` },
    { color: 'blue', children: '系统生成跟进任务，并同步给咨询主管复核。' },
    { color: 'orange', children: '待办：补充背景资料、安排下一次方案会。' }
  ]} />;
}

function FileDetail({ name }: { name: string }) {
  const rows = [
    { id: 'F01', name: '护照首页扫描件.pdf', type: '身份证明', version: 'V2', status: '已审核', owner: '学生', updatedAt: '2026-05-05 18:20' },
    { id: 'F02', name: '成绩单中英版.pdf', type: '学术材料', version: 'V1', status: '待补充', owner: '教务老师', updatedAt: '2026-05-04 10:12' },
    { id: 'F03', name: `${name || '申请'}_评估报告.docx`, type: '内部文件', version: 'V3', status: '已归档', owner: '顾问', updatedAt: '2026-05-03 16:40' }
  ];
  return <Space direction='vertical' size={16} style={{ width: '100%' }}>
    <Upload><Button icon={<UploadOutlined />}>上传新版本</Button></Upload>
    <Table rowKey='id' pagination={false} dataSource={rows} columns={[{ title:'文件名', dataIndex:'name' }, { title:'类型', dataIndex:'type' }, { title:'版本', dataIndex:'version' }, { title:'状态', dataIndex:'status', render:(v:string)=><Tag color={v==='已审核'?'green':v==='待补充'?'orange':'blue'}>{v}</Tag> }, { title:'负责人', dataIndex:'owner' }, { title:'更新时间', dataIndex:'updatedAt' }]} />
  </Space>;
}

function PermissionConfig() {
  return <Tabs items={[
    { key:'menu', label:'菜单权限', children:<Table pagination={false} rowKey='key' dataSource={[{key:'lead', module:'线索中心', view:true, edit:true, export:true},{key:'student', module:'学生档案', view:true, edit:true, export:false},{key:'cms', module:'内容管理', view:true, edit:false, export:false}]} columns={[{title:'模块',dataIndex:'module'},{title:'查看',dataIndex:'view',render:(v:boolean)=><Tag color={v?'green':'default'}>{v?'允许':'禁止'}</Tag>},{title:'编辑',dataIndex:'edit',render:(v:boolean)=><Tag color={v?'green':'default'}>{v?'允许':'禁止'}</Tag>},{title:'导出',dataIndex:'export',render:(v:boolean)=><Tag color={v?'green':'default'}>{v?'允许':'禁止'}</Tag>}]} /> },
    { key:'data', label:'数据权限', children:<Form layout='vertical'><Form.Item label='数据范围'><Select defaultValue='dept' options={[{value:'all',label:'全部数据'},{value:'dept',label:'本部门数据'},{value:'self',label:'本人数据'}]} /></Form.Item><Form.Item label='敏感字段'><Select mode='multiple' defaultValue={['phone']} options={[{value:'phone',label:'手机号脱敏'},{value:'amount',label:'合同金额脱敏'}]} /></Form.Item></Form> }
  ]} />;
}

function DrawerContent({ action, record }: { action: ActionKind; record?: AnyRecord }) {
  const name = valueOf(record, ['studentName','name','title','school','operator','module']);
  if (action === 'edit') return <Form layout='vertical' initialValues={record}><Form.Item label='名称/标题' name='name'><Input defaultValue={name}/></Form.Item><Form.Item label='负责人/顾问' name='owner'><Select defaultValue={valueOf(record, ['advisor','owner','author'])} options={[{value:'Amy顾问'},{value:'Tom顾问'},{value:'Sally顾问'},{value:'周航'}]} /></Form.Item><Form.Item label='状态' name='status'><Select defaultValue={valueOf(record, ['status'])} options={[{value:'新线索'},{value:'跟进中'},{value:'高意向'},{value:'申请中'},{value:'已发布'},{value:'草稿'}]} /></Form.Item><Form.Item label='备注'><Input.TextArea rows={4} defaultValue='企业级后台 Mock 编辑表单，可在接入接口后提交保存。'/></Form.Item></Form>;
  if (action === 'follow') return <Form layout='vertical'><Form.Item label='跟进对象'><Input defaultValue={name}/></Form.Item><Form.Item label='跟进方式'><Select defaultValue='电话' options={[{value:'电话'},{value:'微信'},{value:'面谈'},{value:'邮件'}]} /></Form.Item><Form.Item label='跟进内容'><Input.TextArea rows={5} defaultValue='确认目标院校、预算和材料准备进度。'/></Form.Item><Form.Item label='下次跟进时间'><Input defaultValue='2026-05-08 10:00'/></Form.Item><TimelineDetail owner={valueOf(record, ['advisor','owner','author'], '系统')} /></Form>;
  if (action === 'file') return <FileDetail name={name} />;
  if (action === 'log') return <TimelineDetail owner={valueOf(record, ['operator','advisor','owner','author'], '运营管理员')} />;
  if (action === 'permission' || action === 'config') return <PermissionConfig />;
  if (action === 'preview') return <Tabs items={[{key:'web',label:'页面预览',children:<div className='preview-card'><h2>{name}</h2><p>这是发布前预览视图，展示头图、摘要、正文模块、SEO标题与移动端适配效果。</p></div>},{key:'seo',label:'SEO信息',children:<RecordDescriptions record={{ title:name, keyword:'留学申请, 院校规划', description:'面向学生和家长的高质量内容页', canonical:'/mock/preview' }} />}]} />;
  if (action === 'more') return <Space direction='vertical' style={{width:'100%'}}><Button block>同步 CRM</Button><Button block>创建待办</Button><Button block>发送提醒</Button><Button block>归档记录</Button></Space>;
  return <RecordDescriptions record={record} />;
}

function ModalContent({ action, record }: { action: ActionKind; record?: AnyRecord }) {
  const name = valueOf(record, ['studentName','name','title','school','operator','module']);
  if (action === 'assign' || action === 'advisor') return <Form layout='vertical'><Form.Item label='对象'><Input defaultValue={name}/></Form.Item><Form.Item label={action === 'advisor' ? '新顾问' : '分配顾问'}><Select defaultValue='Amy顾问' options={[{value:'Amy顾问',label:'Amy顾问 · 英国/澳洲 · 负载12'},{value:'Tom顾问',label:'Tom顾问 · 美国/加拿大 · 负载18'},{value:'Sally顾问',label:'Sally顾问 · 新加坡/港澳 · 负载10'}]} /></Form.Item><Form.Item label='分配原因'><Input.TextArea rows={3} defaultValue='根据国家方向、顾问负载和转化率推荐。'/></Form.Item></Form>;
  if (action === 'batch') return <Form layout='vertical'><Form.Item label='批量动作'><Select defaultValue='assign' options={[{value:'assign',label:'批量分配顾问'},{value:'tag',label:'批量打标签'},{value:'archive',label:'批量归档'}]} /></Form.Item><Form.Item label='影响范围'><Input defaultValue='当前筛选结果前 20 条 Mock 数据'/></Form.Item></Form>;
  if (action === 'export') return <Form layout='vertical'><Form.Item label='导出字段'><Select mode='multiple' defaultValue={['basic','owner','status']} options={[{value:'basic',label:'基础字段'},{value:'owner',label:'负责人'},{value:'status',label:'状态'},{value:'log',label:'操作日志'}]} /></Form.Item><Form.Item label='文件格式'><Select defaultValue='xlsx' options={[{value:'xlsx'},{value:'csv'}]} /></Form.Item></Form>;
  if (action === 'new') return <Form layout='vertical'><Form.Item label='名称/标题'><Input placeholder='请输入'/></Form.Item><Form.Item label='类型'><Select defaultValue='lead' options={[{value:'lead',label:'线索'},{value:'article',label:'文章'},{value:'user',label:'用户'},{value:'dict',label:'字典项'}]} /></Form.Item><Form.Item label='备注'><Input.TextArea rows={3}/></Form.Item></Form>;
  if (action === 'stage') return <Form layout='vertical'><Form.Item label='学生'><Input defaultValue={name}/></Form.Item><Form.Item label='目标阶段'><Select defaultValue='网申提交' options={['选校规划','文书准备','网申提交','Offer跟进','签证办理','行前准备'].map(value=>({value}))} /></Form.Item><Form.Item label='变更说明'><Input.TextArea rows={3} defaultValue='阶段资料已齐备，进入下一交付节点。'/></Form.Item></Form>;
  return <p>请确认对「{name}」执行“{actionTitles[action]}”。系统将记录操作日志并触发相关通知。</p>;
}

export function useEnterpriseActions(scope: string) {
  const { message } = App.useApp();
  const [drawer, setDrawer] = useState<{ open: boolean; action: ActionKind; record?: AnyRecord }>({ open:false, action:'view' });
  const [modal, setModal] = useState<{ open: boolean; action: ActionKind; record?: AnyRecord }>({ open:false, action:'new' });
  const openAction = (action: ActionKind, record?: AnyRecord) => {
    if (drawerActions.has(action)) setDrawer({ open:true, action, record });
    if (modalActions.has(action)) setModal({ open:true, action, record });
  };
  const contextHolder = useMemo(() => <>
    <Drawer width={720} destroyOnClose title={`${scope} · ${actionTitles[drawer.action]}`} open={drawer.open} onClose={()=>setDrawer(d=>({...d, open:false}))} extra={<Button type='primary' onClick={()=>{ message.success('Mock 已保存'); setDrawer(d=>({...d, open:false})); }}>保存</Button>}><DrawerContent action={drawer.action} record={drawer.record} /></Drawer>
    <Modal title={`${scope} · ${actionTitles[modal.action]}`} open={modal.open} onCancel={()=>setModal(m=>({...m, open:false}))} onOk={()=>{ message.success('Mock 操作已完成'); setModal(m=>({...m, open:false})); }} destroyOnClose><ModalContent action={modal.action} record={modal.record} /></Modal>
  </>, [drawer, modal, message, scope]);
  return { openAction, contextHolder };
}
