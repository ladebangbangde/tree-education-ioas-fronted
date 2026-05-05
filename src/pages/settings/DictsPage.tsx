import { Segmented } from 'antd';
import { useMemo, useState } from 'react';
import { DataTable, PageHeader } from '@/components';

const dictMap={
  国家字典:[{key:'UK',value:'英国'},{key:'US',value:'美国'},{key:'CA',value:'加拿大'},{key:'AU',value:'澳大利亚'},{key:'SG',value:'新加坡'},{key:'HK',value:'中国香港'}],
  渠道字典:[{key:'官网咨询',value:'官网咨询'},{key:'微信咨询',value:'微信咨询'},{key:'小红书',value:'小红书'},{key:'抖音',value:'抖音'},{key:'渠道合作',value:'渠道合作'}],
  线索状态:[{key:'新线索',value:'新线索'},{key:'跟进中',value:'跟进中'},{key:'高意向',value:'高意向'},{key:'已签约',value:'已签约'}],
  申请阶段:[{key:'选校规划',value:'选校规划'},{key:'文书准备',value:'文书准备'},{key:'网申提交',value:'网申提交'},{key:'Offer跟进',value:'Offer跟进'},{key:'签证办理',value:'签证办理'},{key:'行前准备',value:'行前准备'}]
};

export default function DictsPage(){const [tab,setTab]=useState<keyof typeof dictMap>('国家字典');const data=useMemo(()=>dictMap[tab],[tab]);return <><PageHeader title='字典配置'/><Segmented options={Object.keys(dictMap)} value={tab} onChange={(v)=>setTab(v as keyof typeof dictMap)} className='mb12'/><DataTable rowKey='key' columns={[{title:'编码',dataIndex:'key'},{title:'名称',dataIndex:'value'}]} dataSource={data} pagination={false}/></>}
