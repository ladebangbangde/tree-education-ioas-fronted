import { Card } from 'antd';
import { PageHeader } from '@/components';

export default function FeatureClosedPage({ title = 'Closed' }: { title?: string }) {
  return <>
    <PageHeader title={title} />
    <Card>Closed</Card>
  </>;
}
