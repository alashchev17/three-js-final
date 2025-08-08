# Three.js Interactive Gallery

An immersive 3D gallery experience featuring an interactive picture frame with brush-based texture blending. Built with Three.js, GSAP, and custom shaders.

## 🎯 Project Overview

This project creates a sophisticated gallery environment where visitors explore a concrete wall with a central picture frame. The frame contains an interactive plane that uses custom shader materials and WebGL render targets to create a "paint brush" effect - users can reveal different imagery by moving their cursor, which paints between two texture layers using accumulated brush strokes.

## ✨ Key Features

### Core Implementation ✅

- **glTF Models**: Gallery concrete wall and detailed picture frame
- **HDRI Lighting**: Bethnal Green environment map with fallback directional lighting
- **Interactive Shader**: Custom fragment shader with brush-based texture blending
- **Mouse Interactions**: Cursor position drives brush painting and camera parallax
- **Shadow System**: Proper shadow casting from frame onto wall
- **WebGL Render Targets**: Off-screen drawing accumulation system

### Advanced Features ✨

- **GSAP Preloader Effect**: Animated brush stroke reveal system
- **Class-based Architecture**: Clean OOP design with private fields
- **Debug GUI**: Real-time parameter tweaking with lil-gui and stats
- **Brush System**: Dynamic brush scaling based on mouse velocity
- **Raycaster Integration**: UV-based intersection for precise brush positioning
- **OrbitControls**: Toggle between mouse-driven camera and manual controls

## 🏗️ Architecture

```
src/
├── core/              # Core Three.js components
│   ├── App.js         # Main application orchestrator & animation loop
│   ├── Camera.js      # Perspective camera with mouse-responsive behavior
│   ├── Renderer.js    # WebGL renderer with DPR capping & tone mapping
│   ├── Scene.js       # Scene management, HDRI & fallback lighting
│   └── Loaders.js     # Asset loading utilities (GLTF, textures, EXR)
├── components/        # 3D object classes & effects
│   ├── Wall.js        # Concrete gallery wall component
│   ├── Frame.js       # Picture frame component
│   ├── InteractivePlane.js # Shader-based brush painting system
│   ├── PreloaderEffect.js  # GSAP animated brush reveal
│   └── Raycaster.js   # UV intersection helper for brush positioning
├── utils/             # Utility classes & helpers
│   ├── Mouse.js       # Mouse/touch input normalization
│   ├── Debug.js       # lil-gui interface & stats panel
│   ├── OrbitControls.js # OrbitControls wrapper
│   └── SceneUtils.js  # Visibility & wireframe utilities
└── shaders/           # GLSL shaders
    └── interactive/
        ├── index.vert # Simple UV-passing vertex shader
        └── index.frag # Complex texture blending fragment shader
```

## 🎨 Visual Effects

### Brush Painting System

- **Draw Map Render Target**: 1024x1433.6px off-screen buffer accumulates brush strokes
- **Dynamic Brush Scaling**: Brush size responds to mouse velocity
- **UV-based Positioning**: Precise brush placement using raycaster intersections
- **Smooth Damping**: Brush position smoothly follows cursor with lag

### Shader Implementation

- **Dual Texture Blending**: Seamless mixing between two imagery textures
- **Brush Mask Integration**: Paint brush texture creates organic blending patterns
- **Reveal Factor Control**: Debug slider controls transition depth (0-1 range)
- **Aspect Ratio Handling**: Proper UV mapping for rectangular plane geometry

### Preloader Animation

- **Snake Pattern Drawing**: Systematic brush strokes in alternating rows
- **Organic Variation**: Random offsets prevent perfect grid appearance
- **Camera Zoom Out**: Timeline concludes with dramatic camera pull-back
- **GSAP Timeline**: Coordinated 42+ brush movements over 5+ seconds

## 🚀 Installation & Setup

### Prerequisites

- **Node.js**: 22.14.0 (see `.nvmrc`)
- **Package Manager**: pnpm (recommended)

### Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
# → Open http://localhost:5173

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 📁 Asset Structure

```
public/
├── models/
│   ├── gallery_bare_concrete_wall.glb    # Main gallery wall geometry
│   └── picture_frame.glb                 # Picture frame shell
├── textures/
│   ├── imagery/
│   │   ├── 1.jpg                         # Base texture layer
│   │   └── 2.jpg                         # Reveal texture layer
│   ├── paint-brush-mask.webp             # Brush shape mask
│   └── paper-texture.jpg                 # Grain overlay for preloader
└── env-map/
    └── bethnal_green_entrance_4k.exr     # HDRI environment map
```

## 🎛️ Technical Decisions

### Rendering Performance

- **Device Pixel Ratio**: Capped at 2x to maintain performance on high-DPI displays
- **Shadow Quality**: Balanced shadow map resolution for quality/performance
- **Render Target Size**: 1024x1433.6px draw map for optimal brush detail
- **Linear Filtering**: Smooth texture sampling on render targets

### Shader Architecture

- **Fragment Shader Logic**:
  - `valueRemap()` utility functions for range transformations
  - `smoothstep()` transitions for organic blending
  - Aspect ratio compensation (1.4 for plane geometry)
  - Brush texture UV scaling and distortion
  - Reveal factor depth control with transition bands

### Memory Management

- **Asset Optimization**: Minimal texture footprint with 4 core textures
- **Render Target Disposal**: Proper cleanup in PreloaderEffect
- **GSAP Timeline Cleanup**: Timeline kill() on component disposal

### Fallback Systems

- **HDRI Loading**: Graceful fallback to directional lighting if EXR fails
- **Asset Loading**: Promise.all() with error handling for critical assets
- **Mobile Performance**: Shader complexity optimized for 60fps on mobile

## 🔧 Debug Features

Access the debug panel (check bottom-left stats) to control:

### Transform Controls

- **Wall Transform**: Position, rotation, scale adjustments
- **Frame Transform**: Real-time frame positioning with plane auto-update
- **Camera Reset**: Return to default view position

### Shader Parameters

- **Reveal Factor**: Real-time brush transition control (0.0-1.0)
- **Invert Texture A**: Toggle base texture inversion
- **Texture Swapping**: Switch between imagery textures

### Rendering Options

- **Wireframe Mode**: Toggle wireframe rendering on all meshes
- **Visibility Controls**: Show/hide individual components
- **Orbit Controls**: Enable/disable OrbitControls vs mouse parallax
- **Environment Intensity**: Adjust HDRI brightness (0.0-2.0)
- **Background Intensity**: Control environment background visibility

### Animation Controls

- **Restart Preloader**: Re-trigger the brush animation sequence
- **Stats Panel**: Real-time FPS, render calls, and memory usage

## 📋 Requirements Checklist

- [x] Multiple glTF models loaded and positioned
- [x] HDRI environment mapping with fallback lighting
- [x] Interactive cursor-driven brush painting system
- [x] Custom ShaderMaterial with texture blending & render targets
- [x] Proper color space management & tone mapping
- [x] Shadow casting and receiving setup
- [x] Responsive design with DPR optimization
- [x] Clean class-based architecture with encapsulation
- [x] GSAP timeline animations and effects
- [x] Debug interface for real-time parameter adjustment

## 🎯 Performance Characteristics

### Target Performance

- **Desktop**: Solid 60fps on modern hardware
- **Mobile**: Optimized for 60fps on recent mobile devices
- **Memory**: Minimal texture memory footprint (4 textures total)
- **Loading**: <2s initial asset loading on broadband

### Optimization Strategies

- Minimal texture count (only 4 textures loaded)
- Efficient geometry usage to minimize draw calls
- Render target size balanced for quality vs performance
- Shader complexity optimized for mobile GPUs
- GSAP timeline optimized for smooth 60fps animation

## 🐛 Known Issues & Limitations

- **EXR Loading**: Some browsers may fail to load HDRI, fallback lighting activates
- **Mobile Safari**: Occasional texture loading delays on older iOS versions
- **High-DPI Displays**: Performance may vary on 3x+ pixel ratio displays
- **Shader Precision**: Very fast mouse movements may cause brush lag on low-end GPUs

## 🔮 Future Enhancements

- Multiple brush shapes and textures
- Audio-reactive brush parameters
- WebXR support for VR/AR gallery exploration
- Procedural noise integration in shader
- Multi-touch gesture support for tablet interfaces

## 📄 License

MIT License - feel free to use this project as a foundation for your own Three.js experiments!

---

**Built with ❤️ using Three.js, GSAP, and modern web technologies**
