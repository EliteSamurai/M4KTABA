/**
 * Mobile-specific utilities and helpers
 */

export interface MobileBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

export const MOBILE_BREAKPOINTS: MobileBreakpoint[] = [
  { name: 'xs', minWidth: 0, maxWidth: 575 },
  { name: 'sm', minWidth: 576, maxWidth: 767 },
  { name: 'md', minWidth: 768, maxWidth: 991 },
  { name: 'lg', minWidth: 992, maxWidth: 1199 },
  { name: 'xl', minWidth: 1200 },
];

export interface TouchTarget {
  minSize: number;
  recommendedSize: number;
  spacing: number;
}

export const TOUCH_TARGETS: TouchTarget = {
  minSize: 44, // 44px minimum for accessibility
  recommendedSize: 48, // 48px recommended
  spacing: 8, // 8px spacing between targets
};

export interface MobileOptimization {
  enableTouchGestures: boolean;
  enableSwipeNavigation: boolean;
  enablePullToRefresh: boolean;
  enableHapticFeedback: boolean;
  optimizeImages: boolean;
  lazyLoadImages: boolean;
  reduceAnimations: boolean;
  enableOfflineSupport: boolean;
}

export const DEFAULT_MOBILE_OPTIMIZATION: MobileOptimization = {
  enableTouchGestures: true,
  enableSwipeNavigation: true,
  enablePullToRefresh: true,
  enableHapticFeedback: true,
  optimizeImages: true,
  lazyLoadImages: true,
  reduceAnimations: false,
  enableOfflineSupport: true,
};

export class MobileUtils {
  private static instance: MobileUtils;
  private optimization: MobileOptimization;
  private isMobile: boolean;
  private _isTouchDevice: boolean;
  private currentBreakpoint: MobileBreakpoint;

  constructor() {
    this.optimization = { ...DEFAULT_MOBILE_OPTIMIZATION };
    this.isMobile = this.detectMobile();
    this._isTouchDevice = this.detectTouchDevice();
    this.currentBreakpoint = this.getCurrentBreakpoint();
  }

  static getInstance(): MobileUtils {
    if (!MobileUtils.instance) {
      MobileUtils.instance = new MobileUtils();
    }
    return MobileUtils.instance;
  }

  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;

    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
    );
  }

  private detectTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;

    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is IE-specific
      navigator.msMaxTouchPoints > 0
    );
  }

  isMobileDevice(): boolean {
    return this.isMobile;
  }

  isTouchDevice(): boolean {
    return this._isTouchDevice;
  }

  getCurrentBreakpoint(): MobileBreakpoint {
    return this.currentBreakpoint;
  }

  isBreakpoint(breakpoint: string): boolean {
    return this.currentBreakpoint.name === breakpoint;
  }

  isBreakpointOrSmaller(breakpoint: string): boolean {
    const targetIndex = MOBILE_BREAKPOINTS.findIndex(
      bp => bp.name === breakpoint
    );
    const currentIndex = MOBILE_BREAKPOINTS.findIndex(
      bp => bp.name === this.currentBreakpoint.name
    );
    return currentIndex <= targetIndex;
  }

  isBreakpointOrLarger(breakpoint: string): boolean {
    const targetIndex = MOBILE_BREAKPOINTS.findIndex(
      bp => bp.name === breakpoint
    );
    const currentIndex = MOBILE_BREAKPOINTS.findIndex(
      bp => bp.name === this.currentBreakpoint.name
    );
    return currentIndex >= targetIndex;
  }

  getOptimization(): MobileOptimization {
    return { ...this.optimization };
  }

  updateOptimization(updates: Partial<MobileOptimization>): void {
    this.optimization = { ...this.optimization, ...updates };
  }

  shouldOptimizeForMobile(): boolean {
    return this.isMobile || this._isTouchDevice;
  }

  getTouchTargetSize(): number {
    return this.optimization.enableTouchGestures
      ? TOUCH_TARGETS.recommendedSize
      : TOUCH_TARGETS.minSize;
  }

  getImageOptimizationSettings(): {
    quality: number;
    format: 'webp' | 'jpeg' | 'png';
    sizes: string;
  } {
    if (!this.optimization.optimizeImages) {
      return { quality: 100, format: 'jpeg', sizes: '100vw' };
    }

    const quality = this.isMobile ? 75 : 85;
    const format = this.isMobile ? 'webp' : 'jpeg';
    const sizes = this.isMobile
      ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      : '(max-width: 1200px) 50vw, 33vw';

    return { quality, format, sizes };
  }

  getAnimationSettings(): {
    duration: number;
    easing: string;
    reduceMotion: boolean;
  } {
    const reduceMotion =
      this.optimization.reduceAnimations ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    return {
      duration: reduceMotion ? 0 : 300,
      easing: 'ease-in-out',
      reduceMotion,
    };
  }

  getViewportHeight(): number {
    if (typeof window === 'undefined') return 800;
    return window.innerHeight;
  }

  getViewportWidth(): number {
    if (typeof window === 'undefined') return 1200;
    return window.innerWidth;
  }

  isLandscape(): boolean {
    return this.getViewportWidth() > this.getViewportHeight();
  }

  isPortrait(): boolean {
    return this.getViewportHeight() > this.getViewportWidth();
  }

  getSafeAreaInsets(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    if (typeof window === 'undefined') {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    // @ts-expect-error - safeAreaInsets is not in standard window type
    const insets = window.safeAreaInsets || {};
    return {
      top: insets.top || 0,
      right: insets.right || 0,
      bottom: insets.bottom || 0,
      left: insets.left || 0,
    };
  }

  enableHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (
      !this.optimization.enableHapticFeedback ||
      typeof window === 'undefined'
    ) {
      return;
    }

    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[type]);
    }
  }

  getScrollBehavior(): 'smooth' | 'auto' {
    return this.optimization.enableTouchGestures ? 'smooth' : 'auto';
  }

  getGridColumns(): number {
    if (this.isBreakpointOrSmaller('xs')) return 1;
    if (this.isBreakpointOrSmaller('sm')) return 2;
    if (this.isBreakpointOrSmaller('md')) return 3;
    if (this.isBreakpointOrSmaller('lg')) return 4;
    return 5;
  }

  getCardSpacing(): number {
    if (this.isBreakpointOrSmaller('sm')) return 12;
    if (this.isBreakpointOrSmaller('md')) return 16;
    return 20;
  }

  getFontSize(baseSize: number): number {
    if (this.isBreakpointOrSmaller('sm')) return baseSize * 0.9;
    if (this.isBreakpointOrSmaller('md')) return baseSize * 0.95;
    return baseSize;
  }

  getPadding(): {
    horizontal: number;
    vertical: number;
  } {
    if (this.isBreakpointOrSmaller('sm')) {
      return { horizontal: 16, vertical: 12 };
    }
    if (this.isBreakpointOrSmaller('md')) {
      return { horizontal: 20, vertical: 16 };
    }
    return { horizontal: 24, vertical: 20 };
  }

  getButtonSize(): 'sm' | 'md' | 'lg' {
    if (this.isBreakpointOrSmaller('sm')) return 'sm';
    if (this.isBreakpointOrSmaller('md')) return 'md';
    return 'lg';
  }

  getInputSize(): 'sm' | 'md' | 'lg' {
    if (this.isBreakpointOrSmaller('sm')) return 'sm';
    return 'md';
  }

  shouldShowMobileMenu(): boolean {
    return this.isBreakpointOrSmaller('md');
  }

  shouldShowDesktopMenu(): boolean {
    return this.isBreakpointOrLarger('lg');
  }

  getModalSize(): 'sm' | 'md' | 'lg' | 'xl' {
    if (this.isBreakpointOrSmaller('sm')) return 'sm';
    if (this.isBreakpointOrSmaller('md')) return 'md';
    return 'lg';
  }

  getDrawerSize(): 'sm' | 'md' | 'lg' {
    if (this.isBreakpointOrSmaller('sm')) return 'sm';
    return 'md';
  }
}

// Singleton instance
export const mobileUtils = MobileUtils.getInstance();

// Utility functions
export function isMobile(): boolean {
  return mobileUtils.isMobileDevice();
}

export function isTouchDevice(): boolean {
  return mobileUtils.isTouchDevice();
}

export function getCurrentBreakpoint(): MobileBreakpoint {
  return mobileUtils.getCurrentBreakpoint();
}

export function isBreakpoint(breakpoint: string): boolean {
  return mobileUtils.isBreakpoint(breakpoint);
}

export function shouldOptimizeForMobile(): boolean {
  return mobileUtils.shouldOptimizeForMobile();
}

export function getTouchTargetSize(): number {
  return mobileUtils.getTouchTargetSize();
}

export function getImageOptimizationSettings() {
  return mobileUtils.getImageOptimizationSettings();
}

export function getAnimationSettings() {
  return mobileUtils.getAnimationSettings();
}

export function enableHapticFeedback(
  type: 'light' | 'medium' | 'heavy' = 'light'
): void {
  mobileUtils.enableHapticFeedback(type);
}

export function getGridColumns(): number {
  return mobileUtils.getGridColumns();
}

export function getCardSpacing(): number {
  return mobileUtils.getCardSpacing();
}

export function getFontSize(baseSize: number): number {
  return mobileUtils.getFontSize(baseSize);
}

export function getPadding() {
  return mobileUtils.getPadding();
}

export function getButtonSize(): 'sm' | 'md' | 'lg' {
  return mobileUtils.getButtonSize();
}

export function getInputSize(): 'sm' | 'md' | 'lg' {
  return mobileUtils.getInputSize();
}

export function shouldShowMobileMenu(): boolean {
  return mobileUtils.shouldShowMobileMenu();
}

export function shouldShowDesktopMenu(): boolean {
  return mobileUtils.shouldShowDesktopMenu();
}

export function getModalSize(): 'sm' | 'md' | 'lg' | 'xl' {
  return mobileUtils.getModalSize();
}

export function getDrawerSize(): 'sm' | 'md' | 'lg' {
  return mobileUtils.getDrawerSize();
}

// CSS utility functions
export function getMobileCSS(): string {
  return `
    .mobile-optimized {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    
    .mobile-grid {
      display: grid;
      gap: ${getCardSpacing()}px;
      grid-template-columns: repeat(${getGridColumns()}, 1fr);
    }
    
    .mobile-button {
      min-height: ${getTouchTargetSize()}px;
      min-width: ${getTouchTargetSize()}px;
    }
    
    .mobile-input {
      font-size: ${getFontSize(16)}px;
      padding: ${getPadding().vertical}px ${getPadding().horizontal}px;
    }
    
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
}
