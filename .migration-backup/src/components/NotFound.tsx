/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg-muted)', fontFamily: 'var(--font)' }}
    >
      <div
        className="anim-fade-up max-w-md w-full text-center p-10 rounded-2xl"
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--orange-bg)', color: 'var(--primary)' }}
        >
          <Compass className="w-8 h-8" strokeWidth={1.6} />
        </div>
        <div className="tag" style={{ color: 'var(--primary)' }}>
          Route not found
        </div>
        <h1
          className="heading-lg"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 8, marginBottom: 12 }}
        >
          Nothing lives here.
        </h1>
        <p className="subtitle" style={{ fontSize: 15, margin: '0 auto 28px' }}>
          The page you're looking for either moved or was never
          part of the workspace. Head back to the overview to keep going.
        </p>
        <Link
          href="/overview"
          className="btn btn-primary btn-sm"
          style={{ textDecoration: 'none', display: 'inline-flex' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Link>
      </div>
    </div>
  );
}
