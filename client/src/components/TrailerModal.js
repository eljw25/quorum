import React from 'react';

// TrailerModal — shows a YouTube trailer in a fullscreen overlay
// trailerKey is the YouTube video ID e.g. "dQw4w9WgXcQ"
// onClose is called when the user clicks outside or hits the X button
function TrailerModal({ trailerKey, onClose }) {
  return (
    // Clicking the dark backdrop closes the modal
    <div className="modal-backdrop" onClick={onClose}>
      {/* Stop click from closing when clicking the video itself */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <iframe
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
          title="Trailer"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default TrailerModal;
