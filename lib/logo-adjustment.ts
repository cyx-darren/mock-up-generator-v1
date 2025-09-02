/**
 * Logo Adjustment Tools
 * Advanced logo transformation and positioning system for mockup generation
 */

export interface LogoTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface LogoAdjustmentState {
  current: LogoTransform;
  history: LogoTransform[];
  historyIndex: number;
  originalDimensions: {
    width: number;
    height: number;
  };
  constraints: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    allowedArea: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export interface AdjustmentOptions {
  maintainAspectRatio?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  enableConstraints?: boolean;
}

export class LogoAdjustmentService {
  private state: LogoAdjustmentState;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private logoImage: HTMLImageElement | null = null;

  constructor(
    logoImage: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number,
    allowedArea?: { x: number; y: number; width: number; height: number }
  ) {
    this.logoImage = logoImage;
    
    const defaultArea = allowedArea || {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight
    };

    const initialTransform: LogoTransform = {
      x: defaultArea.x + defaultArea.width / 2 - logoImage.width / 2,
      y: defaultArea.y + defaultArea.height / 2 - logoImage.height / 2,
      width: logoImage.width,
      height: logoImage.height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      flipHorizontal: false,
      flipVertical: false
    };

    this.state = {
      current: initialTransform,
      history: [{ ...initialTransform }],
      historyIndex: 0,
      originalDimensions: {
        width: logoImage.width,
        height: logoImage.height
      },
      constraints: {
        minWidth: 20,
        maxWidth: defaultArea.width,
        minHeight: 20,
        maxHeight: defaultArea.height,
        allowedArea: defaultArea
      }
    };

    this.setupCanvas(canvasWidth, canvasHeight);
  }

  private setupCanvas(width: number, height: number): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
  }

  private saveState(): void {
    // Remove any redo history
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    
    // Add new state
    this.state.history.push({ ...this.state.current });
    this.state.historyIndex++;

    // Limit history size to 50 states
    if (this.state.history.length > 50) {
      this.state.history.shift();
      this.state.historyIndex--;
    }
  }

  private applyConstraints(transform: LogoTransform): LogoTransform {
    const constrained = { ...transform };
    const { constraints } = this.state;

    // Apply size constraints
    constrained.width = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, constrained.width));
    constrained.height = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, constrained.height));

    // Apply position constraints
    const halfWidth = constrained.width / 2;
    const halfHeight = constrained.height / 2;
    
    constrained.x = Math.max(
      constraints.allowedArea.x + halfWidth,
      Math.min(
        constraints.allowedArea.x + constraints.allowedArea.width - halfWidth,
        constrained.x
      )
    );

    constrained.y = Math.max(
      constraints.allowedArea.y + halfHeight,
      Math.min(
        constraints.allowedArea.y + constraints.allowedArea.height - halfHeight,
        constrained.y
      )
    );

    return constrained;
  }

  private snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
  }

  // Resize functionality
  resize(width: number, height: number, options: AdjustmentOptions = {}): void {
    const newTransform = { ...this.state.current };

    if (options.maintainAspectRatio) {
      const aspectRatio = this.state.originalDimensions.width / this.state.originalDimensions.height;
      if (width / height > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }
    }

    newTransform.width = width;
    newTransform.height = height;
    newTransform.scaleX = width / this.state.originalDimensions.width;
    newTransform.scaleY = height / this.state.originalDimensions.height;

    if (options.enableConstraints) {
      this.state.current = this.applyConstraints(newTransform);
    } else {
      this.state.current = newTransform;
    }

    this.saveState();
  }

  resizeByPercentage(percentage: number, options: AdjustmentOptions = {}): void {
    const scale = percentage / 100;
    const newWidth = this.state.originalDimensions.width * scale;
    const newHeight = this.state.originalDimensions.height * scale;
    this.resize(newWidth, newHeight, options);
  }

  // Position adjustment
  setPosition(x: number, y: number, options: AdjustmentOptions = {}): void {
    const newTransform = { ...this.state.current };

    if (options.snapToGrid && options.gridSize) {
      x = this.snapToGrid(x, options.gridSize);
      y = this.snapToGrid(y, options.gridSize);
    }

    newTransform.x = x;
    newTransform.y = y;

    if (options.enableConstraints) {
      this.state.current = this.applyConstraints(newTransform);
    } else {
      this.state.current = newTransform;
    }

    this.saveState();
  }

  moveBy(deltaX: number, deltaY: number, options: AdjustmentOptions = {}): void {
    this.setPosition(
      this.state.current.x + deltaX,
      this.state.current.y + deltaY,
      options
    );
  }

  centerLogo(): void {
    const { allowedArea } = this.state.constraints;
    const centerX = allowedArea.x + allowedArea.width / 2;
    const centerY = allowedArea.y + allowedArea.height / 2;
    this.setPosition(centerX, centerY, { enableConstraints: true });
  }

  // Rotation controls
  setRotation(degrees: number): void {
    const newTransform = { ...this.state.current };
    newTransform.rotation = degrees % 360;
    this.state.current = newTransform;
    this.saveState();
  }

  rotateBy(degrees: number): void {
    this.setRotation(this.state.current.rotation + degrees);
  }

  rotate90Clockwise(): void {
    this.rotateBy(90);
  }

  rotate90CounterClockwise(): void {
    this.rotateBy(-90);
  }

  // Flip functionality
  flipHorizontal(): void {
    const newTransform = { ...this.state.current };
    newTransform.flipHorizontal = !newTransform.flipHorizontal;
    newTransform.scaleX *= -1;
    this.state.current = newTransform;
    this.saveState();
  }

  flipVertical(): void {
    const newTransform = { ...this.state.current };
    newTransform.flipVertical = !newTransform.flipVertical;
    newTransform.scaleY *= -1;
    this.state.current = newTransform;
    this.saveState();
  }

  // Reset function
  reset(): void {
    const originalTransform = this.state.history[0];
    this.state.current = { ...originalTransform };
    this.saveState();
  }

  resetToDefaults(): void {
    const { allowedArea, originalDimensions } = this.state;
    const defaultTransform: LogoTransform = {
      x: allowedArea.constraints.allowedArea.x + allowedArea.constraints.allowedArea.width / 2,
      y: allowedArea.constraints.allowedArea.y + allowedArea.constraints.allowedArea.height / 2,
      width: originalDimensions.width,
      height: originalDimensions.height,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      flipHorizontal: false,
      flipVertical: false
    };
    this.state.current = defaultTransform;
    this.saveState();
  }

  // Undo/Redo functionality
  undo(): boolean {
    if (this.canUndo()) {
      this.state.historyIndex--;
      this.state.current = { ...this.state.history[this.state.historyIndex] };
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (this.canRedo()) {
      this.state.historyIndex++;
      this.state.current = { ...this.state.history[this.state.historyIndex] };
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.state.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.state.historyIndex < this.state.history.length - 1;
  }

  // Advanced positioning helpers
  alignLeft(): void {
    const { allowedArea } = this.state.constraints;
    const x = allowedArea.x + this.state.current.width / 2;
    this.setPosition(x, this.state.current.y, { enableConstraints: true });
  }

  alignRight(): void {
    const { allowedArea } = this.state.constraints;
    const x = allowedArea.x + allowedArea.width - this.state.current.width / 2;
    this.setPosition(x, this.state.current.y, { enableConstraints: true });
  }

  alignTop(): void {
    const { allowedArea } = this.state.constraints;
    const y = allowedArea.y + this.state.current.height / 2;
    this.setPosition(this.state.current.x, y, { enableConstraints: true });
  }

  alignBottom(): void {
    const { allowedArea } = this.state.constraints;
    const y = allowedArea.y + allowedArea.height - this.state.current.height / 2;
    this.setPosition(this.state.current.x, y, { enableConstraints: true });
  }

  alignCenter(): void {
    this.centerLogo();
  }

  // Preset sizing
  setSmallSize(): void {
    const scale = 0.5;
    this.resizeByPercentage(scale * 100, { maintainAspectRatio: true, enableConstraints: true });
  }

  setMediumSize(): void {
    const scale = 0.75;
    this.resizeByPercentage(scale * 100, { maintainAspectRatio: true, enableConstraints: true });
  }

  setLargeSize(): void {
    const scale = 1.0;
    this.resizeByPercentage(scale * 100, { maintainAspectRatio: true, enableConstraints: true });
  }

  fitToArea(): void {
    const { allowedArea } = this.state.constraints;
    const { originalDimensions } = this.state;
    
    const scaleX = allowedArea.width / originalDimensions.width;
    const scaleY = allowedArea.height / originalDimensions.height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of available space
    
    this.resizeByPercentage(scale * 100, { maintainAspectRatio: true });
    this.centerLogo();
  }

  // Render methods
  render(): HTMLCanvasElement | null {
    if (!this.canvas || !this.ctx || !this.logoImage) {
      return null;
    }

    const { current } = this.state;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context for transformation
    this.ctx.save();

    // Move to logo center for rotation
    this.ctx.translate(current.x, current.y);
    this.ctx.rotate((current.rotation * Math.PI) / 180);
    this.ctx.scale(
      current.scaleX * (current.flipHorizontal ? -1 : 1),
      current.scaleY * (current.flipVertical ? -1 : 1)
    );

    // Draw logo centered at origin
    this.ctx.drawImage(
      this.logoImage,
      -current.width / 2,
      -current.height / 2,
      current.width,
      current.height
    );

    // Restore context
    this.ctx.restore();

    return this.canvas;
  }

  renderWithGuides(): HTMLCanvasElement | null {
    const canvas = this.render();
    if (!canvas || !this.ctx) {
      return null;
    }

    const { current, constraints } = this.state;

    // Draw constraint area outline
    this.ctx.save();
    this.ctx.strokeStyle = '#10B981';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(
      constraints.allowedArea.x,
      constraints.allowedArea.y,
      constraints.allowedArea.width,
      constraints.allowedArea.height
    );

    // Draw logo bounds
    this.ctx.strokeStyle = '#3B82F6';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);
    this.ctx.strokeRect(
      current.x - current.width / 2,
      current.y - current.height / 2,
      current.width,
      current.height
    );

    // Draw center point
    this.ctx.fillStyle = '#EF4444';
    this.ctx.beginPath();
    this.ctx.arc(current.x, current.y, 3, 0, 2 * Math.PI);
    this.ctx.fill();

    this.ctx.restore();

    return canvas;
  }

  // State management
  getCurrentTransform(): LogoTransform {
    return { ...this.state.current };
  }

  getState(): LogoAdjustmentState {
    return {
      ...this.state,
      current: { ...this.state.current },
      history: this.state.history.map(t => ({ ...t }))
    };
  }

  updateConstraints(constraints: Partial<LogoAdjustmentState['constraints']>): void {
    this.state.constraints = { ...this.state.constraints, ...constraints };
    // Re-apply constraints to current transform
    this.state.current = this.applyConstraints(this.state.current);
  }

  // Utility methods
  isWithinBounds(): boolean {
    const { current, constraints } = this.state;
    const { allowedArea } = constraints;
    
    const logoLeft = current.x - current.width / 2;
    const logoRight = current.x + current.width / 2;
    const logoTop = current.y - current.height / 2;
    const logoBottom = current.y + current.height / 2;
    
    return (
      logoLeft >= allowedArea.x &&
      logoRight <= allowedArea.x + allowedArea.width &&
      logoTop >= allowedArea.y &&
      logoBottom <= allowedArea.y + allowedArea.height
    );
  }

  getTransformCSS(): string {
    const { current } = this.state;
    const transforms = [];
    
    transforms.push(`translate(${current.x}px, ${current.y}px)`);
    if (current.rotation !== 0) {
      transforms.push(`rotate(${current.rotation}deg)`);
    }
    if (current.scaleX !== 1 || current.scaleY !== 1) {
      transforms.push(`scale(${current.scaleX}, ${current.scaleY})`);
    }
    
    return transforms.join(' ');
  }

  export(): {
    transform: LogoTransform;
    cssTransform: string;
    isValid: boolean;
    canvas: HTMLCanvasElement | null;
  } {
    return {
      transform: this.getCurrentTransform(),
      cssTransform: this.getTransformCSS(),
      isValid: this.isWithinBounds(),
      canvas: this.render()
    };
  }
}

// Utility functions for common operations
export function createLogoAdjustmentService(
  logoImage: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  constraintMask?: ImageData
): LogoAdjustmentService {
  let allowedArea;
  
  if (constraintMask) {
    // Calculate bounding box from constraint mask
    const bounds = calculateMaskBounds(constraintMask);
    allowedArea = bounds;
  }
  
  return new LogoAdjustmentService(logoImage, canvasWidth, canvasHeight, allowedArea);
}

function calculateMaskBounds(mask: ImageData): { x: number; y: number; width: number; height: number } {
  let minX = mask.width;
  let minY = mask.height;
  let maxX = 0;
  let maxY = 0;
  
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const index = (y * mask.width + x) * 4;
      const alpha = mask.data[index + 3];
      
      if (alpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

export { LogoAdjustmentService as default };