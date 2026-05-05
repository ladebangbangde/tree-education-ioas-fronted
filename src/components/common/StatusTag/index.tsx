import { Tag } from 'antd';
const mapper:Record<string,string>={'跟进中':'processing','高意向':'success','新线索':'blue','无效':'default','已签约':'success','申请中':'processing','已完成':'success','超时':'error'};
export default function StatusTag({status}:{status:string}){return <Tag color={mapper[status]||'default'}>{status}</Tag>}
