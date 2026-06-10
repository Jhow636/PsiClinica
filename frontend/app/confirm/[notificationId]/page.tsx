import { ConfirmationResult } from './confirmation-result';

interface PageProps {
  params: Promise<{ notificationId: string }>;
  searchParams: Promise<{ action?: string }>;
}

export default async function ConfirmPage({ params, searchParams }: PageProps) {
  const { notificationId } = await params;
  const { action } = await searchParams;

  return <ConfirmationResult notificationId={notificationId} action={action} />;
}
