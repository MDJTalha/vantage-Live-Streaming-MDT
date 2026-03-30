$content = Get-Content "c:\Projects\Live-Streaming-\apps\web\src\app\account\billing\page.tsx" -Raw
$tabsComponent = @'
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, Badge, Input } from '@vantage/ui';

import {
  CheckCircle,
  AlertCircle,
  Download,
  Plus,
  X,
} from 'lucide-react';

// Simple Tabs Component
function Tabs({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
}

Tabs.Content = function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
};

'@
$newContent = $tabsComponent + $content.Substring($content.IndexOf("interface UpgradeOption"))
Set-Content -Path "c:\Projects\Live-Streaming-\apps\web\src\app\account\billing\page.tsx" -Value $newContent -NoNewline
Write-Host "File updated successfully"
