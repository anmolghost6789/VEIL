import { getSocket } from './socket';

export interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onRemoteScreenStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onCallEnded: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private roomId: string | null = null;
  private callbacks: WebRTCCallbacks | null = null;

  public init(roomId: string, callbacks: WebRTCCallbacks) {
    this.roomId = roomId;
    this.callbacks = callbacks;
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    const socket = getSocket();

    socket.off('call:offer');
    socket.off('call:answer');
    socket.off('call:ice');
    socket.off('call:ended');

    socket.on('call:offer', async ({ offer, senderSocketId }) => {
      console.log('[WEBRTC] Received offer from', senderSocketId);
      await this.handleOffer(offer);
    });

    socket.on('call:answer', async ({ answer, senderSocketId }) => {
      console.log('[WEBRTC] Received answer from', senderSocketId);
      await this.handleAnswer(answer);
    });

    socket.on('call:ice', async ({ candidate }) => {
      if (candidate && this.peerConnection) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('[WEBRTC] Error adding ICE candidate', e);
        }
      }
    });

    socket.on('call:ended', () => {
      this.cleanup();
      this.callbacks?.onCallEnded();
    });
  }

  private createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      return this.peerConnection;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnection = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && this.roomId) {
        getSocket().emit('call:ice', {
          roomId: this.roomId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WEBRTC] Received remote track', event.track.kind);
      if (event.streams && event.streams[0]) {
        this.callbacks?.onRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WEBRTC] Connection state changed:', pc.connectionState);
      this.callbacks?.onConnectionStateChange(pc.connectionState);
    };

    // Add existing local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    return pc;
  }

  public async startLocalMedia(video = true, audio = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: audio
      });
      this.localStream = stream;

      // Update media status
      getSocket().emit('media:toggle', {
        audio: audio,
        video: video,
        screen: false
      });

      return stream;
    } catch (err) {
      console.error('[WEBRTC] Error getting user media:', err);
      throw err;
    }
  }

  public async startCall(): Promise<void> {
    const pc = this.createPeerConnection();
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await pc.setLocalDescription(offer);

    if (this.roomId) {
      getSocket().emit('call:offer', {
        roomId: this.roomId,
        offer
      });
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.createPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (this.roomId) {
      getSocket().emit('call:answer', {
        roomId: this.roomId,
        answer
      });
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  public async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      this.localScreenStream = screenStream;

      if (this.peerConnection) {
        const videoTrack = screenStream.getVideoTracks()[0];
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');

        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        } else {
          this.peerConnection.addTrack(videoTrack, screenStream);
        }

        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }

      getSocket().emit('media:toggle', { screen: true });
      return screenStream;
    } catch (err) {
      console.error('[WEBRTC] Screen share error:', err);
      throw err;
    }
  }

  public stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(t => t.stop());
      this.localScreenStream = null;

      // Revert back to camera track if exists
      if (this.peerConnection && this.localStream) {
        const camTrack = this.localStream.getVideoTracks()[0];
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender && camTrack) {
          videoSender.replaceTrack(camTrack);
        }
      }

      getSocket().emit('media:toggle', { screen: false });
    }
  }

  public toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      getSocket().emit('media:toggle', { audio: enabled });
    }
  }

  public toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      getSocket().emit('media:toggle', { video: enabled });
    }
  }

  public endCall() {
    if (this.roomId) {
      getSocket().emit('call:end', { roomId: this.roomId });
    }
    this.cleanup();
  }

  public cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(t => t.stop());
      this.localScreenStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

export const webrtcService = new WebRTCService();
