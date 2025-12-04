'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleCallback } from '@/lib/spotify';
/// this took me way too long to figure out i hate spotify i love spotify SPONSER ME GIVE ME AN INTERNSHIP IT IS MORNING. 
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const error = searchParams.get('error');
      if (error) {
        setStatus('error');
        setErrorMessage(
          error === 'access_denied'
            ? 'You denied access to your Spotify account.'
            : `Spotify error: ${error}`
        );
        return;
      }
      /// let it be known it's 5:54am as i'm typing this. Thursday December 4th. 
      const code = searchParams.get('code');
      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code received from Spotify.');
        return;
      }

      try {
        await handleCallback(code);
        setStatus('success');
        
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to complete login');
      }
    };
/// so many error codes becuase once I make this public I need to give myself some backdoor to the issues found all the way in the latest working code
    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Connecting to Spotify...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-lg">Connected!</p>
            <p className="text-gray-400 text-sm mt-2">Redirecting to FullCircle...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white text-lg">Connection Failed</p>
            <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-[#1DB954] text-white rounded-full hover:bg-[#1ed760] transition"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}