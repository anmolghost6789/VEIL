import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, Check } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';

interface FileUploaderProps {
  onSendFile: (fileData: { name: string; size: number; type: string; url: string }) => void;
  onClose: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onSendFile, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limit to 20MB for ephemeral transfer
      if (file.size > 20 * 1024 * 1024) {
        alert('FILE EXCEEDS MAXIMUM EPHEMERAL BUFFER (20MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setUploadProgress(20);

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    };

    reader.onload = () => {
      setUploadProgress(100);
      setTimeout(() => {
        onSendFile({
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          url: reader.result as string
        });
        onClose();
      }, 300);
    };

    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-ink-900 border-2 border-offwhite shadow-brutal-white p-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 mb-4 border-b border-ink-600">
          <div className="font-mono text-xs font-bold text-cyber uppercase tracking-widest flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>EPHEMERAL_FILE_TRANSFER</span>
          </div>
          <button onClick={onClose} className="text-offwhite/60 hover:text-danger">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-offwhite/40 hover:border-acid p-8 text-center cursor-pointer transition-colors group bg-ink"
          >
            <UploadCloud className="w-10 h-10 mx-auto mb-2 text-offwhite/50 group-hover:text-acid transition-colors" />
            <div className="font-mono text-xs uppercase font-bold text-offwhite group-hover:text-acid">
              CLICK OR DROP FILE TO BUFFER
            </div>
            <div className="font-mono text-[10px] text-offwhite/40 mt-1">
              MAX SIZE: 20MB // EXPUNGED AFTER ROOM TTL
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-offwhite/30 p-3 bg-ink flex items-center gap-3">
              <File className="w-6 h-6 text-acid flex-shrink-0" />
              <div className="flex-1 min-w-0 font-mono text-xs">
                <div className="truncate font-bold text-offwhite">{selectedFile.name}</div>
                <div className="text-[10px] text-offwhite/50">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB // {selectedFile.type || 'RAW_BIN'}
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-offwhite/40 hover:text-danger p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transfer progress bar */}
            {isProcessing && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-cyber">
                  <span>TRANSFERRING_TO_RELAY...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-ink border border-ink-600 overflow-hidden">
                  <div
                    className="h-full bg-cyber transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <BrutalistButton variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
                CANCEL
              </BrutalistButton>
              <BrutalistButton
                variant="primary"
                size="sm"
                onClick={handleUpload}
                disabled={isProcessing}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                TRANSMIT FILE
              </BrutalistButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
