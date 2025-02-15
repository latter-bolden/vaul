'use client';
function __insertCSS(code) {
  if (!code || typeof document == 'undefined') return
  let head = document.head || document.getElementsByTagName('head')[0]
  let style = document.createElement('style')
  style.type = 'text/css'
  head.appendChild(style)
  ;style.styleSheet ? (style.styleSheet.cssText = code) : style.appendChild(document.createTextNode(code))
}

Object.defineProperty(exports, '__esModule', { value: true });

var DialogPrimitive = require('@radix-ui/react-dialog');
var React = require('react');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return n;
}

var DialogPrimitive__namespace = /*#__PURE__*/_interopNamespace(DialogPrimitive);
var React__namespace = /*#__PURE__*/_interopNamespace(React);

const DrawerContext = React__namespace.default.createContext({
    drawerRef: {
        current: null
    },
    overlayRef: {
        current: null
    },
    scaleBackground: ()=>{},
    onPress: ()=>{},
    onRelease: ()=>{},
    onDrag: ()=>{},
    onNestedDrag: ()=>{},
    onNestedOpenChange: ()=>{},
    onNestedRelease: ()=>{},
    openProp: undefined,
    dismissible: false,
    isOpen: false,
    keyboardIsOpen: {
        current: false
    },
    snapPointsOffset: null,
    snapPoints: null,
    modal: false,
    shouldFade: false,
    activeSnapPoint: null,
    onOpenChange: ()=>{},
    setActiveSnapPoint: ()=>{},
    visible: false,
    closeDrawer: ()=>{},
    setVisible: ()=>{}
});
const useDrawerContext = ()=>React__namespace.default.useContext(DrawerContext);

__insertCSS("[vaul-drawer]{touch-action:none;transform:translate3d(0,100%,0);transition:transform 0.5s cubic-bezier(0.32,0.72,0,1);}.vaul-dragging .vaul-scrollable{overflow-y:hidden !important;}[vaul-drawer][vaul-drawer-visible='true']{transform:translate3d(0,var(--snap-point-height,0),0);}[vaul-overlay]{opacity:0;transition:opacity 0.5s cubic-bezier(0.32,0.72,0,1);}[vaul-overlay][vaul-drawer-visible='true']{opacity:1;}[vaul-drawer]::after{content:'';position:absolute;top:100%;background:inherit;background-color:inherit;left:0;right:0;height:200%;}[vaul-overlay][vaul-snap-points='true']:not([vaul-snap-points-overlay='true']):not([data-state='closed']){opacity:0;}[vaul-overlay][vaul-snap-points-overlay='true']:not([vaul-drawer-visible='false']){opacity:1;}undefined\n@keyframes fake-animation{from{}to{}}@media (hover:hover) and (pointer:fine){[vaul-drawer]{user-select:none;}}");

// This code comes from https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/overlays/src/usePreventScroll.ts
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
function chain(...callbacks) {
    return (...args)=>{
        for (let callback of callbacks){
            if (typeof callback === 'function') {
                callback(...args);
            }
        }
    };
}
function isMac() {
    return testPlatform(/^Mac/);
}
function isIPhone() {
    return testPlatform(/^iPhone/);
}
function isIPad() {
    return testPlatform(/^iPad/) || // iPadOS 13 lies and says it's a Mac, but we can distinguish by detecting touch support.
    isMac() && navigator.maxTouchPoints > 1;
}
function isIOS() {
    return isIPhone() || isIPad();
}
function testPlatform(re) {
    return typeof window !== 'undefined' && window.navigator != null ? re.test(window.navigator.platform) : undefined;
}
// @ts-ignore
const visualViewport = typeof document !== 'undefined' && window.visualViewport;
function isScrollable(node) {
    let style = window.getComputedStyle(node);
    return /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY);
}
function getScrollParent(node) {
    if (isScrollable(node)) {
        node = node.parentElement;
    }
    while(node && !isScrollable(node)){
        node = node.parentElement;
    }
    return node || document.scrollingElement || document.documentElement;
}
// HTML input types that do not cause the software keyboard to appear.
const nonTextInputTypes = new Set([
    'checkbox',
    'radio',
    'range',
    'color',
    'file',
    'image',
    'button',
    'submit',
    'reset'
]);
// The number of active usePreventScroll calls. Used to determine whether to revert back to the original page style/scroll position
let preventScrollCount = 0;
let restore;
/**
 * Prevents scrolling on the document body on mount, and
 * restores it on unmount. Also ensures that content does not
 * shift due to the scrollbars disappearing.
 */ function usePreventScroll(options = {}) {
    let { isDisabled } = options;
    useIsomorphicLayoutEffect(()=>{
        if (isDisabled) {
            return;
        }
        preventScrollCount++;
        if (preventScrollCount === 1) {
            if (isIOS()) {
                restore = preventScrollMobileSafari();
            } else {
                restore = preventScrollStandard();
            }
        }
        return ()=>{
            preventScrollCount--;
            if (preventScrollCount === 0) {
                restore();
            }
        };
    }, [
        isDisabled
    ]);
}
// For most browsers, all we need to do is set `overflow: hidden` on the root element, and
// add some padding to prevent the page from shifting when the scrollbar is hidden.
function preventScrollStandard() {
    return chain(setStyle(document.documentElement, 'paddingRight', `${window.innerWidth - document.documentElement.clientWidth}px`), setStyle(document.documentElement, 'overflow', 'hidden'));
}
// Mobile Safari is a whole different beast. Even with overflow: hidden,
// it still scrolls the page in many situations:
//
// 1. When the bottom toolbar and address bar are collapsed, page scrolling is always allowed.
// 2. When the keyboard is visible, the viewport does not resize. Instead, the keyboard covers part of
//    it, so it becomes scrollable.
// 3. When tapping on an input, the page always scrolls so that the input is centered in the visual viewport.
//    This may cause even fixed position elements to scroll off the screen.
// 4. When using the next/previous buttons in the keyboard to navigate between inputs, the whole page always
//    scrolls, even if the input is inside a nested scrollable element that could be scrolled instead.
//
// In order to work around these cases, and prevent scrolling without jankiness, we do a few things:
//
// 1. Prevent default on `touchmove` events that are not in a scrollable element. This prevents touch scrolling
//    on the window.
// 2. Prevent default on `touchmove` events inside a scrollable element when the scroll position is at the
//    top or bottom. This avoids the whole page scrolling instead, but does prevent overscrolling.
// 3. Prevent default on `touchend` events on input elements and handle focusing the element ourselves.
// 4. When focusing an input, apply a transform to trick Safari into thinking the input is at the top
//    of the page, which prevents it from scrolling the page. After the input is focused, scroll the element
//    into view ourselves, without scrolling the whole page.
// 5. Offset the body by the scroll position using a negative margin and scroll to the top. This should appear the
//    same visually, but makes the actual scroll position always zero. This is required to make all of the
//    above work or Safari will still try to scroll the page when focusing an input.
// 6. As a last resort, handle window scroll events, and scroll back to the top. This can happen when attempting
//    to navigate to an input with the next/previous buttons that's outside a modal.
function preventScrollMobileSafari() {
    let scrollable;
    let lastY = 0;
    let onTouchStart = (e)=>{
        // Store the nearest scrollable parent element from the element that the user touched.
        scrollable = getScrollParent(e.target);
        if (scrollable === document.documentElement && scrollable === document.body) {
            return;
        }
        lastY = e.changedTouches[0].pageY;
    };
    let onTouchMove = (e)=>{
        // Prevent scrolling the window.
        if (!scrollable || scrollable === document.documentElement || scrollable === document.body) {
            e.preventDefault();
            return;
        }
        // Prevent scrolling up when at the top and scrolling down when at the bottom
        // of a nested scrollable area, otherwise mobile Safari will start scrolling
        // the window instead. Unfortunately, this disables bounce scrolling when at
        // the top but it's the best we can do.
        let y = e.changedTouches[0].pageY;
        let scrollTop = scrollable.scrollTop;
        let bottom = scrollable.scrollHeight - scrollable.clientHeight;
        if (bottom === 0) {
            return;
        }
        if (scrollTop <= 0 && y > lastY || scrollTop >= bottom && y < lastY) {
            e.preventDefault();
        }
        lastY = y;
    };
    let onTouchEnd = (e)=>{
        let target = e.target;
        // Apply this change if we're not already focused on the target element
        if (isInput(target) && target !== document.activeElement) {
            e.preventDefault();
            // Apply a transform to trick Safari into thinking the input is at the top of the page
            // so it doesn't try to scroll it into view. When tapping on an input, this needs to
            // be done before the "focus" event, so we have to focus the element ourselves.
            target.style.transform = 'translateY(-2000px)';
            target.focus();
            requestAnimationFrame(()=>{
                target.style.transform = '';
            });
        }
    };
    let onFocus = (e)=>{
        let target = e.target;
        if (isInput(target)) {
            // Transform also needs to be applied in the focus event in cases where focus moves
            // other than tapping on an input directly, e.g. the next/previous buttons in the
            // software keyboard. In these cases, it seems applying the transform in the focus event
            // is good enough, whereas when tapping an input, it must be done before the focus event. 🤷‍♂️
            target.style.transform = 'translateY(-2000px)';
            requestAnimationFrame(()=>{
                target.style.transform = '';
                // This will have prevented the browser from scrolling the focused element into view,
                // so we need to do this ourselves in a way that doesn't cause the whole page to scroll.
                if (visualViewport) {
                    if (visualViewport.height < window.innerHeight) {
                        // If the keyboard is already visible, do this after one additional frame
                        // to wait for the transform to be removed.
                        requestAnimationFrame(()=>{
                            scrollIntoView(target);
                        });
                    } else {
                        // Otherwise, wait for the visual viewport to resize before scrolling so we can
                        // measure the correct position to scroll to.
                        visualViewport.addEventListener('resize', ()=>scrollIntoView(target), {
                            once: true
                        });
                    }
                }
            });
        }
    };
    let onWindowScroll = ()=>{
        // Last resort. If the window scrolled, scroll it back to the top.
        // It should always be at the top because the body will have a negative margin (see below).
        window.scrollTo(0, 0);
    };
    // Record the original scroll position so we can restore it.
    // Then apply a negative margin to the body to offset it by the scroll position. This will
    // enable us to scroll the window to the top, which is required for the rest of this to work.
    let scrollX = window.pageXOffset;
    let scrollY = window.pageYOffset;
    let restoreStyles = chain(setStyle(document.documentElement, 'paddingRight', `${window.innerWidth - document.documentElement.clientWidth}px`), setStyle(document.documentElement, 'overflow', 'hidden'));
    // Scroll to the top. The negative margin on the body will make this appear the same.
    window.scrollTo(0, 0);
    let removeEvents = chain(addEvent(document, 'touchstart', onTouchStart, {
        passive: false,
        capture: true
    }), addEvent(document, 'touchmove', onTouchMove, {
        passive: false,
        capture: true
    }), addEvent(document, 'touchend', onTouchEnd, {
        passive: false,
        capture: true
    }), addEvent(document, 'focus', onFocus, true), addEvent(window, 'scroll', onWindowScroll));
    return ()=>{
        // Restore styles and scroll the page back to where it was.
        restoreStyles();
        removeEvents();
        window.scrollTo(scrollX, scrollY);
    };
}
// Sets a CSS property on an element, and returns a function to revert it to the previous value.
function setStyle(element, style, value) {
    let cur = element.style[style];
    element.style[style] = value;
    return ()=>{
        element.style[style] = cur;
    };
}
// Adds an event listener to an element, and returns a function to remove it.
function addEvent(target, event, handler, options) {
    // @ts-ignore
    target.addEventListener(event, handler, options);
    return ()=>{
        // @ts-ignore
        target.removeEventListener(event, handler, options);
    };
}
function scrollIntoView(target) {
    let root = document.scrollingElement || document.documentElement;
    while(target && target !== root){
        // Find the parent scrollable element and adjust the scroll position if the target is not already in view.
        let scrollable = getScrollParent(target);
        if (scrollable !== document.documentElement && scrollable !== document.body && scrollable !== target) {
            let scrollableTop = scrollable.getBoundingClientRect().top;
            let targetTop = target.getBoundingClientRect().top;
            let targetBottom = target.getBoundingClientRect().bottom;
            const keyboardHeight = scrollable.getBoundingClientRect().bottom;
            if (targetBottom > keyboardHeight) {
                scrollable.scrollTop += targetTop - scrollableTop;
            }
        }
        // @ts-ignore
        target = scrollable.parentElement;
    }
}
function isInput(target) {
    return target instanceof HTMLInputElement && !nonTextInputTypes.has(target.type) || target instanceof HTMLTextAreaElement || target instanceof HTMLElement && target.isContentEditable;
}

// This code comes from https://github.com/radix-ui/primitives/tree/main/packages/react/compose-refs
/**
 * Set a given ref to a given value
 * This utility takes care of different types of refs: callback refs and RefObject(s)
 */ function setRef(ref, value) {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref !== null && ref !== undefined) {
        ref.current = value;
    }
}
/**
 * A utility to compose multiple refs together
 * Accepts callback refs and RefObject(s)
 */ function composeRefs(...refs) {
    return (node)=>refs.forEach((ref)=>setRef(ref, node));
}
/**
 * A custom hook that composes multiple refs
 * Accepts callback refs and RefObject(s)
 */ function useComposedRefs(...refs) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return React__namespace.useCallback(composeRefs(...refs), refs);
}

let previousBodyPosition = null;
function usePositionFixed({ isOpen, modal, nested, hasBeenOpened }) {
    const [activeUrl, setActiveUrl] = React__namespace.default.useState(typeof window !== 'undefined' ? window.location.href : '');
    const scrollPos = React__namespace.default.useRef(0);
    function setPositionFixed() {
        // If previousBodyPosition is already set, don't set it again.
        if (previousBodyPosition === null && isOpen) {
            previousBodyPosition = {
                position: document.body.style.position,
                top: document.body.style.top,
                left: document.body.style.left,
                height: document.body.style.height
            };
            // Update the dom inside an animation frame
            const { scrollX, innerHeight } = window;
            document.body.style.setProperty('position', 'fixed', 'important');
            document.body.style.top = `${-scrollPos.current}px`;
            document.body.style.left = `${-scrollX}px`;
            document.body.style.right = '0px';
            document.body.style.height = 'auto';
            setTimeout(()=>requestAnimationFrame(()=>{
                    // Attempt to check if the bottom bar appeared due to the position change
                    const bottomBarHeight = innerHeight - window.innerHeight;
                    if (bottomBarHeight && scrollPos.current >= innerHeight) {
                        // Move the content further up so that the bottom bar doesn't hide it
                        document.body.style.top = `${-(scrollPos.current + bottomBarHeight)}px`;
                    }
                }), 300);
        }
    }
    function restorePositionSetting() {
        if (previousBodyPosition !== null) {
            // Convert the position from "px" to Int
            const y = -parseInt(document.body.style.top, 10);
            const x = -parseInt(document.body.style.left, 10);
            // Restore styles
            document.body.style.position = previousBodyPosition.position;
            document.body.style.top = previousBodyPosition.top;
            document.body.style.left = previousBodyPosition.left;
            document.body.style.height = previousBodyPosition.height;
            document.body.style.right = 'unset';
            requestAnimationFrame(()=>{
                if (activeUrl !== window.location.href) {
                    setActiveUrl(window.location.href);
                    return;
                }
                window.scrollTo(x, y);
            });
            previousBodyPosition = null;
        }
    }
    React__namespace.default.useEffect(()=>{
        function onScroll() {
            scrollPos.current = window.scrollY;
        }
        onScroll();
        window.addEventListener('scroll', onScroll);
        return ()=>{
            window.removeEventListener('scroll', onScroll);
        };
    }, []);
    React__namespace.default.useEffect(()=>{
        if (nested || !hasBeenOpened) return;
        // This is needed to force Safari toolbar to show **before** the drawer starts animating to prevent a gnarly shift from happening
        if (isOpen) {
            setPositionFixed();
            if (!modal) {
                setTimeout(()=>{
                    restorePositionSetting();
                }, 500);
            }
        } else {
            restorePositionSetting();
        }
    }, [
        isOpen,
        hasBeenOpened,
        activeUrl
    ]);
    return {
        restorePositionSetting
    };
}

const cache = new WeakMap();
function set(el, styles, ignoreCache = false) {
    if (!el || !(el instanceof HTMLElement) || !styles) return;
    let originalStyles = {};
    Object.entries(styles).forEach(([key, value])=>{
        if (key.startsWith('--')) {
            el.style.setProperty(key, value);
            return;
        }
        originalStyles[key] = el.style[key];
        el.style[key] = value;
    });
    if (ignoreCache) return;
    cache.set(el, originalStyles);
}
function reset(el, prop) {
    if (!el || !(el instanceof HTMLElement)) return;
    let originalStyles = cache.get(el);
    if (!originalStyles) {
        return;
    }
    if (prop) {
        el.style[prop] = originalStyles[prop];
    } else {
        Object.entries(originalStyles).forEach(([key, value])=>{
            el.style[key] = value;
        });
    }
}
function getTranslateY(element) {
    const style = window.getComputedStyle(element);
    const transform = // @ts-ignore
    style.transform || style.webkitTransform || style.mozTransform;
    let mat = transform.match(/^matrix3d\((.+)\)$/);
    if (mat) return parseFloat(mat[1].split(', ')[13]);
    mat = transform.match(/^matrix\((.+)\)$/);
    return mat ? parseFloat(mat[1].split(', ')[5]) : null;
}
function dampenValue(v) {
    return 8 * (Math.log(v + 1) - 2);
}

const TRANSITIONS = {
    DURATION: 0.5,
    EASE: [
        0.32,
        0.72,
        0,
        1
    ]
};
const VELOCITY_THRESHOLD = 0.4;

// This code comes from https://github.com/radix-ui/primitives/blob/main/packages/react/use-controllable-state/src/useControllableState.tsx
function useCallbackRef(callback) {
    const callbackRef = React__namespace.default.useRef(callback);
    React__namespace.default.useEffect(()=>{
        callbackRef.current = callback;
    });
    // https://github.com/facebook/react/issues/19240
    return React__namespace.default.useMemo(()=>(...args)=>callbackRef.current == null ? void 0 : callbackRef.current.call(callbackRef, ...args), []);
}
function useUncontrolledState({ defaultProp, onChange }) {
    const uncontrolledState = React__namespace.default.useState(defaultProp);
    const [value] = uncontrolledState;
    const prevValueRef = React__namespace.default.useRef(value);
    const handleChange = useCallbackRef(onChange);
    React__namespace.default.useEffect(()=>{
        if (prevValueRef.current !== value) {
            handleChange(value);
            prevValueRef.current = value;
        }
    }, [
        value,
        prevValueRef,
        handleChange
    ]);
    return uncontrolledState;
}
function useControllableState({ prop, defaultProp, onChange = ()=>{} }) {
    const [uncontrolledProp, setUncontrolledProp] = useUncontrolledState({
        defaultProp,
        onChange
    });
    const isControlled = prop !== undefined;
    const value = isControlled ? prop : uncontrolledProp;
    const handleChange = useCallbackRef(onChange);
    const setValue = React__namespace.default.useCallback((nextValue)=>{
        if (isControlled) {
            const setter = nextValue;
            const value = typeof nextValue === 'function' ? setter(prop) : nextValue;
            if (value !== prop) handleChange(value);
        } else {
            setUncontrolledProp(nextValue);
        }
    }, [
        isControlled,
        prop,
        setUncontrolledProp,
        handleChange
    ]);
    return [
        value,
        setValue
    ];
}

function useSnapPoints({ activeSnapPointProp, setActiveSnapPointProp, snapPoints, drawerRef, overlayRef, fadeFromIndex, onSnapPointChange }) {
    const [activeSnapPoint, setActiveSnapPoint] = useControllableState({
        prop: activeSnapPointProp,
        defaultProp: snapPoints == null ? void 0 : snapPoints[0],
        onChange: setActiveSnapPointProp
    });
    const isLastSnapPoint = React__namespace.default.useMemo(()=>{
        var _ref;
        return (_ref = activeSnapPoint === (snapPoints == null ? void 0 : snapPoints[snapPoints.length - 1])) != null ? _ref : null;
    }, [
        snapPoints,
        activeSnapPoint
    ]);
    const shouldFade = snapPoints && snapPoints.length > 0 && (fadeFromIndex || fadeFromIndex === 0) && !Number.isNaN(fadeFromIndex) && snapPoints[fadeFromIndex] === activeSnapPoint || !snapPoints;
    const activeSnapPointIndex = React__namespace.default.useMemo(()=>{
        var _snapPoints_findIndex;
        return (_snapPoints_findIndex = snapPoints == null ? void 0 : snapPoints.findIndex((snapPoint)=>snapPoint === activeSnapPoint)) != null ? _snapPoints_findIndex : null;
    }, [
        snapPoints,
        activeSnapPoint
    ]);
    const snapPointsOffset = React__namespace.default.useMemo(()=>{
        var _snapPoints_map;
        return (_snapPoints_map = snapPoints == null ? void 0 : snapPoints.map((snapPoint)=>{
            const hasWindow = typeof window !== 'undefined';
            const isPx = typeof snapPoint === 'string';
            let snapPointAsNumber = 0;
            if (isPx) {
                snapPointAsNumber = parseInt(snapPoint, 10);
            }
            const height = isPx ? snapPointAsNumber : hasWindow ? snapPoint * window.innerHeight : 0;
            if (hasWindow) {
                return window.innerHeight - height;
            }
            return height;
        })) != null ? _snapPoints_map : [];
    }, [
        snapPoints
    ]);
    const activeSnapPointOffset = React__namespace.default.useMemo(()=>activeSnapPointIndex !== null ? snapPointsOffset == null ? void 0 : snapPointsOffset[activeSnapPointIndex] : null, [
        snapPointsOffset,
        activeSnapPointIndex
    ]);
    const snapToPoint = React__namespace.default.useCallback((height)=>{
        var _snapPointsOffset_findIndex;
        const newSnapPointIndex = (_snapPointsOffset_findIndex = snapPointsOffset == null ? void 0 : snapPointsOffset.findIndex((snapPointHeight)=>snapPointHeight === height)) != null ? _snapPointsOffset_findIndex : null;
        onSnapPointChange(newSnapPointIndex);
        set(drawerRef.current, {
            transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
            transform: `translate3d(0, ${height}px, 0)`
        });
        if (snapPointsOffset && newSnapPointIndex !== snapPointsOffset.length - 1 && newSnapPointIndex !== fadeFromIndex) {
            set(overlayRef.current, {
                transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
                opacity: '0'
            });
        } else {
            set(overlayRef.current, {
                transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
                opacity: '1'
            });
        }
        setActiveSnapPoint(newSnapPointIndex !== null ? snapPoints == null ? void 0 : snapPoints[newSnapPointIndex] : null);
    }, [
        drawerRef.current,
        snapPoints,
        snapPointsOffset,
        fadeFromIndex,
        overlayRef,
        setActiveSnapPoint
    ]);
    React__namespace.default.useEffect(()=>{
        if (activeSnapPointProp) {
            var _snapPoints_findIndex;
            const newIndex = (_snapPoints_findIndex = snapPoints == null ? void 0 : snapPoints.findIndex((snapPoint)=>snapPoint === activeSnapPointProp)) != null ? _snapPoints_findIndex : null;
            if (snapPointsOffset && newIndex && typeof snapPointsOffset[newIndex] === 'number') {
                snapToPoint(snapPointsOffset[newIndex]);
            }
        }
    }, [
        activeSnapPointProp,
        snapPoints,
        snapPointsOffset,
        snapToPoint
    ]);
    function onRelease({ draggedDistance, closeDrawer, velocity, dismissible }) {
        if (fadeFromIndex === undefined) return;
        const currentPosition = activeSnapPointOffset - draggedDistance;
        const isOverlaySnapPoint = activeSnapPointIndex === fadeFromIndex - 1;
        const isFirst = activeSnapPointIndex === 0;
        const hasDraggedUp = draggedDistance > 0;
        if (isOverlaySnapPoint) {
            set(overlayRef.current, {
                transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`
            });
        }
        if (velocity > 2 && !hasDraggedUp) {
            if (dismissible) closeDrawer();
            else snapToPoint(snapPointsOffset[0]); // snap to initial point
            return;
        }
        if (velocity > 2 && hasDraggedUp && snapPointsOffset && snapPoints) {
            snapToPoint(snapPointsOffset[snapPoints.length - 1]);
            return;
        }
        // Find the closest snap point to the current position
        const closestSnapPoint = snapPointsOffset == null ? void 0 : snapPointsOffset.reduce((prev, curr)=>{
            if (typeof prev !== 'number' || typeof curr !== 'number') return prev;
            return Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev;
        });
        if (velocity > VELOCITY_THRESHOLD && Math.abs(draggedDistance) < window.innerHeight * 0.4) {
            const dragDirection = hasDraggedUp ? 1 : -1; // 1 = up, -1 = down
            // Don't do anything if we swipe upwards while being on the last snap point
            if (dragDirection > 0 && isLastSnapPoint) {
                snapToPoint(snapPointsOffset[snapPoints.length - 1]);
                return;
            }
            if (isFirst && dragDirection < 0 && dismissible) {
                closeDrawer();
            }
            if (activeSnapPointIndex === null) return;
            snapToPoint(snapPointsOffset[activeSnapPointIndex + dragDirection]);
            return;
        }
        snapToPoint(closestSnapPoint);
    }
    function onDrag({ draggedDistance }) {
        if (activeSnapPointOffset === null) return;
        const newYValue = activeSnapPointOffset - draggedDistance;
        set(drawerRef.current, {
            transform: `translate3d(0, ${newYValue}px, 0)`
        });
    }
    function getPercentageDragged(absDraggedDistance, isDraggingDown) {
        if (!snapPoints || typeof activeSnapPointIndex !== 'number' || !snapPointsOffset || fadeFromIndex === undefined) return null;
        // If this is true we are dragging to a snap point that is supposed to have an overlay
        const isOverlaySnapPoint = activeSnapPointIndex === fadeFromIndex - 1;
        const isOverlaySnapPointOrHigher = activeSnapPointIndex >= fadeFromIndex;
        if (isOverlaySnapPointOrHigher && isDraggingDown) {
            return 0;
        }
        // Don't animate, but still use this one if we are dragging away from the overlaySnapPoint
        if (isOverlaySnapPoint && !isDraggingDown) return 1;
        if (!shouldFade && !isOverlaySnapPoint) return null;
        // Either fadeFrom index or the one before
        const targetSnapPointIndex = isOverlaySnapPoint ? activeSnapPointIndex + 1 : activeSnapPointIndex - 1;
        // Get the distance from overlaySnapPoint to the one before or vice-versa to calculate the opacity percentage accordingly
        const snapPointDistance = isOverlaySnapPoint ? snapPointsOffset[targetSnapPointIndex] - snapPointsOffset[targetSnapPointIndex - 1] : snapPointsOffset[targetSnapPointIndex + 1] - snapPointsOffset[targetSnapPointIndex];
        const percentageDragged = absDraggedDistance / Math.abs(snapPointDistance);
        if (isOverlaySnapPoint) {
            return 1 - percentageDragged;
        } else {
            return percentageDragged;
        }
    }
    return {
        isLastSnapPoint,
        activeSnapPoint,
        shouldFade,
        getPercentageDragged,
        setActiveSnapPoint,
        activeSnapPointIndex,
        onRelease,
        onDrag,
        snapPointsOffset
    };
}

const CLOSE_THRESHOLD = 0.25;
const SCROLL_LOCK_TIMEOUT = 100;
const BORDER_RADIUS = 8;
const NESTED_DISPLACEMENT = 16;
const WINDOW_TOP_OFFSET = 26;
const DRAG_CLASS = 'vaul-dragging';
function Root({ open: openProp, onOpenChange, children, shouldScaleBackground, onDrag: onDragProp, onRelease: onReleaseProp, snapPoints, nested, closeThreshold = CLOSE_THRESHOLD, scrollLockTimeout = SCROLL_LOCK_TIMEOUT, dismissible = true, fadeFromIndex = snapPoints && snapPoints.length - 1, activeSnapPoint: activeSnapPointProp, setActiveSnapPoint: setActiveSnapPointProp, fixed, modal = true, onClose }) {
    var _drawerRef_current;
    const [isOpen = false, setIsOpen] = React__namespace.default.useState(false);
    const [hasBeenOpened, setHasBeenOpened] = React__namespace.default.useState(false);
    // Not visible = translateY(100%)
    const [visible, setVisible] = React__namespace.default.useState(false);
    const [mounted, setMounted] = React__namespace.default.useState(false);
    const [isDragging, setIsDragging] = React__namespace.default.useState(false);
    const [justReleased, setJustReleased] = React__namespace.default.useState(false);
    const overlayRef = React__namespace.default.useRef(null);
    const openTime = React__namespace.default.useRef(null);
    const dragStartTime = React__namespace.default.useRef(null);
    const dragEndTime = React__namespace.default.useRef(null);
    const lastTimeDragPrevented = React__namespace.default.useRef(null);
    const isAllowedToDrag = React__namespace.default.useRef(false);
    const nestedOpenChangeTimer = React__namespace.default.useRef(null);
    const pointerStartY = React__namespace.default.useRef(0);
    const keyboardIsOpen = React__namespace.default.useRef(false);
    React__namespace.default.useRef(0);
    const drawerRef = React__namespace.default.useRef(null);
    const drawerHeightRef = React__namespace.default.useRef(((_drawerRef_current = drawerRef.current) == null ? void 0 : _drawerRef_current.getBoundingClientRect().height) || 0);
    React__namespace.default.useRef(0);
    const onSnapPointChange = React__namespace.default.useCallback((activeSnapPointIndex)=>{
        // Change openTime ref when we reach the last snap point to prevent dragging for 500ms incase it's scrollable.
        if (snapPoints && activeSnapPointIndex === snapPointsOffset.length - 1) openTime.current = new Date();
    }, []);
    const { activeSnapPoint, activeSnapPointIndex, setActiveSnapPoint, onRelease: onReleaseSnapPoints, snapPointsOffset, onDrag: onDragSnapPoints, shouldFade, getPercentageDragged: getSnapPointsPercentageDragged } = useSnapPoints({
        snapPoints,
        activeSnapPointProp,
        setActiveSnapPointProp,
        drawerRef,
        fadeFromIndex,
        overlayRef,
        onSnapPointChange
    });
    usePreventScroll({
        isDisabled: !isOpen || isDragging || !modal || justReleased || !hasBeenOpened
    });
    const { restorePositionSetting } = usePositionFixed({
        isOpen,
        modal,
        nested,
        hasBeenOpened
    });
    function getScale() {
        return (window.innerWidth - WINDOW_TOP_OFFSET) / window.innerWidth;
    }
    function onPress(event) {
        var _drawerRef_current;
        if (!dismissible && !snapPoints) return;
        if (drawerRef.current && !drawerRef.current.contains(event.target)) return;
        drawerHeightRef.current = ((_drawerRef_current = drawerRef.current) == null ? void 0 : _drawerRef_current.getBoundingClientRect().height) || 0;
        setIsDragging(true);
        dragStartTime.current = new Date();
        // iOS doesn't trigger mouseUp after scrolling so we need to listen to touched in order to disallow dragging
        if (isIOS()) {
            window.addEventListener('touchend', ()=>isAllowedToDrag.current = false, {
                once: true
            });
        }
        // Ensure we maintain correct pointer capture even when going outside of the drawer
        event.target.setPointerCapture(event.pointerId);
        pointerStartY.current = event.screenY;
    }
    function shouldDrag(el, isDraggingDown) {
        var _window_getSelection;
        let element = el;
        const highlightedText = (_window_getSelection = window.getSelection()) == null ? void 0 : _window_getSelection.toString();
        const swipeAmount = drawerRef.current ? getTranslateY(drawerRef.current) : null;
        const date = new Date();
        // Allow scrolling when animating
        if (openTime.current && date.getTime() - openTime.current.getTime() < 500) {
            return false;
        }
        if (swipeAmount > 0) {
            return true;
        }
        // Don't drag if there's highlighted text
        if (highlightedText && highlightedText.length > 0) {
            return false;
        }
        // Disallow dragging if drawer was scrolled within `scrollLockTimeout`
        if (lastTimeDragPrevented.current && date.getTime() - lastTimeDragPrevented.current.getTime() < scrollLockTimeout && swipeAmount === 0) {
            lastTimeDragPrevented.current = date;
            return false;
        }
        if (isDraggingDown) {
            lastTimeDragPrevented.current = date;
            // We are dragging down so we should allow scrolling
            return false;
        }
        // Keep climbing up the DOM tree as long as there's a parent
        while(element){
            // Check if the element is scrollable
            if (element.scrollHeight > element.clientHeight) {
                if (element.scrollTop !== 0) {
                    lastTimeDragPrevented.current = new Date();
                    // The element is scrollable and not scrolled to the top, so don't drag
                    return false;
                }
                if (element.getAttribute('role') === 'dialog') {
                    return true;
                }
            }
            // Move up to the parent element
            element = element.parentNode;
        }
        // No scrollable parents not scrolled to the top found, so drag
        return true;
    }
    function onDrag(event) {
        // We need to know how much of the drawer has been dragged in percentages so that we can transform background accordingly
        if (isDragging) {
            const draggedDistance = pointerStartY.current - event.screenY;
            const isDraggingDown = draggedDistance > 0;
            // Disallow dragging down to close when first snap point is the active one and dismissible prop is set to false.
            if (snapPoints && activeSnapPointIndex === 0 && !dismissible) return;
            if (!isAllowedToDrag.current && !shouldDrag(event.target, isDraggingDown)) return;
            drawerRef.current.classList.add(DRAG_CLASS);
            // If shouldDrag gave true once after pressing down on the drawer, we set isAllowedToDrag to true and it will remain true until we let go, there's no reason to disable dragging mid way, ever, and that's the solution to it
            isAllowedToDrag.current = true;
            set(drawerRef.current, {
                transition: 'none'
            });
            set(overlayRef.current, {
                transition: 'none'
            });
            if (snapPoints) {
                onDragSnapPoints({
                    draggedDistance
                });
            }
            // Run this only if snapPoints are not defined or if we are at the last snap point (highest one)
            if (isDraggingDown && !snapPoints) {
                const dampenedDraggedDistance = dampenValue(draggedDistance);
                set(drawerRef.current, {
                    transform: `translate3d(0, ${Math.min(dampenedDraggedDistance * -1, 0)}px, 0)`
                });
                return;
            }
            // We need to capture last time when drag with scroll was triggered and have a timeout between
            const absDraggedDistance = Math.abs(draggedDistance);
            const wrapper = document.querySelector('[vaul-drawer-wrapper]');
            let percentageDragged = absDraggedDistance / drawerHeightRef.current;
            const snapPointPercentageDragged = getSnapPointsPercentageDragged(absDraggedDistance, isDraggingDown);
            if (snapPointPercentageDragged !== null) {
                percentageDragged = snapPointPercentageDragged;
            }
            const opacityValue = 1 - percentageDragged;
            if (shouldFade || fadeFromIndex && activeSnapPointIndex === fadeFromIndex - 1) {
                onDragProp == null ? void 0 : onDragProp(event, percentageDragged);
                set(overlayRef.current, {
                    opacity: `${opacityValue}`,
                    transition: 'none'
                }, true);
            }
            if (wrapper && overlayRef.current && shouldScaleBackground) {
                // Calculate percentageDragged as a fraction (0 to 1)
                const scaleValue = Math.min(getScale() + percentageDragged * (1 - getScale()), 1);
                const borderRadiusValue = 8 - percentageDragged * 8;
                const translateYValue = Math.max(0, 14 - percentageDragged * 14);
                set(wrapper, {
                    borderRadius: `${borderRadiusValue}px`,
                    transform: `scale(${scaleValue}) translate3d(0, ${translateYValue}px, 0)`,
                    transition: 'none'
                }, true);
            }
            if (!snapPoints) {
                set(drawerRef.current, {
                    transform: `translate3d(0, ${absDraggedDistance}px, 0)`
                });
            }
        }
    }
    React__namespace.default.useEffect(()=>{
        return ()=>{
            scaleBackground(false);
            restorePositionSetting();
        };
    }, []);
    function closeDrawer() {
        if (!drawerRef.current) return;
        onClose == null ? void 0 : onClose();
        set(drawerRef.current, {
            transform: `translate3d(0, 100%, 0)`,
            transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`
        });
        set(overlayRef.current, {
            opacity: '0',
            transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`
        });
        scaleBackground(false);
        setTimeout(()=>{
            setVisible(false);
            setIsOpen(false);
        }, 300);
        setTimeout(()=>{
            if (snapPoints) {
                setActiveSnapPoint(snapPoints[0]);
            }
        }, TRANSITIONS.DURATION * 1000); // seconds to ms
    }
    React__namespace.default.useEffect(()=>{
        if (!isOpen && shouldScaleBackground) {
            // Can't use `onAnimationEnd` as the component will be invisible by then
            const id = setTimeout(()=>{
                reset(document.body);
            }, 200);
            return ()=>clearTimeout(id);
        }
    }, [
        isOpen,
        shouldScaleBackground
    ]);
    // This can be done much better
    React__namespace.default.useEffect(()=>{
        if (openProp) {
            setIsOpen(true);
            setHasBeenOpened(true);
        } else {
            closeDrawer();
        }
    }, [
        openProp
    ]);
    // This can be done much better
    React__namespace.default.useEffect(()=>{
        if (mounted) {
            onOpenChange == null ? void 0 : onOpenChange(isOpen);
        }
    }, [
        isOpen
    ]);
    React__namespace.default.useEffect(()=>{
        setMounted(true);
    }, []);
    function resetDrawer() {
        if (!drawerRef.current) return;
        const wrapper = document.querySelector('[vaul-drawer-wrapper]');
        const currentSwipeAmount = getTranslateY(drawerRef.current);
        set(drawerRef.current, {
            transform: 'translate3d(0, 0, 0)',
            transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`
        });
        set(overlayRef.current, {
            transition: `opacity ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
            opacity: '1'
        });
        // Don't reset background if swiped upwards
        if (shouldScaleBackground && currentSwipeAmount && currentSwipeAmount > 0 && isOpen) {
            set(wrapper, {
                borderRadius: `${BORDER_RADIUS}px`,
                overflow: 'hidden',
                transform: `scale(${getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`,
                transformOrigin: 'top',
                transitionProperty: 'transform, border-radius',
                transitionDuration: `${TRANSITIONS.DURATION}s`,
                transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EASE.join(',')})`
            }, true);
        }
    }
    function onRelease(event) {
        if (!isDragging || !drawerRef.current) return;
        if (isAllowedToDrag.current && isInput(event.target)) {
            // If we were just dragging, prevent focusing on inputs etc. on release
            event.target.blur();
        }
        drawerRef.current.classList.remove(DRAG_CLASS);
        isAllowedToDrag.current = false;
        setIsDragging(false);
        dragEndTime.current = new Date();
        const swipeAmount = getTranslateY(drawerRef.current);
        if (!shouldDrag(event.target, false) || !swipeAmount || Number.isNaN(swipeAmount)) return;
        if (dragStartTime.current === null) return;
        const timeTaken = dragEndTime.current.getTime() - dragStartTime.current.getTime();
        const distMoved = pointerStartY.current - event.screenY;
        const velocity = Math.abs(distMoved) / timeTaken;
        if (velocity > 0.05) {
            // `justReleased` is needed to prevent the drawer from focusing on an input when the drag ends, as it's not the intent most of the time.
            setJustReleased(true);
            setTimeout(()=>{
                setJustReleased(false);
            }, 200);
        }
        if (snapPoints) {
            onReleaseSnapPoints({
                draggedDistance: distMoved,
                closeDrawer,
                velocity,
                dismissible
            });
            onReleaseProp == null ? void 0 : onReleaseProp(event, true);
            return;
        }
        // Moved upwards, don't do anything
        if (distMoved > 0) {
            resetDrawer();
            onReleaseProp == null ? void 0 : onReleaseProp(event, true);
            return;
        }
        if (velocity > VELOCITY_THRESHOLD) {
            closeDrawer();
            onReleaseProp == null ? void 0 : onReleaseProp(event, false);
            return;
        }
        var _drawerRef_current_getBoundingClientRect_height;
        const visibleDrawerHeight = Math.min((_drawerRef_current_getBoundingClientRect_height = drawerRef.current.getBoundingClientRect().height) != null ? _drawerRef_current_getBoundingClientRect_height : 0, window.innerHeight);
        if (swipeAmount >= visibleDrawerHeight * closeThreshold) {
            closeDrawer();
            onReleaseProp == null ? void 0 : onReleaseProp(event, false);
            return;
        }
        onReleaseProp == null ? void 0 : onReleaseProp(event, true);
        resetDrawer();
    }
    React__namespace.default.useEffect(()=>{
        // Trigger enter animation without using CSS animation
        if (isOpen) {
            openTime.current = new Date();
            scaleBackground(true);
        }
    }, [
        isOpen
    ]);
    React__namespace.default.useEffect(()=>{
        if (visible) {
            // Find all scrollable elements inside our drawer and assign a class to it so that we can disable overflow when dragging to prevent pointermove not being captured
            const children = drawerRef.current.querySelectorAll('*');
            children.forEach((child)=>{
                const htmlChild = child;
                if (htmlChild.scrollHeight > htmlChild.clientHeight || htmlChild.scrollWidth > htmlChild.clientWidth) {
                    htmlChild.classList.add('vaul-scrollable');
                }
            });
        }
    }, [
        visible
    ]);
    function scaleBackground(open) {
        const wrapper = document.querySelector('[vaul-drawer-wrapper]');
        if (!wrapper || !shouldScaleBackground) return;
        if (open) {
            set(document.body, {
                background: 'black'
            }, true);
            set(wrapper, {
                borderRadius: `${BORDER_RADIUS}px`,
                overflow: 'hidden',
                transform: `scale(${getScale()}) translate3d(0, calc(env(safe-area-inset-top) + 14px), 0)`,
                transformOrigin: 'top',
                transitionProperty: 'transform, border-radius',
                transitionDuration: `${TRANSITIONS.DURATION}s`,
                transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EASE.join(',')})`
            });
        } else {
            // Exit
            reset(wrapper, 'overflow');
            reset(wrapper, 'transform');
            reset(wrapper, 'borderRadius');
            set(wrapper, {
                transitionProperty: 'transform, border-radius',
                transitionDuration: `${TRANSITIONS.DURATION}s`,
                transitionTimingFunction: `cubic-bezier(${TRANSITIONS.EASE.join(',')})`
            });
        }
    }
    function onNestedOpenChange(o) {
        const scale = o ? (window.innerWidth - NESTED_DISPLACEMENT) / window.innerWidth : 1;
        const y = o ? -NESTED_DISPLACEMENT : 0;
        if (nestedOpenChangeTimer.current) {
            window.clearTimeout(nestedOpenChangeTimer.current);
        }
        set(drawerRef.current, {
            transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
            transform: `scale(${scale}) translate3d(0, ${y}px, 0)`
        });
        if (!o && drawerRef.current) {
            nestedOpenChangeTimer.current = setTimeout(()=>{
                set(drawerRef.current, {
                    transition: 'none',
                    transform: `translate3d(0, ${getTranslateY(drawerRef.current)}px, 0)`
                });
            }, 500);
        }
    }
    function onNestedDrag(event, percentageDragged) {
        if (percentageDragged < 0) return;
        const initialScale = (window.innerWidth - NESTED_DISPLACEMENT) / window.innerWidth;
        const newScale = initialScale + percentageDragged * (1 - initialScale);
        const newY = -NESTED_DISPLACEMENT + percentageDragged * NESTED_DISPLACEMENT;
        set(drawerRef.current, {
            transform: `scale(${newScale}) translate3d(0, ${newY}px, 0)`,
            transition: 'none'
        });
    }
    function onNestedRelease(event, o) {
        const scale = o ? (window.innerWidth - NESTED_DISPLACEMENT) / window.innerWidth : 1;
        const y = o ? -NESTED_DISPLACEMENT : 0;
        if (o) {
            set(drawerRef.current, {
                transition: `transform ${TRANSITIONS.DURATION}s cubic-bezier(${TRANSITIONS.EASE.join(',')})`,
                transform: `scale(${scale}) translate3d(0, ${y}px, 0)`
            });
        }
    }
    return /*#__PURE__*/ React__namespace.default.createElement(DialogPrimitive__namespace.Root, {
        modal: modal,
        onOpenChange: (o)=>{
            if (openProp !== undefined) {
                onOpenChange == null ? void 0 : onOpenChange(o);
                return;
            }
            if (!o) {
                closeDrawer();
            } else {
                setHasBeenOpened(true);
                setIsOpen(o);
            }
        },
        open: isOpen
    }, /*#__PURE__*/ React__namespace.default.createElement(DrawerContext.Provider, {
        value: {
            visible,
            activeSnapPoint,
            snapPoints,
            setActiveSnapPoint,
            drawerRef,
            overlayRef,
            scaleBackground,
            onOpenChange,
            onPress,
            setVisible,
            onRelease,
            onDrag,
            dismissible,
            isOpen,
            shouldFade,
            closeDrawer,
            onNestedDrag,
            onNestedOpenChange,
            onNestedRelease,
            keyboardIsOpen,
            openProp,
            modal,
            snapPointsOffset
        }
    }, children));
}
const Overlay = /*#__PURE__*/ React__namespace.default.forwardRef(function({ children, ...rest }, ref) {
    const { overlayRef, snapPoints, onRelease, shouldFade, isOpen, visible } = useDrawerContext();
    const composedRef = useComposedRefs(ref, overlayRef);
    const hasSnapPoints = snapPoints && snapPoints.length > 0;
    return /*#__PURE__*/ React__namespace.default.createElement(DialogPrimitive__namespace.Overlay, {
        onMouseUp: onRelease,
        ref: composedRef,
        "vaul-drawer-visible": visible ? 'true' : 'false',
        "vaul-overlay": "",
        "vaul-snap-points": isOpen && hasSnapPoints ? 'true' : 'false',
        "vaul-snap-points-overlay": isOpen && shouldFade ? 'true' : 'false',
        ...rest
    });
});
Overlay.displayName = 'Drawer.Overlay';
const Content = /*#__PURE__*/ React__namespace.default.forwardRef(function({ onOpenAutoFocus, onPointerDownOutside, onAnimationEnd, style, ...rest }, ref) {
    const { drawerRef, onPress, onRelease, onDrag, dismissible, keyboardIsOpen, snapPointsOffset, visible, closeDrawer, modal, openProp, onOpenChange, setVisible } = useDrawerContext();
    const composedRef = useComposedRefs(ref, drawerRef);
    React__namespace.default.useEffect(()=>{
        // Trigger enter animation without using CSS animation
        setVisible(true);
    }, []);
    return /*#__PURE__*/ React__namespace.default.createElement(DialogPrimitive__namespace.Content, {
        onOpenAutoFocus: (e)=>{
            if (onOpenAutoFocus) {
                onOpenAutoFocus(e);
            } else {
                e.preventDefault();
                drawerRef.current.focus();
            }
        },
        onPointerDown: onPress,
        onPointerDownOutside: (e)=>{
            onPointerDownOutside == null ? void 0 : onPointerDownOutside(e);
            if (!modal) {
                e.preventDefault();
                return;
            }
            if (keyboardIsOpen.current) {
                keyboardIsOpen.current = false;
            }
            e.preventDefault();
            onOpenChange == null ? void 0 : onOpenChange(false);
            if (!dismissible || openProp !== undefined) {
                return;
            }
            closeDrawer();
        },
        onPointerMove: onDrag,
        onPointerUp: onRelease,
        ref: composedRef,
        style: snapPointsOffset && snapPointsOffset.length > 0 ? {
            '--snap-point-height': `${snapPointsOffset[0]}px`,
            ...style
        } : style,
        ...rest,
        "vaul-drawer": "",
        "vaul-drawer-visible": visible ? 'true' : 'false'
    });
});
Content.displayName = 'Drawer.Content';
function NestedRoot({ onDrag, onOpenChange, ...rest }) {
    const { onNestedDrag, onNestedOpenChange, onNestedRelease } = useDrawerContext();
    if (!onNestedDrag) {
        throw new Error('Drawer.NestedRoot must be placed in another drawer');
    }
    return /*#__PURE__*/ React__namespace.default.createElement(Root, {
        nested: true,
        onClose: ()=>{
            onNestedOpenChange(false);
        },
        onDrag: (e, p)=>{
            onNestedDrag(e, p);
            onDrag == null ? void 0 : onDrag(e, p);
        },
        onOpenChange: (o)=>{
            if (o) {
                onNestedOpenChange(o);
            }
            onOpenChange == null ? void 0 : onOpenChange(o);
        },
        onRelease: onNestedRelease,
        ...rest
    });
}
const Drawer = {
    Root,
    NestedRoot,
    Content,
    Overlay,
    Trigger: DialogPrimitive__namespace.Trigger,
    Portal: DialogPrimitive__namespace.Portal,
    Close: DialogPrimitive__namespace.Close,
    Title: DialogPrimitive__namespace.Title,
    Description: DialogPrimitive__namespace.Description
};

exports.Drawer = Drawer;
