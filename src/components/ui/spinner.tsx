import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      className={cn('relative', sizes[size], className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary" />
    </motion.div>
  );
}

export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-primary rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function BouncingLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-end justify-center gap-1.5', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-8 bg-primary rounded-full"
          animate={{
            scaleY: [1, 0.4, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function OrbitLoader({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-12 h-12', className)}>
      <motion.div
        className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="absolute top-0 left-0 w-3 h-3 bg-primary rounded-full" />
      </motion.div>
      <motion.div
        className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5"
        animate={{
          rotate: [0, -360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="absolute top-0 left-6 w-2 h-2 bg-primary/60 rounded-full" />
      </motion.div>
    </div>
  );
}

export function LoadingScreen({
  message = 'Memuat...',
  type = 'spinner',
  fullScreen = false,
  overlay = false
}: {
  message?: string;
  type?: 'spinner' | 'pulse' | 'bounce' | 'orbit';
  fullScreen?: boolean;
  overlay?: boolean;
}) {
  const loaders = {
    spinner: <Spinner size="lg" />,
    pulse: <PulseLoader />,
    bounce: <BouncingLoader />,
    orbit: <OrbitLoader />,
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {loaders[type]}
      </motion.div>
      <motion.p
        className="text-sm text-foreground font-medium"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {message}
      </motion.p>
    </div>
  );

  if (fullScreen || overlay) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {overlay && (
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
      {content}
    </div>
  );
}
