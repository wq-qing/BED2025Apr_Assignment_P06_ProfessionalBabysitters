// public/js/script.js
try {
  const socket = io();
  const videoGrid = document.getElementById('video-grid');
  const userId = sessionStorage.getItem('userId');
  const roomId = window.location.pathname.split('/')[2];


  window.localStream = null;
  window.peers = {};
  window.myPeer = null;

  let myPeer = null;

  socket.emit('join-room', roomId, userId);

  function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.addEventListener('loadedmetadata', () => {
      const p = video.play();
      if (p !== undefined) p.catch(() => {});
    });
    if (videoGrid) videoGrid.append(video);
  }

  function connectToNewUser(userId, stream) {
    if (!stream || !myPeer) return;
    console.log('📲 Calling user', userId);
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');

    call.on('stream', userVideoStream => {
      console.log('👥 Received remote stream from', userId);
      addVideoStream(video, userVideoStream);
    });

    call.on('close', () => {
      console.log('🔒 Call closed from', userId);
      video.remove();
      delete window.peers[userId];
    });

    call.on('error', e => console.error('Call error with', userId, e));

    window.peers[userId] = call;
  }

  function init() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        window.localStream = stream;
        // local preview
        const myVideo = document.createElement('video');
        myVideo.muted = true;
        addVideoStream(myVideo, stream);

        // create PeerJS
        myPeer = new Peer(undefined, {
          host: window.location.hostname,
          port: location.port || (location.protocol === 'https:' ? 443 : 80),
          path: '/peerjs',
          secure: location.protocol === 'https:',
          config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
          debug: 3
        });
        window.myPeer = myPeer;

        myPeer.on('open', id => {
          console.log('▶️ PeerJS open, ID =', id);
          if (typeof ROOM_ID !== 'undefined') {
            socket.emit('join-room', ROOM_ID, id);
            console.log('🚪 emitted join-room', ROOM_ID, id);
          }
        });

        myPeer.on('call', call => {
          console.log('📞 Received call from', call.peer);
          call.answer(stream);
          const video = document.createElement('video');
          call.on('stream', userVideoStream => {
            console.log('👥 Received remote stream from', call.peer);
            addVideoStream(video, userVideoStream);
          });
          call.on('close', () => {
            console.log('🔒 Call closed from', call.peer);
            video.remove();
            delete window.peers[call.peer];
          });
        });

        const startTime = Date.now();
        fetch('/api/logCallStart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, userId, startTime })
        }).then(res => {
          if (!res.ok) throw new Error('Failed to log call start');
          console.log('📞 Call start logged');
        }).catch(err => {
          console.error('❌ Failed to log call start:', err);
        });

        document.getElementById('endCallBtn')?.addEventListener('click', () => {
        const endTime = Date.now();
        if (!roomId || !userId) {
          console.error('Missing roomId or userId for logCallEnd');
          return;
        }
        fetch('/api/logCallEnd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, userId, endTime })
        })
          .then(res => {
            if (!res.ok) throw new Error('Failed to log call end');
            console.log('✅ Call end logged');
            // Optional: redirect or close room
            if (userId.startsWith('D')) {
            window.location.href = '/doctor';
          } else {
            window.location.href = '/elderlyUserHome';
          }
          })
          .catch(err => {
            console.error('❌ Failed to log call end:', err);
          });
        });

        socket.on('user-connected', userId => {
          console.log('🔗 user-connected:', userId);
          connectToNewUser(userId, stream);
        });

        socket.on('user-disconnected', userId => {
          console.log('❌ user-disconnected:', userId);
          if (window.peers[userId]) {
            window.peers[userId].close();
            delete window.peers[userId];
          }
        });
      })
      .catch(err => {
        console.error('Failed to get media:', err);
      });
  }

  init();
} catch (e) {
  console.error('Fatal script.js error:', e);
}
