import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, QrCode } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';

interface QrCodeModalProps {
  roomId: string;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ roomId, onClose }) => {
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}?room=${roomId}`;

  useEffect(() => {
    QRCode.toString(inviteUrl, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#090909',
        light: '#B6FF00'
      }
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error(err));
  }, [inviteUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VEIL// Ephemeral Room ${roomId}`,
          text: `Join temporary private room ${roomId}. Talk. Draw. Call. Then disappear.`,
          url: inviteUrl
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-ink-900 border-2 border-offwhite shadow-brutal-white p-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-ink-600">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-acid uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>INVITATION_MATRIX // QR</span>
          </div>
          <button onClick={onClose} className="text-offwhite/60 hover:text-danger p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Display */}
        <div className="bg-acid p-3 border-2 border-offwhite shadow-brutal flex justify-center items-center my-3">
          {qrSvg ? (
            <div
              className="w-48 h-48 [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center font-mono text-xs text-ink font-bold">
              GENERATING_CODE...
            </div>
          )}
        </div>

        {/* URL Box */}
        <div className="p-2 bg-ink border border-offwhite/30 text-[11px] font-mono text-offwhite/70 break-all mb-4 select-all">
          {inviteUrl}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <BrutalistButton
            variant="primary"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                COPIED ✓
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                COPY LINK
              </>
            )}
          </BrutalistButton>

          <BrutalistButton
            variant="cyber"
            size="sm"
            onClick={handleShare}
            className="flex-1"
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            SHARE
          </BrutalistButton>
        </div>
      </div>
    </div>
  );
};
