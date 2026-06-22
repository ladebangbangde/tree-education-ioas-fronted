const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'src/pages/dataOps/OperationDataPage.tsx');
const apiPath = path.join(root, 'src/api/dataOps.ts');

function writeIfChanged(file, next) {
  const current = fs.readFileSync(file, 'utf8');
  if (current !== next) fs.writeFileSync(file, next, 'utf8');
}

function warnSkip(label) {
  console.warn(`[anchor-dataops] skip ${label}: insertion point not found`);
}

function ensureIncludes(text, needle, insertAfter, insertion, label) {
  if (text.includes(needle)) return text;

  if (text.includes(insertAfter)) {
    return text.replace(insertAfter, `${insertAfter}${insertion}`);
  }

  const crlfInsertAfter = insertAfter.replace(/\n/g, '\r\n');
  const crlfInsertion = insertion.replace(/\n/g, '\r\n');
  if (text.includes(crlfInsertAfter)) {
    return text.replace(crlfInsertAfter, `${crlfInsertAfter}${crlfInsertion}`);
  }

  warnSkip(label);
  return text;
}

function ensureReplace(text, marker, find, replace, label) {
  if (text.includes(marker)) return text;

  let next = text.replace(find, replace);
  if (next !== text) return next;

  const crlfFind = find.replace(/\n/g, '\r\n');
  const crlfReplace = replace.replace(/\n/g, '\r\n');
  next = text.replace(crlfFind, crlfReplace);
  if (next !== text) return next;

  warnSkip(label);
  return text;
}

function ensureReplaceRegex(text, marker, regex, replacement, label) {
  if (text.includes(marker)) return text;
  const next = text.replace(regex, replacement);
  if (next === text) {
    warnSkip(label);
    return text;
  }
  return next;
}

function patchApi() {
  let text = fs.readFileSync(apiPath, 'utf8');

  text = ensureIncludes(
    text,
    'display_name_zh?: string;',
    '  displayName?: string;\n',
    '  display_name_zh?: string;\n  displayNameZh?: string;\n',
    'DataOpsUserOption Chinese display fields'
  );

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

  text = ensureReplaceRegex(
    text,
    'display_name_zh',
    /function userOptions\(rows: DataOpsUserOption\[\]\) \{ return rows\.map\(row => \(\{ value: row\.id, label: `\$\{pick<string>\(row, 'display_name', 'displayName'\) \|\| row\.username \|\| row\.id\}\$\{row\.department \? ` · \$\{row\.department\}` : ''\}` \}\)\); \}/,
    "function userOptions(rows: DataOpsUserOption[]) { return rows.map(row => ({ value: row.id, label: `${pick<string>(row as any, 'display_name_zh', 'displayNameZh') || pick<string>(row, 'display_name', 'displayName') || row.username || row.id}${row.department ? ` · ${row.department}` : ''}` })); }\nfunction userOptionsWithNone(rows: DataOpsUserOption[], noneLabel: string, noneValue: number) { return [{ value: noneValue, label: noneLabel }, ...userOptions(rows)]; }",
    'Chinese user option labels and none options'
  );

  if (!text.includes('function userOptionsWithNone')) {
    text = ensureIncludes(
      text,
      'function userOptionsWithNone',
      "function userOptions(rows: DataOpsUserOption[]) { return rows.map(row => ({ value: row.id, label: `${pick<string>(row as any, 'display_name_zh', 'displayNameZh') || pick<string>(row, 'display_name', 'displayName') || row.username || row.id}${row.department ? ` · ${row.department}` : ''}` })); }\n",
      "function userOptionsWithNone(rows: DataOpsUserOption[], noneLabel: string, noneValue: number) { return [{ value: noneValue, label: noneLabel }, ...userOptions(rows)]; }\n",
      'none role options helper'
    );
  }

  text = ensureReplaceRegex(
    text,
    'const [anchorUsers, setAnchorUsers]',
    /^(\s*const \[mediaUsers, setMediaUsers\] = useState<DataOpsUserOption\[\]>\(\[\]\);)(\r?\n)/m,
    '$1$2  const [anchorUsers, setAnchorUsers] = useState<DataOpsUserOption[]>([]);$2',
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
        <Form.Item name="operatorUserIds" label="运营人员" rules={[{ required: true, message: '请选择运营人员或无运营' }]}><Select mode="multiple" options={userOptionsWithNone(operatorUsers, '无运营', -1)} placeholder="可选择多个运营；无人负责则选无运营" /></Form.Item>
        <Form.Item name="mediaUserIds" label="媒体/美工人员" rules={[{ required: true, message: '请选择媒体/美工人员或无美工' }]}><Select mode="multiple" options={userOptionsWithNone(mediaUsers, '无美工', -2)} placeholder="可选择多个媒体/美工；无人负责则选无美工" /></Form.Item>
        <Form.Item name="anchorUserIds" label="负责口播/主播" rules={[{ required: true, message: '请选择负责口播人员或无主播' }]}><Select mode="multiple" options={userOptionsWithNone(anchorUsers, '无主播', -3)} placeholder="可选择多名口播/主播；无人负责则选无主播" /></Form.Item>
      </Form>
    </Modal>`;

  if (!text.includes('userOptionsWithNone(operatorUsers') || !text.includes('name="anchorUserIds"')) {
    const next = text.replace(modalRegex, modalReplacement);
    if (next === text) warnSkip('create package modal');
    else text = next;
  }

  writeIfChanged(pagePath, text);
}

patchApi();
patchPage();
console.log('[anchor-dataops] patch completed.');
