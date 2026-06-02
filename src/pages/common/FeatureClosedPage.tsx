import { Card, Empty } from 'antd';
import { PageHeader } from '@/components';

export default function FeatureClosedPage({ title = '\u8be5\u529f\u80fd\u672a\u5f00\u653e' }: { title?: string }) {
  return <>
    <PageHeader title={title} />
    <Card>
      <Empty description='\u8be5\u529f\u80fd\u672a\u5f00\u653e' />
    </Card>
  </>;
}
