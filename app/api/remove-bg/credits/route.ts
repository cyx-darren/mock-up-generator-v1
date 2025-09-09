import { NextResponse } from 'next/server';
import { checkRemoveBgCredits, isRemoveBgError } from '@/lib/remove-bg';

export async function GET() {
  try {
    const credits = await checkRemoveBgCredits();
    return NextResponse.json(credits);
  } catch (error) {
    console.error('Credits check error:', error);

    if (isRemoveBgError(error)) {
      return NextResponse.json(
        {
          error: error.title,
          detail: error.detail,
          code: error.code,
        },
        { status: error.status }
      );
    }

    return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 });
  }
}
