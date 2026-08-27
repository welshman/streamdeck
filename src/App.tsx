import { useState, useEffect, useCallback } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { StreamGrid } from './components/stream/StreamGrid';
import { AddStreamModal } from './components/modals/AddStreamModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { Header } from './components/layout/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Stream } from './types/stream';
import { filterOfflineStreams, checkStreamStatus } from './utils/streamParser';
import { useTheme } from './hooks/useTheme';

function Dashboard() {
  const { streams, addStream, removeStream, featuredStreamId, setFeaturedStreamId } = useDashboard();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  // Check stream status periodically and filter offline streams
  const checkStreamsStatus = useCallback(async () => {
    const updatedStreams = await Promise.all(
      streams.map(async (stream) => {
        const status = await checkStreamStatus(stream.platform, stream.channel);
        return { ...stream, status };
      })
    );
    
    // Filter out offline streams
    const liveStreams = filterOfflineStreams(updatedStreams);
    
    // If featured stream is offline, clear featured selection
    if (featuredStreamId && !liveStreams.find(s => s.id === featuredStreamId)) {
      setFeaturedStreamId(null);
    }
  }, [streams, featuredStreamId, setFeaturedStreamId]);

  useEffect(() => {
    // Initial status check
    checkStreamsStatus().then(() => setIsLoading(false));
    
    // Periodic status checks every 60 seconds
    const interval = setInterval(checkStreamsStatus, 60000);
    return () => clearInterval(interval);
  }, [checkStreamsStatus]);

  const handleAddStream = (stream: Stream) => {
    addStream(stream);
    setIsAddModalOpen(false);
  };

  const handleRemoveStream = (streamId: string) => {
    removeStream(streamId);
    if (featuredStreamId === streamId) {
      setFeaturedStreamId(null);
    }
  };

  // Filter offline streams for display
  const displayStreams = filterOfflineStreams(streams);

  return (
    <div className={`min-h-screen bg-background ${theme}`}>
      <Header
        onAddStream={() => setIsAddModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <main className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <StreamGrid 
            streams={displayStreams} 
            isLoading={isLoading} 
          />
        </ErrorBoundary>
      </main>

      <AddStreamModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStream={handleAddStream}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}
