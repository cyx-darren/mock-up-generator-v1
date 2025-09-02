/**
 * Preview System
 * Advanced preview generation system for logo placement on various backgrounds
 */

export interface PreviewOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  backgroundType?: 'solid' | 'gradient' | 'transparent' | 'pattern';
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  includeTransparencyChecker?: boolean;
  checkerSize?: number;
  checkerColors?: [string, string];
}

export interface GradientOptions {
  type: 'linear' | 'radial';
  colors: { color: string; stop: number }[];
  angle?: number; // for linear gradients
  centerX?: number; // for radial gradients
  centerY?: number; // for radial gradients
}

export interface PatternOptions {
  type: 'dots' | 'stripes' | 'grid' | 'diagonal';
  color: string;
  spacing: number;
  size: number;
}

export interface ZoomState {
  scale: number;
  offsetX: number;
  offsetY: number;
  minScale: number;
  maxScale: number;
}

export interface PreviewResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  blob: Blob;
  dimensions: { width: number; height: number };
  hasTransparency: boolean;
}

export class PreviewSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private zoomState: ZoomState;
  private previewHistory: PreviewResult[] = [];
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.zoomState = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      minScale: 0.1,
      maxScale: 10
    };
  }

  // White background preview
  generateWhiteBackgroundPreview(
    logoCanvas: HTMLCanvasElement,
    options: PreviewOptions = {}
  ): PreviewResult {
    return this.generateSolidColorPreview(logoCanvas, '#FFFFFF', options);
  }

  // Colored background preview
  generateSolidColorPreview(
    logoCanvas: HTMLCanvasElement,
    backgroundColor: string,
    options: PreviewOptions = {}
  ): PreviewResult {
    const opts = {
      width: 800,
      height: 600,
      quality: 1.0,
      format: 'png' as const,
      ...options,
      backgroundColor
    };

    this.setupCanvas(opts.width, opts.height);

    // Fill background
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, opts.width, opts.height);

    // Draw logo centered
    const logoX = (opts.width - logoCanvas.width) / 2;
    const logoY = (opts.height - logoCanvas.height) / 2;
    this.ctx.drawImage(logoCanvas, logoX, logoY);

    return this.createPreviewResult(opts);
  }

  // Gradient background preview
  generateGradientPreview(
    logoCanvas: HTMLCanvasElement,
    gradientOptions: GradientOptions,
    options: PreviewOptions = {}
  ): PreviewResult {
    const opts = {
      width: 800,
      height: 600,
      quality: 1.0,
      format: 'png' as const,
      ...options
    };

    this.setupCanvas(opts.width, opts.height);

    // Create gradient
    let gradient: CanvasGradient;
    
    if (gradientOptions.type === 'linear') {
      const angle = (gradientOptions.angle || 0) * Math.PI / 180;
      const x1 = opts.width / 2 - Math.cos(angle) * opts.width / 2;
      const y1 = opts.height / 2 - Math.sin(angle) * opts.height / 2;
      const x2 = opts.width / 2 + Math.cos(angle) * opts.width / 2;
      const y2 = opts.height / 2 + Math.sin(angle) * opts.height / 2;
      gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
    } else {
      const centerX = gradientOptions.centerX || opts.width / 2;
      const centerY = gradientOptions.centerY || opts.height / 2;
      const radius = Math.max(opts.width, opts.height) / 2;
      gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    }

    // Add color stops
    gradientOptions.colors.forEach(({ color, stop }) => {
      gradient.addColorStop(stop, color);
    });

    // Fill with gradient
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, opts.width, opts.height);

    // Draw logo centered
    const logoX = (opts.width - logoCanvas.width) / 2;
    const logoY = (opts.height - logoCanvas.height) / 2;
    this.ctx.drawImage(logoCanvas, logoX, logoY);

    return this.createPreviewResult(opts);
  }

  // Pattern background preview
  generatePatternPreview(
    logoCanvas: HTMLCanvasElement,
    patternOptions: PatternOptions,
    options: PreviewOptions = {}
  ): PreviewResult {
    const opts = {
      width: 800,
      height: 600,
      quality: 1.0,
      format: 'png' as const,
      ...options
    };

    this.setupCanvas(opts.width, opts.height);

    // Draw pattern background
    this.drawPattern(patternOptions, opts.width, opts.height);

    // Draw logo centered
    const logoX = (opts.width - logoCanvas.width) / 2;
    const logoY = (opts.height - logoCanvas.height) / 2;
    this.ctx.drawImage(logoCanvas, logoX, logoY);

    return this.createPreviewResult(opts);
  }

  // Transparent background with transparency checker
  generateTransparentPreview(
    logoCanvas: HTMLCanvasElement,
    options: PreviewOptions = {}
  ): PreviewResult {
    const opts = {
      width: 800,
      height: 600,
      quality: 1.0,
      format: 'png' as const,
      includeTransparencyChecker: true,
      checkerSize: 20,
      checkerColors: ['#FFFFFF', '#E5E7EB'] as [string, string],
      ...options
    };

    this.setupCanvas(opts.width, opts.height);

    // Draw transparency checker pattern if requested
    if (opts.includeTransparencyChecker) {
      this.drawTransparencyChecker(opts.width, opts.height, opts.checkerSize, opts.checkerColors);
    }

    // Draw logo centered
    const logoX = (opts.width - logoCanvas.width) / 2;
    const logoY = (opts.height - logoCanvas.height) / 2;
    this.ctx.drawImage(logoCanvas, logoX, logoY);

    return this.createPreviewResult(opts);
  }

  // Custom color picker preview
  generateCustomColorPreview(
    logoCanvas: HTMLCanvasElement,
    customColor: string,
    options: PreviewOptions = {}
  ): PreviewResult {
    return this.generateSolidColorPreview(logoCanvas, customColor, options);
  }

  // Before/after comparison
  generateBeforeAfterPreview(
    originalLogo: HTMLCanvasElement,
    adjustedLogo: HTMLCanvasElement,
    backgroundColor: string = '#FFFFFF',
    options: PreviewOptions = {}
  ): PreviewResult {
    const opts = {
      width: 1200,
      height: 600,
      quality: 1.0,
      format: 'png' as const,
      ...options
    };

    this.setupCanvas(opts.width, opts.height);

    // Fill background
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, opts.width, opts.height);

    // Draw dividing line
    const centerX = opts.width / 2;
    this.ctx.strokeStyle = '#D1D5DB';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, 0);
    this.ctx.lineTo(centerX, opts.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw "Before" label
    this.ctx.fillStyle = '#6B7280';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BEFORE', centerX / 2, 40);

    // Draw "After" label
    this.ctx.fillText('AFTER', centerX + centerX / 2, 40);

    // Draw original logo on left side
    const originalX = centerX / 2 - originalLogo.width / 2;
    const originalY = (opts.height - originalLogo.height) / 2;
    this.ctx.drawImage(originalLogo, originalX, originalY);

    // Draw adjusted logo on right side
    const adjustedX = centerX + centerX / 2 - adjustedLogo.width / 2;
    const adjustedY = (opts.height - adjustedLogo.height) / 2;
    this.ctx.drawImage(adjustedLogo, adjustedX, adjustedY);

    return this.createPreviewResult(opts);
  }

  // Zoom functionality
  setZoom(scale: number, centerX?: number, centerY?: number): void {
    const newScale = Math.max(this.zoomState.minScale, Math.min(this.zoomState.maxScale, scale));
    
    if (centerX !== undefined && centerY !== undefined) {
      // Zoom to specific point
      const scaleChange = newScale / this.zoomState.scale;
      this.zoomState.offsetX = centerX - (centerX - this.zoomState.offsetX) * scaleChange;
      this.zoomState.offsetY = centerY - (centerY - this.zoomState.offsetY) * scaleChange;
    }
    
    this.zoomState.scale = newScale;
  }

  zoomIn(factor: number = 1.25): void {
    this.setZoom(this.zoomState.scale * factor);
  }

  zoomOut(factor: number = 0.8): void {
    this.setZoom(this.zoomState.scale * factor);
  }

  zoomToFit(contentWidth: number, contentHeight: number, containerWidth: number, containerHeight: number): void {
    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave some margin
    
    this.zoomState.scale = scale;
    this.zoomState.offsetX = (containerWidth - contentWidth * scale) / 2;
    this.zoomState.offsetY = (containerHeight - contentHeight * scale) / 2;
  }

  resetZoom(): void {
    this.zoomState.scale = 1;
    this.zoomState.offsetX = 0;
    this.zoomState.offsetY = 0;
  }

  // Generate zoomed preview
  generateZoomedPreview(
    logoCanvas: HTMLCanvasElement,
    backgroundColor: string = '#FFFFFF',
    options: PreviewOptions = {}
  ): PreviewResult {
    const opts = {
      width: 800,
      height: 600,
      quality: 1.0,
      format: 'png' as const,
      ...options
    };

    this.setupCanvas(opts.width, opts.height);

    // Apply zoom transformation
    this.ctx.save();
    this.ctx.scale(this.zoomState.scale, this.zoomState.scale);
    this.ctx.translate(this.zoomState.offsetX / this.zoomState.scale, this.zoomState.offsetY / this.zoomState.scale);

    // Fill background
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(-this.zoomState.offsetX / this.zoomState.scale, -this.zoomState.offsetY / this.zoomState.scale, 
                     opts.width / this.zoomState.scale, opts.height / this.zoomState.scale);

    // Draw logo
    const logoX = (opts.width / this.zoomState.scale - logoCanvas.width) / 2;
    const logoY = (opts.height / this.zoomState.scale - logoCanvas.height) / 2;
    this.ctx.drawImage(logoCanvas, logoX, logoY);

    this.ctx.restore();

    return this.createPreviewResult(opts);
  }

  // Environment previews (realistic contexts)
  generateEnvironmentPreview(
    logoCanvas: HTMLCanvasElement,
    environmentType: 'mug' | 'tshirt' | 'business-card' | 'signage' | 'web',
    options: PreviewOptions = {}
  ): PreviewResult {
    const opts = {
      width: 800,
      height: 600,
      quality: 1.0,
      format: 'png' as const,
      ...options
    };

    this.setupCanvas(opts.width, opts.height);

    // Create environment-specific mockup
    switch (environmentType) {
      case 'mug':
        this.drawMugMockup(logoCanvas, opts.width, opts.height);
        break;
      case 'tshirt':
        this.drawTShirtMockup(logoCanvas, opts.width, opts.height);
        break;
      case 'business-card':
        this.drawBusinessCardMockup(logoCanvas, opts.width, opts.height);
        break;
      case 'signage':
        this.drawSignageMockup(logoCanvas, opts.width, opts.height);
        break;
      case 'web':
        this.drawWebMockup(logoCanvas, opts.width, opts.height);
        break;
    }

    return this.createPreviewResult(opts);
  }

  // Bulk preview generation
  generateBulkPreviews(
    logoCanvas: HTMLCanvasElement,
    backgrounds: string[],
    options: PreviewOptions = {}
  ): PreviewResult[] {
    return backgrounds.map(bg => this.generateSolidColorPreview(logoCanvas, bg, options));
  }

  // Private helper methods
  private setupCanvas(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  private createPreviewResult(options: PreviewOptions): PreviewResult {
    const dataUrl = this.canvas.toDataURL(`image/${options.format}`, options.quality);
    
    return new Promise<PreviewResult>((resolve) => {
      this.canvas.toBlob((blob) => {
        resolve({
          canvas: this.cloneCanvas(this.canvas),
          dataUrl,
          blob: blob!,
          dimensions: { width: this.canvas.width, height: this.canvas.height },
          hasTransparency: this.checkHasTransparency()
        });
      }, `image/${options.format}`, options.quality);
    }) as any;
  }

  private cloneCanvas(original: HTMLCanvasElement): HTMLCanvasElement {
    const clone = document.createElement('canvas');
    clone.width = original.width;
    clone.height = original.height;
    const ctx = clone.getContext('2d')!;
    ctx.drawImage(original, 0, 0);
    return clone;
  }

  private checkHasTransparency(): boolean {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    
    return false;
  }

  private drawTransparencyChecker(width: number, height: number, size: number, colors: [string, string]): void {
    for (let x = 0; x < width; x += size) {
      for (let y = 0; y < height; y += size) {
        const colorIndex = ((x / size) + (y / size)) % 2;
        this.ctx.fillStyle = colors[colorIndex];
        this.ctx.fillRect(x, y, size, size);
      }
    }
  }

  private drawPattern(pattern: PatternOptions, width: number, height: number): void {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, width, height);
    
    this.ctx.fillStyle = pattern.color;
    
    switch (pattern.type) {
      case 'dots':
        for (let x = 0; x < width; x += pattern.spacing) {
          for (let y = 0; y < height; y += pattern.spacing) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, pattern.size / 2, 0, 2 * Math.PI);
            this.ctx.fill();
          }
        }
        break;
      
      case 'stripes':
        for (let x = 0; x < width; x += pattern.spacing) {
          this.ctx.fillRect(x, 0, pattern.size, height);
        }
        break;
      
      case 'grid':
        this.ctx.lineWidth = pattern.size;
        for (let x = 0; x < width; x += pattern.spacing) {
          this.ctx.beginPath();
          this.ctx.moveTo(x, 0);
          this.ctx.lineTo(x, height);
          this.ctx.stroke();
        }
        for (let y = 0; y < height; y += pattern.spacing) {
          this.ctx.beginPath();
          this.ctx.moveTo(0, y);
          this.ctx.lineTo(width, y);
          this.ctx.stroke();
        }
        break;
      
      case 'diagonal':
        this.ctx.lineWidth = pattern.size;
        const diagonal = Math.sqrt(width * width + height * height);
        for (let i = -diagonal; i < diagonal; i += pattern.spacing) {
          this.ctx.beginPath();
          this.ctx.moveTo(i, 0);
          this.ctx.lineTo(i + height, height);
          this.ctx.stroke();
        }
        break;
    }
  }

  // Environment mockup methods
  private drawMugMockup(logo: HTMLCanvasElement, width: number, height: number): void {
    // Create a simple mug mockup
    this.ctx.fillStyle = '#F3F4F6';
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw mug shape
    this.ctx.fillStyle = '#FFFFFF';
    const mugWidth = 300;
    const mugHeight = 350;
    const mugX = (width - mugWidth) / 2;
    const mugY = (height - mugHeight) / 2;
    
    this.ctx.fillRect(mugX, mugY, mugWidth, mugHeight);
    
    // Draw handle
    this.ctx.strokeStyle = '#D1D5DB';
    this.ctx.lineWidth = 20;
    this.ctx.beginPath();
    this.ctx.arc(mugX + mugWidth + 20, mugY + mugHeight / 2, 40, -Math.PI / 2, Math.PI / 2, false);
    this.ctx.stroke();
    
    // Place logo on mug
    const logoScale = 0.4;
    const logoW = logo.width * logoScale;
    const logoH = logo.height * logoScale;
    const logoX = mugX + (mugWidth - logoW) / 2;
    const logoY = mugY + (mugHeight - logoH) / 2;
    
    this.ctx.drawImage(logo, logoX, logoY, logoW, logoH);
  }

  private drawTShirtMockup(logo: HTMLCanvasElement, width: number, height: number): void {
    // Create t-shirt mockup
    this.ctx.fillStyle = '#F9FAFB';
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw t-shirt shape
    this.ctx.fillStyle = '#FFFFFF';
    const shirtWidth = 400;
    const shirtHeight = 500;
    const shirtX = (width - shirtWidth) / 2;
    const shirtY = (height - shirtHeight) / 2;
    
    // T-shirt body
    this.ctx.fillRect(shirtX, shirtY + 100, shirtWidth, shirtHeight - 100);
    
    // T-shirt top/shoulders
    this.ctx.fillRect(shirtX - 50, shirtY, shirtWidth + 100, 150);
    
    // Place logo on chest area
    const logoScale = 0.3;
    const logoW = logo.width * logoScale;
    const logoH = logo.height * logoScale;
    const logoX = shirtX + (shirtWidth - logoW) / 2;
    const logoY = shirtY + 200;
    
    this.ctx.drawImage(logo, logoX, logoY, logoW, logoH);
  }

  private drawBusinessCardMockup(logo: HTMLCanvasElement, width: number, height: number): void {
    // Create business card mockup
    this.ctx.fillStyle = '#E5E7EB';
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw business card
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.shadowColor = '#00000020';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetY = 10;
    
    const cardWidth = 350;
    const cardHeight = 200;
    const cardX = (width - cardWidth) / 2;
    const cardY = (height - cardHeight) / 2;
    
    this.ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    this.ctx.shadowColor = 'transparent';
    
    // Place logo
    const logoScale = 0.5;
    const logoW = logo.width * logoScale;
    const logoH = logo.height * logoScale;
    const logoX = cardX + 20;
    const logoY = cardY + 20;
    
    this.ctx.drawImage(logo, logoX, logoY, logoW, logoH);
  }

  private drawSignageMockup(logo: HTMLCanvasElement, width: number, height: number): void {
    // Create signage mockup
    this.ctx.fillStyle = '#1F2937';
    this.ctx.fillRect(0, 0, width, height);
    
    // Draw sign background
    this.ctx.fillStyle = '#374151';
    const signWidth = 500;
    const signHeight = 200;
    const signX = (width - signWidth) / 2;
    const signY = (height - signHeight) / 2;
    
    this.ctx.fillRect(signX, signY, signWidth, signHeight);
    
    // Add border
    this.ctx.strokeStyle = '#6B7280';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(signX, signY, signWidth, signHeight);
    
    // Place logo
    const logoScale = 0.6;
    const logoW = logo.width * logoScale;
    const logoH = logo.height * logoScale;
    const logoX = signX + (signWidth - logoW) / 2;
    const logoY = signY + (signHeight - logoH) / 2;
    
    this.ctx.drawImage(logo, logoX, logoY, logoW, logoH);
  }

  private drawWebMockup(logo: HTMLCanvasElement, width: number, height: number): void {
    // Create web browser mockup
    this.ctx.fillStyle = '#F3F4F6';
    this.ctx.fillRect(0, 0, width, height);
    
    // Browser window
    this.ctx.fillStyle = '#FFFFFF';
    const browserWidth = 600;
    const browserHeight = 400;
    const browserX = (width - browserWidth) / 2;
    const browserY = (height - browserHeight) / 2;
    
    this.ctx.fillRect(browserX, browserY, browserWidth, browserHeight);
    
    // Browser header
    this.ctx.fillStyle = '#E5E7EB';
    this.ctx.fillRect(browserX, browserY, browserWidth, 40);
    
    // Address bar
    this.ctx.fillStyle = '#F9FAFB';
    this.ctx.fillRect(browserX + 60, browserY + 10, browserWidth - 120, 20);
    
    // Place logo in header area
    const logoScale = 0.4;
    const logoW = logo.width * logoScale;
    const logoH = logo.height * logoScale;
    const logoX = browserX + 20;
    const logoY = browserY + 80;
    
    this.ctx.drawImage(logo, logoX, logoY, logoW, logoH);
  }

  // History management
  saveToHistory(result: PreviewResult): void {
    this.previewHistory.push(result);
    if (this.previewHistory.length > 20) {
      this.previewHistory.shift();
    }
  }

  getHistory(): PreviewResult[] {
    return [...this.previewHistory];
  }

  clearHistory(): void {
    this.previewHistory = [];
  }

  // Export methods
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getZoomState(): ZoomState {
    return { ...this.zoomState };
  }

  setZoomConstraints(minScale: number, maxScale: number): void {
    this.zoomState.minScale = minScale;
    this.zoomState.maxScale = maxScale;
  }
}

export default PreviewSystem;