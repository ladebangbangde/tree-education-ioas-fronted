const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function patchFile(relativePath, patches) {
  const file = path.join(root, relativePath);
  let text = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const patch of patches) {
    if (patch.skip && text.includes(patch.skip)) continue;
    const next = text.replace(patch.find, patch.replace);
    if (next !== text) {
      text = next;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(file, text, 'utf8');
}

patchFile('src/api/dataOps.ts', [
  {
    skip: 'anchor_user_ids?:',
    find: "  media_names?: string;\n  mediaNames?: string;\n  status?: string;",
    replace: "  media_names?: string;\n  mediaNames?: string;\n  anchor_user_ids?: string;\n  anchorUserIds?: string;\n  anchor_names?: string;\n  anchorNames?: string;\n  status?: string;"
  },
  {
    skip: 'async anchorUsers()',
    find: "  async userOptions(role: DataOpsUserRole) {\n    const res = await client.get('/data-ops/users', { params: { role } });\n    return unwrapResponse<DataOpsUserOption[]>(res.data);\n  },",
    replace: "  async userOptions(role: DataOpsUserRole) {\n    const res = await client.get('/data-ops/users', { params: { role } });\n    return unwrapResponse<DataOpsUserOption[]>(res.data);\n  },\n  async anchorUsers() {\n    const res = await client.get('/data-ops/anchor-users');\n    return unwrapResponse<DataOpsUserOption[]>(res.data);\n  },"
  },
  {
    skip: 'anchorUserIds?: number[]',
    find: "  async createPackage(payload: { topicDate?: string; operatorUserIds: number[]; mediaUserIds: number[] }) {\n    const res = await client.post('/data-ops/packages', payload);\n    return normalizePackage(unwrapResponse<DataOpsPackage>(res.data));\n  },",
    replace: "  async createPackage(payload: { topicDate?: string; operatorUserIds: number[]; mediaUserIds: number[]; anchorUserIds?: number[] }) {\n    const endpoint = payload.anchorUserIds?.length ? '/data-ops/packages-with-anchor' : '/data-ops/packages';\n    const res = await client.post(endpoint, payload);\n    return normalizePackage(unwrapResponse<DataOpsPackage>(res.data));\n  },"
  }
]);

patchFile('src/pages/dataOps/OperationDataPage.tsx', [
  {
    skip: 'const [anchorUsers, setAnchorUsers]',
    find: "  const [operatorUsers, setOperatorUsers] = useState<DataOpsUserOption[]>([]);\n  const [mediaUsers, setMediaUsers] = useState<DataOpsUserOption[]>([]);",
    replace: "  const [operatorUsers, setOperatorUsers] = useState<DataOpsUserOption[]>([]);\n  const [mediaUsers, setMediaUsers] = useState<DataOpsUserOption[]>([]);\n  const [anchorUsers, setAnchorUsers] = useState<DataOpsUserOption[]>([]);"
  },
  {
    skip: "dataOpsApi.anchorUsers()",
    find: "    Promise.all([dataOpsApi.userOptions('OPERATOR'), dataOpsApi.userOptions('MEDIA')])\n      .then(([o, m]) => { setOperatorUsers(o || []); setMediaUsers(m || []); })",
    replace: "    Promise.all([dataOpsApi.userOptions('OPERATOR'), dataOpsApi.userOptions('MEDIA'), dataOpsApi.anchorUsers()])\n      .then(([o, m, a]) => { setOperatorUsers(o || []); setMediaUsers(m || []); setAnchorUsers(a || []); })"
  },
  {
    skip: 'anchorUserIds: v.anchorUserIds.map(Number)',
    find: "      const created = await dataOpsApi.createPackage({ topicDate: v.topicDate || today, operatorUserIds: v.operatorUserIds.map(Number), mediaUserIds: v.mediaUserIds.map(Number) });",
    replace: "      const created = await dataOpsApi.createPackage({ topicDate: v.topicDate || today, operatorUserIds: v.operatorUserIds.map(Number), mediaUserIds: v.mediaUserIds.map(Number), anchorUserIds: v.anchorUserIds.map(Number) });"
  },
  {
    skip: 'name=\"anchorUserIds\"',
    find: "    <Modal title=\"创建主题包\" open={packageOpen} onCancel={() => setPackageOpen(false)} onOk={createPackage} confirmLoading={packageSubmitting} destroyOnClose><Form form={packageForm} layout=\"vertical\" initialValues={{ topicDate: today }}><Form.Item name=\"topicDate\" label=\"主题日期\" rules={[{ required: true, message: '请选择日期' }]}><Input placeholder=\"YYYY-MM-DD\" /></Form.Item><Form.Item name=\"operatorUserIds\" label=\"运营人员\" rules={[{ required: true, message: '请选择运营人员' }]}><Select mode=\"multiple\" options={userOptions(operatorUsers)} /></Form.Item><Form.Item name=\"mediaUserIds\" label=\"媒体人员\" rules={[{ required: true, message: '请选择媒体人员' }]}><Select mode=\"multiple\" options={userOptions(mediaUsers)} /></Form.Item></Form></Modal>",
    replace: "    <Modal title=\"创建主题包\" open={packageOpen} onCancel={() => setPackageOpen(false)} onOk={createPackage} confirmLoading={packageSubmitting} destroyOnClose>\n      <Form form={packageForm} layout=\"vertical\" initialValues={{ topicDate: today }}>\n        <Form.Item name=\"topicDate\" label=\"主题日期\" rules={[{ required: true, message: '请选择日期' }]}><Input placeholder=\"YYYY-MM-DD\" /></Form.Item>\n        <Form.Item name=\"operatorUserIds\" label=\"运营人员\" rules={[{ required: true, message: '请选择运营人员' }]}><Select mode=\"multiple\" options={userOptions(operatorUsers)} /></Form.Item>\n        <Form.Item name=\"mediaUserIds\" label=\"媒体人员\" rules={[{ required: true, message: '请选择媒体人员' }]}><Select mode=\"multiple\" options={userOptions(mediaUsers)} /></Form.Item>\n        <Form.Item name=\"anchorUserIds\" label=\"主播人员\" rules={[{ required: true, message: '请选择主播人员' }]}><Select mode=\"multiple\" options={userOptions(anchorUsers)} placeholder=\"请选择主播1/主播2/主播3\" /></Form.Item>\n      </Form>\n    </Modal>"
  }
]);
