import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Paperclip, Smile, Mic, Square, PenTool, X } from 'lucide-react';
import { BrutalistButton } from './BrutalistButton';
import { GifPicker } from './GifPicker';
import { EmojiPicker } from './EmojiPicker';
import { FileUploader } from './FileUploader';
import { playMessageSend, playMechanicalClick } from '../services/audio';

interface MessageComposerProps {
  onSendMessage: (content: string, type?: 'text' | 'gif' | 'file' | 'audio', fileData?: any) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onOpenWhiteboard?: () => void;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onOpenWhiteboard,
  disabled
}) => {
  const [text, setText] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUploader, setShowFileUploader] = useState(false);

  // Audio Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    onTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
    }, 2000);
  };

  const handleSendText = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    playMessageSend();
    onSendMessage(trimmed, 'text');
    setText('');
    onTypingStop();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendMessage(base64Audio, 'audio');
          playMessageSend();
        };
        reader.readAsDataURL(audioBlob);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[VOICE_REC_ERROR]', err);
      alert('MICROPHONE PERMISSION DENIED OR NOT FOUND');
    }
  };

  const stopVoiceRecording = (send: boolean) => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (send) {
      mediaRecorderRef.current.stop();
    } else {
      // Discard
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      audioChunksRef.current = [];
    }

    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const formatRecTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full bg-ink border-t-2 border-offwhite/30 p-2 sm:p-3">
      {/* Popovers */}
      {showGifPicker && (
        <GifPicker
          onSelectGif={(url) => {
            onSendMessage(url, 'gif');
            playMessageSend();
          }}
          onClose={() => setShowGifPicker(false)}
        />
      )}

      {showEmojiPicker && (
        <EmojiPicker
          onSelectEmoji={(emoji) => setText((prev) => prev + emoji)}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {showFileUploader && (
        <FileUploader
          onSendFile={(fileData) => {
            onSendMessage(`FILE: ${fileData.name}`, 'file', fileData);
            playMessageSend();
          }}
          onClose={() => setShowFileUploader(false)}
        />
      )}

      {/* Top action toolbar row */}
      <div className="flex items-center justify-between pb-2 mb-1 gap-1 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => {
              playMechanicalClick();
              setShowGifPicker((prev) => !prev);
              setShowEmojiPicker(false);
            }}
            className={`px-2 py-1 border transition-colors flex items-center gap-1 font-bold ${
              showGifPicker
                ? 'bg-acid text-ink border-acid'
                : 'border-offwhite/30 text-offwhite/70 hover:border-acid hover:text-acid bg-ink-800'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>[ GIF ]</span>
          </button>

          <button
            onClick={() => {
              playMechanicalClick();
              if (onOpenWhiteboard) onOpenWhiteboard();
            }}
            className="px-2 py-1 border border-offwhite/30 text-offwhite/70 hover:border-cyber hover:text-cyber bg-ink-800 transition-colors flex items-center gap-1 font-bold"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>[ DRAW ]</span>
          </button>

          <button
            onClick={() => {
              playMechanicalClick();
              setShowFileUploader(true);
            }}
            className="px-2 py-1 border border-offwhite/30 text-offwhite/70 hover:border-acid hover:text-acid bg-ink-800 transition-colors flex items-center gap-1 font-bold"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>[ FILE ]</span>
          </button>

          <button
            onClick={() => {
              playMechanicalClick();
              setShowEmojiPicker((prev) => !prev);
              setShowGifPicker(false);
            }}
            className={`px-2 py-1 border transition-colors flex items-center gap-1 font-bold ${
              showEmojiPicker
                ? 'bg-cyber text-ink border-cyber'
                : 'border-offwhite/30 text-offwhite/70 hover:border-cyber hover:text-cyber bg-ink-800'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>[ EMOJI ]</span>
          </button>
        </div>

        {/* Micro status on right */}
        <div className="hidden sm:block text-[10px] text-offwhite/40 tracking-wider">
          ENCRYPTED_P2P_TUNNEL
        </div>
      </div>

      {/* Main Terminal Input or Voice Recording Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between border-2 border-danger bg-danger/10 px-3 py-2 text-danger font-mono text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-danger rounded-full animate-ping" />
            <span className="font-bold tracking-widest">RECORDING_AUDIO_LOG...</span>
            <span className="font-bold text-offwhite">{formatRecTime(recordingSeconds)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => stopVoiceRecording(false)}
              className="p-1 border border-danger hover:bg-danger hover:text-ink text-danger transition-colors font-bold text-[10px]"
              title="Discard Recording"
            >
              <X className="w-4 h-4" />
            </button>
            <BrutalistButton
              variant="danger"
              size="sm"
              onClick={() => stopVoiceRecording(true)}
            >
              <Square className="w-3.5 h-3.5 mr-1 fill-current" />
              TRANSMIT
            </BrutalistButton>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2 border-2 border-offwhite bg-ink p-1.5 focus-within:border-acid shadow-brutal-white transition-all">
          <span className="font-mono text-acid text-base font-bold pl-2 pb-1.5 select-none">
            &gt;
          </span>
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="TYPE_MESSAGE..."
            className="flex-1 bg-transparent font-mono text-sm sm:text-base text-offwhite placeholder-offwhite/30 resize-none focus:outline-none py-1 max-h-32 min-h-[28px]"
          />

          {/* Voice Record Mic Trigger */}
          <button
            onClick={startVoiceRecording}
            title="Hold/Click to record voice log"
            className="p-2 border border-offwhite/30 hover:border-danger hover:text-danger text-offwhite/60 bg-ink-800 transition-colors mb-0.5"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <BrutalistButton
            variant="primary"
            size="sm"
            onClick={handleSendText}
            disabled={!text.trim() || disabled}
            className="mb-0.5 font-bold"
          >
            <span>SEND</span>
            <Send className="w-3.5 h-3.5 ml-1" />
          </BrutalistButton>
        </div>
      )}
    </div>
  );
};
