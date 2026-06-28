import React, { useEffect, useState } from 'react';
import { Fuel } from 'lucide-react';

interface NotificationPreviewProps {
  title: string;
  body: string;
  imageFile: File | null;
}

export const NotificationPreview: React.FC<NotificationPreviewProps> = ({ title, body, imageFile }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [imageFile]);

  const displayTitle = title || 'Notification Title';
  const displayBody = body || 'Notification body text goes here...';

  return (
    <div className="notification-preview">
      <div className="preview-header">
        <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 500 }}>Live Preview (Android Style)</span>
      </div>
      <div className="mock-phone">
        <div className="mock-status-bar">
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>12:00</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.7)', borderRadius: '50%' }}></div>
            <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.7)', borderRadius: '2px' }}></div>
          </div>
        </div>
        
        <div className="mock-notification">
          <div className="mock-notif-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="mock-app-icon">
                <Fuel size={14} color="white" />
              </div>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>GasSync</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Just now</span>
          </div>
          <div className="mock-notif-content">
            <div className="mock-notif-title">{displayTitle}</div>
            <div className="mock-notif-body">{displayBody}</div>
            {imageUrl && (
              <div className="mock-notif-image-container">
                <img src={imageUrl} alt="Notification attachment" className="mock-notif-image" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
