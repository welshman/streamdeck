import { useState, useCallback } from 'react';
import { useDashboardStore } from '../../hooks/useDashboardStore';
import { Stream } from '../../types/stream';
import StreamCard from './StreamCard';
import StreamSkeleton from './StreamSkeleton';

interface StreamGridProps {
  streams: Stream[];
  isLoading: boolean;
}

export function StreamGrid({ streams, isLoading }: StreamGridProps) {
  const { updateStreamOrder } = useDashboardStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    // Create new order by rearranging stream IDs
    const streamsCopy = [...streams];
    const [removed] = streamsCopy.splice(draggedIndex, 1);
    streamsCopy.splice(dropIndex, 0, removed);
    
    // Update order with the new stream ID sequence
    const newOrder = streamsCopy.map(s => s.id);
    updateStreamOrder(newOrder);
    setDraggedIndex(null);
  }, [draggedIndex, streams, updateStreamOrder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StreamSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No streams added yet. Add some streams to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {streams.map((stream, index) => (
        <div
          key={stream.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={draggedIndex === index ? 'opacity-50' : ''}
        >
          <StreamCard stream={stream} index={index} />
        </div>
      ))}
    </div>
  );
}
