import { ReactNode, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
}

export const AnimatedCard = ({ children, className }: AnimatedCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        'relative rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 overflow-hidden transition-all duration-300',
        isHovering && 'shadow-2xl border-blue-300/50',
        className
      )}
      style={{
        transform: isHovering
          ? `perspective(1000px) rotateX(${(mousePosition.y - 150) / 30}deg) rotateY(${
              (mousePosition.x - 150) / 30
            }deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      }}
    >
      {isHovering && (
        <div
          className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
}

export const GlassCard = ({ children, className, gradient = false }: GlassCardProps) => {
  return (
    <div
      className={cn(
        'relative rounded-2xl bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl overflow-hidden',
        'hover:shadow-2xl hover:border-white/40 transition-all duration-300',
        gradient && 'bg-gradient-to-br from-white/80 via-white/70 to-white/60',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

interface ShimmerCardProps {
  children: ReactNode;
  className?: string;
}

export const ShimmerCard = ({ children, className }: ShimmerCardProps) => {
  return (
    <div className={cn('relative group', className)}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition duration-500"></div>
      <div className="relative rounded-2xl bg-white border border-gray-200 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
