'use client';

import { useState, useEffect } from 'react';
import { Button, Badge } from '@vantage/ui';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Key,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { mfaService, type MFAStatus, type MFASecret } from '@/services/MFAService';

export function MFAManagement() {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [mfaSecret, setMfaSecret] = useState<MFASecret | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadMFAStatus();
  }, []);

  async function loadMFAStatus() {
    try {
      setIsLoading(true);
      const status = await mfaService.getStatus();
      setMfaStatus(status);
    } catch (error: any) {
      setError('Failed to load MFA status');
      console.error('Failed to load MFA status:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateSecret() {
    try {
      setIsLoading(true);
      setError(null);
      const secret = await mfaService.generateSecret();
      setMfaSecret(secret);
      setIsEnabling(true);
    } catch (error: any) {
      setError(error.message || 'Failed to generate MFA secret');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEnableMFA() {
    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await mfaService.enableMFA(verificationCode);
      setBackupCodes(result.backupCodes);
      setSuccess('MFA enabled successfully!');
      setIsEnabling(false);
      setMfaSecret(null);
      setVerificationCode('');
      await loadMFAStatus();
    } catch (error: any) {
      setError(error.message || 'Failed to enable MFA');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisableMFA() {
    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await mfaService.disableMFA(verificationCode);
      setSuccess('MFA disabled successfully');
      setIsDisabling(false);
      setVerificationCode('');
      await loadMFAStatus();
    } catch (error: any) {
      setError(error.message || 'Failed to disable MFA');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopySecret() {
    if (mfaSecret) {
      await navigator.clipboard.writeText(mfaSecret.secret);
      setSuccess('Secret copied to clipboard');
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  async function handleCopyBackupCodes() {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setSuccess('Backup codes copied to clipboard');
    setTimeout(() => setSuccess(null), 3000);
  }

  if (isLoading && !mfaStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Two-Factor Authentication</h2>
            <p className="text-slate-400 text-sm">
              Add an extra layer of security to your account
            </p>
          </div>
        </div>
        {mfaStatus?.enabled && (
          <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Enabled
          </Badge>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-600/10 border border-green-600/30 text-green-400 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-600/10 border border-red-600/30 text-red-400 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* MFA Not Enabled */}
      {!mfaStatus?.enabled && !isEnabling && (
        <div className="space-y-4">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <h3 className="font-medium text-white mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-amber-400" />
              How to set up 2FA
            </h3>
            <ol className="space-y-2 text-sm text-slate-400">
              <li>1. Install an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>2. Scan the QR code or enter the secret key manually</li>
              <li>3. Enter the 6-digit code from the app to verify</li>
            </ol>
          </div>
          <Button
            onClick={handleGenerateSecret}
            className="bg-amber-600 hover:bg-amber-500 text-white"
          >
            <Shield className="h-4 w-4 mr-2" />
            Set Up Two-Factor Authentication
          </Button>
        </div>
      )}

      {/* MFA Setup Flow */}
      {isEnabling && mfaSecret && (
        <div className="space-y-6">
          {/* QR Code */}
          <div className="bg-white rounded-lg p-6 inline-block">
            {/* In production, render actual QR code from mfaSecret.qrCode */}
            <div className="w-48 h-48 bg-slate-900 flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaSecret.otpauthUrl)}`}
                alt="MFA QR Code"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Secret Key (for manual entry)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mfaSecret.secret}
                readOnly
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={handleCopySecret}
                className="border-slate-700 text-slate-300"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Verification Code */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center text-2xl tracking-widest font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEnabling(false);
                setMfaSecret(null);
              }}
              className="flex-1 border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnableMFA}
              disabled={verificationCode.length !== 6 || isLoading}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable 2FA'}
            </Button>
          </div>
        </div>
      )}

      {/* MFA Enabled - Disable Flow */}
      {mfaStatus?.enabled && isDisabling && (
        <div className="space-y-4">
          <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
            <p className="text-sm text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Enter your authentication code to disable 2FA
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDisabling(false);
                setVerificationCode('');
              }}
              className="flex-1 border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisableMFA}
              disabled={verificationCode.length !== 6 || isLoading}
              className="flex-1"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable 2FA'}
            </Button>
          </div>
        </div>
      )}

      {/* MFA Enabled - Status */}
      {mfaStatus?.enabled && !isDisabling && (
        <div className="space-y-4">
          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
            <p className="text-sm text-green-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Two-factor authentication is enabled for your account
            </p>
          </div>

          {mfaStatus.backupCodesRemaining !== undefined && (
            <div className="text-sm text-slate-400">
              Backup codes remaining: <span className="text-white font-medium">{mfaStatus.backupCodesRemaining}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => setIsDisabling(true)}
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Disable 2FA
            </Button>
            <Button
              onClick={handleGenerateSecret}
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Keys
            </Button>
          </div>
        </div>
      )}

      {/* Backup Codes Display */}
      {backupCodes.length > 0 && (
        <div className="mt-6 border-t border-slate-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              Backup Codes
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyBackupCodes}
              className="text-slate-400 hover:text-white"
            >
              <Copy className="h-3 w-3 mr-1.5" />
              Copy All
            </Button>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-slate-800 rounded px-3 py-2 font-mono text-sm text-slate-300"
                >
                  {code}
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-400 mt-4 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Store these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MFAManagement;
