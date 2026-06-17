const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'src/pages/dataOps/OperationDataPage.tsx');
const apiPath = path.join(root, 'src/api/dataOps.ts');

function writeIfChanged(file, next) {
  const current = fs.readFileSync(file, 'utf8');
  if (current !== next) fs.writeFileSync(file, next, 'utf8');
}

function ensureIncludes(text, needle, insertAfter, insertion, label) {
  if (text.includes(needle)) return text;
  if (!text.includes(insertAfter)) {
    throw new Error(`Patch failed: cannot find insertion point for ${label}`);
  }
  return text.replace(insertAfter, `${insertAfter}${insertion}`);
}

function ensureReplace(text, marker, find, replace, label) {
  if (text.includes(marker)) return text;
  const next = text.replace(find, replace);
  if (next === text) throw new Error(`Patch failed: cannot replace ${label}`);
  return next;
}

function patchApi() {
  let text = fs.readFileSync(apiPath, 'utf8');

  text = ensureIncludes(
    text,
    'anchor_user_ids?: string;',
    '  mediaNames?: string;\n',
    '  anchor_user_ids?: string;\n  anchorUserIds?: string;\n  anchor_names?: string;\n  anchorNames?: string;\n',
    'DataOpsPackage anchor fields'
  );

  text = ensureReplace(
    text,
    'async anchorUsers()',
    "  async userOptions(role: DataOpsUserRole) {\n    const res = await client.get('/data-ops/users', { params: { role } });\n    return unwrapResponse<DataOpsUserOption[]>(res.data);\n  },",
    "  async userOptions(role: DataOpsUserRole) {\n    const res = await client.get('/data-ops/users', { params: { role } });\n    return unwrapResponse<DataOpsUserOption[]>(res.data);\n  },\n  async anchorUsers() {\n    const res = await client.get('/data-ops/anchor-users');\n    return unwrapResponse<DataOpsUserOption[]>(res.data);\n  },",
    'anchorUsers api'
  );

  text = ensureReplace(
    text,
    'anchorUserIds?: number[]',
    "  async createPackage(payload: { topicDate?: string; operatorUserIds: number[]; mediaUserIds: number[] }) {\n    const res = await client.post('/data-ops/packages', payload);\n    return normalizePackage(unwrapResponse<DataOpsPackage>(res.data));\n  },",
    "  async createPackage(payload: { topicDate?: string; operatorUserIds: number[]; mediaUserIds: number[]; anchorUserIds?: number[] }) {\n    const endpoint = payload.anchorUserIds?.length ? '/data-ops/packages-with-anchor' : '/data-ops/packages';\n    const res = await client.post(endpoint, payload);\n    return normalizePackage(unwrapResponse<DataOpsPackage>(res.data));\n  },",
    'createPackage anchor payload'
  );

  writeIfChanged(apiPath, text);
}

function patchPage() {
  let text = fs.readFileSync(pagePath, 'utf8');

  text = ensureIncludes(
    text,
    'const [anchorUsers, setAnchorUsers]',
    '  const [mediaUsers, setMediaUsers] = useState<DataOpsUserOption[]>([]);\n',
    '  const [anchorUsers, setAnchorUsers] = useState<DataOpsUserOption[]>([]);\n',
    'anchorUsers state'
  );

  text = ensureReplace(
    text,
    'dataOpsApi.anchorUsers()',
    "    Promise.all([dataOpsApi.userOptions('OPERATOR'), dataOpsApi.userOptions('MEDIA')])\n      .then(([o, m]) => { setOperatorUsers(o || []); setMediaUsers(m || []); })",
    "    Promise.all([dataOpsApi.userOptions('OPERATOR'), dataOpsApi.userOptions('MEDIA'), dataOpsApi.anchorUsers()])\n      .then(([o, m, a]) => { setOperatorUsers(o || []); setMediaUsers(m || []); setAnchorUsers(a || []); })",
    'load anchor users'
  );

  text = ensureReplace(
    text,
    'anchorUserIds: (v.anchorUserIds || []).map(Number)',
    "      const created = await dataOpsApi.createPackage({ topicDate: v.topicDate || today, operatorUserIds: v.operatorUserIds.map(Number), mediaUserIds: v.mediaUserIds.map(Number) });",
    "      const created = await dataOpsApi.createPackage({ topicDate: v.topicDate || today, operatorUserIds: v.operatorUserIds.map(Number), mediaUserIds: v.mediaUserIds.map(Number), anchorUserIds: (v.anchorUserIds || []).map(Number) });",
    'create package anchor values'
  );

  const modalRegex = /    <Modal title="创建主题包" open=\{packageOpen\}[\s\S]*?<\/Form><\/Modal>/;
  const modalReplacement = `    <Modal title="创建主题包" open={packageOpen} onCancel={() => setPackageOpen(false)} onOk={createPackage} confirmLoading={packageSubmitting} destroyOnClose>
      <Form form={packageForm} layout="vertical" initialValues={{ topicDate: today }}>
        <Form.Item name="topicDate" label="主题日期" rules={[{ required: true, message: '请选择日期' }]}><Input placeholder="YYYY-MM-DD" /></Form.Item>
        <Form.Item name="operatorUserIds" label="运营人员" rules={[{ required: true, message: '请选择运营人员' }]}><Select mode="multiple" options={userOptions(operatorUsers)} /></Form.Item>
        <Form.Item name="mediaUserIds" label="媒体人员" rules={[{ required: true, message: '请选择媒体人员' }]}><Select mode="multiple" options={userOptions(mediaUsers)} /></Form.Item>
        <Form.Item name="anchorUserIds" label="主播老师" rules={[{ required: true, message: '请选择主播老师' }]}><Select mode="multiple" options={userOptions(anchorUsers)} placeholder="请选择主播1/主播2/主播3" /></Form.Item>
      </Form>
    </Modal>`;

  if (!text.includes('name="anchorUserIds"')) {
    const next = text.replace(modalRegex, modalReplacement);
    if (next === text) throw new Error('Patch failed: cannot replace create package modal');
    text = next;
  }

  writeIfChanged(pagePath, text);
}

patchApi();
patchPage();
console.log('[anchor-dataops] patched OperationDataPage and dataOps API successfully.');
