import { Tag } from 'antd';
const mapper:Record<string,string>={
  '跟进中':'processing','高意向':'success','新线索':'blue','无效':'default','已签约':'success','申请中':'processing','已完成':'success','超时':'error',
  '待补充':'warning','进行中':'processing','已录取':'success','有条件录取':'gold','审理中':'processing','启用':'success','停用':'default'
};
export default function StatusTag({status}:{status:string}){return <Tag className='status-tag' color={mapper[status]||'default'}>{status}</Tag>}
