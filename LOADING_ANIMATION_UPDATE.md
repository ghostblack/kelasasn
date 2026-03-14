# Update Loading Animation

## Perubahan yang Dilakukan

Loading animation telah diperbaiki dan ditingkatkan dengan komponen yang lebih simpel, menarik, dan professional menggunakan Framer Motion.

## Komponen Baru

### 1. **Spinner Components** (`src/components/ui/spinner.tsx`)

Terdapat 4 jenis loading animation yang dapat digunakan:

#### a. **Spinner** (Default Circle Spinner)
```tsx
<Spinner size="md" />
```
- Sizes: `sm`, `md`, `lg`
- Animasi: Rotasi 360° dengan border gradient

#### b. **PulseLoader**
```tsx
<PulseLoader />
```
- 3 dots dengan animasi scale dan opacity
- Smooth dan modern

#### c. **BouncingLoader**
```tsx
<BouncingLoader />
```
- 3 bars dengan animasi bouncing vertical
- Terlihat dinamis dan engaging

#### d. **OrbitLoader**
```tsx
<OrbitLoader />
```
- 2 dots dengan animasi orbital
- Unik dan menarik

### 2. **LoadingScreen Component**

Komponen utama untuk full-screen loading:

```tsx
<LoadingScreen
  message="Memuat data..."
  type="spinner" // atau "pulse", "bounce", "orbit"
/>
```

**Features:**
- Fade-in animation saat muncul
- Custom message
- 4 pilihan animation type
- Centered layout dengan min-height 400px
- Responsive dan mobile-friendly

### 3. **Enhanced Skeleton**

Skeleton component telah ditingkatkan dengan shimmer effect:

```tsx
<Skeleton className="h-32 w-full" />
```

**Improvements:**
- Gradient shimmer animation dari kiri ke kanan
- Smooth transition
- Lebih professional dibanding animate-pulse default

## Implementasi di Halaman

Loading animation baru telah diterapkan di:

### Dashboard Pages:
- ✅ **HomePage** - PulseLoader
- ✅ **TryoutsPage** - BouncingLoader
- ✅ **TryoutDetailPage** - Spinner
- ✅ **TryoutExamPage** - OrbitLoader
- ✅ **TryoutResultPage** - PulseLoader
- ✅ **RankingPage** - OrbitLoader
- ✅ **ProfilePage** - PulseLoader
- ✅ **JabatanPage** - BouncingLoader
- ✅ **PaymentProcessPage** - Spinner

### Admin Pages:
- ✅ **AdminHome** - Spinner

## Keuntungan

1. **Lebih Professional**: Animasi smooth dengan Framer Motion
2. **Konsisten**: Satu komponen untuk semua loading state
3. **Customizable**: 4 pilihan animation type
4. **Lightweight**: Menggunakan library yang sudah ada (framer-motion)
5. **Maintainable**: Mudah di-update dan dikustomisasi
6. **UX Friendly**: Loading message yang informatif

## Usage Example

### Basic Loading Screen
```tsx
if (loading) {
  return <LoadingScreen message="Memuat data..." type="pulse" />;
}
```

### Custom Spinner
```tsx
<div className="flex justify-center">
  <Spinner size="lg" />
</div>
```

### Multiple Loaders
```tsx
<div className="flex gap-4">
  <PulseLoader />
  <BouncingLoader />
  <OrbitLoader />
</div>
```

## Performance

- Semua animasi menggunakan CSS transforms dan opacity
- Hardware-accelerated rendering
- Tidak menyebabkan layout shifts
- Smooth 60fps animation
