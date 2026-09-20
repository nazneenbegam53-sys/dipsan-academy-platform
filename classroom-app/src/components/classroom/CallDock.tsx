import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { PresenceUser } from "../../types";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type PeerMedia = {
  userId: string;
  name: string;
  stream: MediaStream | null;
  audio: boolean;
  video: boolean;
};

type Props = {
  socket: Socket | null;
  boardId: string;
  selfUserId: string;
  selfName: string;
  peers: PresenceUser[];
  /** When true, hang up and leave the call (e.g. teacher ended class). */
  forceEnded?: boolean;
};

export default function CallDock({
  socket,
  boardId,
  selfUserId,
  selfName,
  peers,
  forceEnded = false,
}: Props) {
  const [inCall, setInCall] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<PeerMedia[]>([]);

  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const inCallRef = useRef(false);
  const callPeersRef = useRef<Map<string, { name: string; audio: boolean; video: boolean }>>(
    new Map()
  );
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  inCallRef.current = inCall;
  localStreamRef.current = localStream;

  const peerName = useCallback(
    (userId: string, fallback?: string) => {
      const fromPresence = peers.find((p) => p.userId === userId)?.name;
      return fromPresence || callPeersRef.current.get(userId)?.name || fallback || "Peer";
    },
    [peers]
  );

  const upsertRemote = useCallback((entry: PeerMedia) => {
    setRemotePeers((prev) => {
      const idx = prev.findIndex((p) => p.userId === entry.userId);
      if (idx < 0) return [...prev, entry];
      const next = [...prev];
      next[idx] = { ...next[idx], ...entry };
      return next;
    });
  }, []);

  const removeRemote = useCallback((userId: string) => {
    setRemotePeers((prev) => prev.filter((p) => p.userId !== userId));
    callPeersRef.current.delete(userId);
  }, []);

  const closePc = useCallback((userId: string) => {
    const pc = pcsRef.current.get(userId);
    if (pc) {
      try {
        pc.close();
      } catch {
        /* ignore */
      }
      pcsRef.current.delete(userId);
    }
  }, []);

  const cleanupAll = useCallback(() => {
    for (const userId of Array.from(pcsRef.current.keys())) {
      closePc(userId);
    }
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    localStreamRef.current = null;
    setLocalStream(null);
    setRemotePeers([]);
    callPeersRef.current.clear();
    setInCall(false);
    inCallRef.current = false;
  }, [closePc]);

  const ensurePc = useCallback(
    (remoteUserId: string, remoteName?: string) => {
      let pc = pcsRef.current.get(remoteUserId);
      if (pc) return pc;

      pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcsRef.current.set(remoteUserId, pc);

      const stream = localStreamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }
      }

      pc.onicecandidate = (ev) => {
        if (!ev.candidate || !socket) return;
        socket.emit("webrtc:ice", {
          boardId,
          targetUserId: remoteUserId,
          candidate: ev.candidate.toJSON(),
        });
      };

      pc.ontrack = (ev) => {
        const [remoteStream] = ev.streams;
        const existing = callPeersRef.current.get(remoteUserId);
        upsertRemote({
          userId: remoteUserId,
          name: peerName(remoteUserId, remoteName),
          stream: remoteStream || null,
          audio: existing?.audio ?? true,
          video: existing?.video ?? true,
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          closePc(remoteUserId);
        }
      };

      return pc;
    },
    [boardId, closePc, peerName, socket, upsertRemote]
  );

  const createOfferTo = useCallback(
    async (remoteUserId: string, remoteName?: string) => {
      if (!socket || remoteUserId === selfUserId) return;
      const pc = ensurePc(remoteUserId, remoteName);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc:offer", {
        boardId,
        targetUserId: remoteUserId,
        sdp: pc.localDescription,
      });
    },
    [boardId, ensurePc, selfUserId, socket]
  );

  useEffect(() => {
    if (!socket) return;

    const onReady = async (payload: {
      boardId?: string;
      userId: string;
      name?: string;
      audio?: boolean;
      video?: boolean;
      peersInCall?: { userId: string; name?: string; audio?: boolean; video?: boolean }[];
      self?: boolean;
    }) => {
      if (payload.boardId && payload.boardId !== boardId) return;

      if (payload.self) {
        const others = payload.peersInCall || [];
        for (const peer of others) {
          callPeersRef.current.set(peer.userId, {
            name: peer.name || peerName(peer.userId),
            audio: peer.audio !== false,
            video: peer.video !== false,
          });
          upsertRemote({
            userId: peer.userId,
            name: peer.name || peerName(peer.userId),
            stream: null,
            audio: peer.audio !== false,
            video: peer.video !== false,
          });
          try {
            await createOfferTo(peer.userId, peer.name);
          } catch (err) {
            console.warn("Offer failed", err);
          }
        }
        return;
      }

      if (payload.userId === selfUserId) return;
      if (!inCallRef.current) return;

      callPeersRef.current.set(payload.userId, {
        name: payload.name || peerName(payload.userId),
        audio: payload.audio !== false,
        video: payload.video !== false,
      });
      upsertRemote({
        userId: payload.userId,
        name: payload.name || peerName(payload.userId),
        stream: null,
        audio: payload.audio !== false,
        video: payload.video !== false,
      });
      // Joiner creates offers; existing peers wait for offer.
    };

    const onOffer = async (payload: {
      boardId?: string;
      fromUserId: string;
      fromName?: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      if (payload.boardId && payload.boardId !== boardId) return;
      if (!inCallRef.current || !socket) return;
      if (payload.fromUserId === selfUserId) return;

      callPeersRef.current.set(payload.fromUserId, {
        name: payload.fromName || peerName(payload.fromUserId),
        audio: callPeersRef.current.get(payload.fromUserId)?.audio ?? true,
        video: callPeersRef.current.get(payload.fromUserId)?.video ?? true,
      });

      try {
        const pc = ensurePc(payload.fromUserId, payload.fromName);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          boardId,
          targetUserId: payload.fromUserId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.warn("Handle offer failed", err);
      }
    };

    const onAnswer = async (payload: {
      boardId?: string;
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      if (payload.boardId && payload.boardId !== boardId) return;
      if (!inCallRef.current) return;
      const pc = pcsRef.current.get(payload.fromUserId);
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      } catch (err) {
        console.warn("Handle answer failed", err);
      }
    };

    const onIce = async (payload: {
      boardId?: string;
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (payload.boardId && payload.boardId !== boardId) return;
      if (!inCallRef.current) return;
      const pc = pcsRef.current.get(payload.fromUserId);
      if (!pc || !payload.candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.warn("ICE add failed", err);
      }
    };

    const onState = (payload: {
      boardId?: string;
      userId: string;
      audio: boolean;
      video: boolean;
    }) => {
      if (payload.boardId && payload.boardId !== boardId) return;
      if (payload.userId === selfUserId) return;
      const existing = callPeersRef.current.get(payload.userId);
      callPeersRef.current.set(payload.userId, {
        name: existing?.name || peerName(payload.userId),
        audio: payload.audio,
        video: payload.video,
      });
      setRemotePeers((prev) =>
        prev.map((p) =>
          p.userId === payload.userId
            ? { ...p, audio: payload.audio, video: payload.video }
            : p
        )
      );
    };

    const onPeerLeft = (payload: { boardId?: string; userId: string }) => {
      if (payload.boardId && payload.boardId !== boardId) return;
      if (payload.userId === selfUserId) return;
      closePc(payload.userId);
      removeRemote(payload.userId);
    };

    socket.on("webrtc:ready", onReady);
    socket.on("webrtc:offer", onOffer);
    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice", onIce);
    socket.on("webrtc:state", onState);
    socket.on("webrtc:peer-left", onPeerLeft);

    return () => {
      socket.off("webrtc:ready", onReady);
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice", onIce);
      socket.off("webrtc:state", onState);
      socket.off("webrtc:peer-left", onPeerLeft);
    };
  }, [
    boardId,
    closePc,
    createOfferTo,
    ensurePc,
    peerName,
    removeRemote,
    selfUserId,
    socket,
    upsertRemote,
  ]);

  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localStream) {
      el.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    for (const peer of remotePeers) {
      const el = remoteVideoRefs.current.get(peer.userId);
      if (el && peer.stream && el.srcObject !== peer.stream) {
        el.srcObject = peer.stream;
      }
    }
  }, [remotePeers]);

  useEffect(() => {
    return () => {
      if (inCallRef.current && socket) {
        socket.emit("webrtc:leave", { boardId });
      }
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  async function joinCall() {
    if (!socket || joining || inCall) return;
    setJoining(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setAudioOn(true);
      setVideoOn(true);
      setInCall(true);
      inCallRef.current = true;
      socket.emit("webrtc:ready", { boardId, audio: true, video: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not access camera/microphone.";
      setError(message);
      cleanupAll();
    } finally {
      setJoining(false);
    }
  }

  function leaveCall() {
    if (socket) socket.emit("webrtc:leave", { boardId });
    cleanupAll();
    setError("");
  }

  useEffect(() => {
    if (!forceEnded) return;
    if (inCallRef.current || localStreamRef.current) {
      leaveCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceEnded]);

  function toggleMic() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !audioOn;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    setAudioOn(next);
    socket?.emit("webrtc:state", { boardId, userId: selfUserId, audio: next, video: videoOn });
  }

  function toggleCamera() {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !videoOn;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = next;
    });
    setVideoOn(next);
    socket?.emit("webrtc:state", { boardId, userId: selfUserId, audio: audioOn, video: next });
  }

  const othersOnline = peers.filter((p) => p.userId !== selfUserId);

  return (
    <div className="rounded-2xl border border-white/10 bg-charcoal/60 px-3 py-3 sm:px-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-bronze">
            Class call
          </p>
          <p className="text-xs text-mist/80">
            {inCall
              ? `Live with ${remotePeers.length} peer${remotePeers.length === 1 ? "" : "s"}`
              : othersOnline.length
                ? `${othersOnline.length} online — join to talk`
                : "Waiting for classmates"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!inCall ? (
            <button
              type="button"
              disabled={!socket || joining}
              onClick={joinCall}
              className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-champagne disabled:opacity-40"
            >
              {joining ? "Joining…" : "Join call"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleMic}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  audioOn
                    ? "border-white/15 bg-white/5 text-mist hover:border-gold/40"
                    : "border-gold/40 bg-gold/15 text-champagne"
                }`}
              >
                {audioOn ? "Mic on" : "Mic off"}
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  videoOn
                    ? "border-white/15 bg-white/5 text-mist hover:border-gold/40"
                    : "border-gold/40 bg-gold/15 text-champagne"
                }`}
              >
                {videoOn ? "Cam on" : "Cam off"}
              </button>
              <button
                type="button"
                onClick={leaveCall}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-mist transition hover:border-gold/50 hover:text-gold"
              >
                Leave
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-2 rounded-xl border border-gold/20 bg-gold/10 px-3 py-2 text-xs text-champagne">
          {error}
        </p>
      )}

      {inCall && (
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-xl border border-gold/25 bg-[#07121C]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${videoOn ? "" : "opacity-0"}`}
            />
            {!videoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-charcoal text-xs text-bronze">
                Camera off
              </div>
            )}
            <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-mist">
              You{!audioOn ? " · muted" : ""}
            </span>
          </div>

          {remotePeers.map((peer) => (
            <div
              key={peer.userId}
              className="relative h-28 w-40 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#07121C]"
            >
              <video
                ref={(el) => {
                  if (el) remoteVideoRefs.current.set(peer.userId, el);
                  else remoteVideoRefs.current.delete(peer.userId);
                }}
                autoPlay
                playsInline
                className={`h-full w-full object-cover ${peer.video ? "" : "opacity-0"}`}
              />
              {!peer.stream && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-bronze">
                  Connecting…
                </div>
              )}
              {peer.stream && !peer.video && (
                <div className="absolute inset-0 flex items-center justify-center bg-charcoal text-xs text-bronze">
                  Camera off
                </div>
              )}
              <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-mist">
                {peer.name}
                {!peer.audio ? " · muted" : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {!inCall && selfName ? (
        <p className="text-[11px] text-bronze/80">Signed in as {selfName}</p>
      ) : null}
    </div>
  );
}
