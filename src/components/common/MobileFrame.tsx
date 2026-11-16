/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col overflow-x-hidden">
      <div className="flex-1 w-full flex flex-col">
        {children}
      </div>
    </div>
  );
};
