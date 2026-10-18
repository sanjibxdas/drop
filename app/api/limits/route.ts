import { NextResponse } from 'next/server';
import { getDataStore } from '@/lib/datastore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const datastore = getDataStore();
  const limits = datastore.getLimits();

  return NextResponse.json({
    operational_limits: {
      max_file_size_bytes: limits.maxFileSizeBytes,
      max_file_size_mb: limits.maxFileSizeBytes / (1024 * 1024),
      max_zip_size_bytes: limits.maxZipSizeBytes,
      max_zip_size_mb: limits.maxZipSizeBytes / (1024 * 1024),
      max_uncompressed_bytes: limits.maxUncompressedBytes,
      max_uncompressed_mb: limits.maxUncompressedBytes / (1024 * 1024),
      max_files_per_drop: limits.maxFilesPerDrop,
      default_ttl_hours: limits.defaultTtlHours,
    },
    policy: {
      pricing: '100% Free for everyone',
      commercial_use: 'Permitted',
      branding_injected: false,
      account_required: false,
      https_enforced: true,
      custom_slugs_free: true,
      password_protection_free: true,
      api_access_free: true,
    },
  });
}
