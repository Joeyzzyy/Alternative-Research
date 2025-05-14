'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import HtmlPreview from '../../../components/common/sections/page-edit';

export default function PageEditPage({ params }) {
  const { id } = use(params);

  if (!id) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <HtmlPreview pageId={id} />
    </div>
  );
}