import * as fabric from "fabric";
import type * as React from "react";
import { useCallback, useEffect, useImperativeHandle, useRef } from "react";

import "@fontsource/kavivanar/index.css";
import "@fontsource/b612-mono/index.css";
import "@fontsource-variable/josefin-slab/wght.css";
import "@fontsource/architects-daughter/index.css";
import "@fontsource/redacted-script/index.css";

const PAD = 36;
const BASE_WIDTH = 680;
const DEFAULT_LOGICAL_HEIGHT = 900;
const DEFAULT_FONT_FAMILY = "Fraunces Variable";
const DEFAULT_FONT_COLOR = "#000";

export interface FabricObjectJSON {
  type: string;
  name?: string;
  top: number;
  left: number;
  width: number;
  height: number;

  [key: string]: unknown;
}

export interface FabricImageJSON extends FabricObjectJSON {
  type: "Image";
  src: string;
  _customRawFile?: File;
}

export interface CanvasJSON {
  objects: (FabricObjectJSON | FabricImageJSON)[];
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface CanvasStyle {
  fontFamily: string;
  fontColor: string;
}

export type CanvasTools = {
  addImage: (url: string, file: File) => void;
  getData: () => CanvasJSON;
  getImages: () => { src: string; file: File }[];
  loadData: (data: CanvasJSON) => Promise<void>;
  getStyle: () => CanvasStyle;
};

export interface FabricImageWithFile extends fabric.FabricImage {
  _customRawFile: File;
}

// NOTE: We use the same canvasData to render on both mobile and desktop viewports.
// Instead of calculating the entire objects pad again, we apply a zoom multiplier (scale down or up)
// over the last saved canvas size.
const applyResponsiveViewport = (
  canvas: fabric.Canvas,
  wrapper: HTMLDivElement,
  logicalWidth: number,
  logicalHeight: number,
) => {
  const physicalWidth = wrapper.clientWidth || logicalWidth;
  const zoomMultiplier = physicalWidth / logicalWidth;
  const physicalHeight = Math.max(1, logicalHeight * zoomMultiplier);

  canvas.setDimensions({
    width: physicalWidth,
    height: physicalHeight,
  });

  wrapper.style.height = `${physicalHeight}px`;
  canvas.setViewportTransform([zoomMultiplier, 0, 0, zoomMultiplier, 0, 0]);
  canvas.requestRenderAll();
};

// to find the maximum height of the content to dynamically resize the canvas
// would've been wayyy easier only if canvas supported fit-content like CSS property :)
const measureLogicalContentHeight = (
  canvas: fabric.Canvas,
  minimumHeight = DEFAULT_LOGICAL_HEIGHT,
) => {
  const maxBottom = canvas.getObjects().reduce((maxHeight, currObj) => {
    const top = currObj.top;
    const height = currObj.getScaledHeight();
    return Math.max(maxHeight, top + height);
  }, 0);

  return Math.max(minimumHeight, maxBottom + PAD);
};

const DEFAULT_INIT_TEXT = "Take a deep breath...";

const applyImageControls = (canvas: fabric.Canvas, readOnly: boolean) => {
  for (const img of canvas.getObjects("Image")) {
    img.set({ hasControls: !readOnly, hasBorders: !readOnly });
  }
};

interface AttachTextboxOptions {
  readOnly: boolean;
  onChanged: () => void;
  onFocusRequest: (textbox: fabric.Textbox) => void;
}

const attachTextbox = (
  canvas: fabric.Canvas,
  textbox: fabric.Textbox,
  { readOnly, onChanged, onFocusRequest }: AttachTextboxOptions,
) => {
  // readonly contraints applicable for post seal view
  textbox.selectable = !readOnly;
  textbox.evented = !readOnly;
  textbox.editable = !readOnly;
  textbox.hasBorders = false;

  // observe and auto-resize the canvas height whenever typed
  textbox.on("changed", onChanged);

  // trapping the focus into the textbox wherever clicked on canvas (except images)
  canvas.on("mouse:down", (e) => {
    if (!e.target || e.target === textbox) onFocusRequest(textbox);
  });
};

interface ComposeCanvasProps {
  readOnly?: boolean;
  initialData?: CanvasJSON | null;
  style?: CanvasStyle;
  // fires once the content is laid out and the wrapper has its final height
  onReady?: () => void;
  ref?: React.Ref<CanvasTools>;
}

// Locks character rendering to measured bounds to prevent cursor drift
const withAlignedRendering = (textbox: fabric.Textbox): fabric.Textbox => {
  (textbox as unknown as { CACHE_FONT_SIZE: number }).CACHE_FONT_SIZE = 18;

  (textbox as unknown as { _renderChars: unknown })._renderChars = function (
    // biome-ignore lint/suspicious/noExplicitAny: Fabric internal private methods
    this: any,
    method: "fillText" | "strokeText",
    ctx: CanvasRenderingContext2D,
    line: string[],
    left: number,
    top: number,
    lineIndex: number,
  ) {
    const isLtr = this.direction === "ltr";
    const sign = isLtr ? 1 : -1;
    let charLeft = left;
    const adjustedTop =
      top - this.getHeightOfLineImpl(lineIndex) * this._fontSizeFraction;

    for (let i = 0; i < line.length; i++) {
      const charBox = this.__charBounds?.[lineIndex]?.[i];
      if (!charBox) continue;
      this._renderChar(
        method,
        ctx,
        lineIndex,
        i,
        line[i],
        charLeft,
        adjustedTop,
      );
      charLeft += sign * charBox.kernedWidth;
    }
  };

  return textbox;
};

const createCompositionTextbox = (text = DEFAULT_INIT_TEXT): fabric.Textbox => {
  return withAlignedRendering(
    new fabric.Textbox(text, {
      name: "main-textbox",
      originX: "left",
      originY: "top",
      left: PAD,
      top: PAD,
      width: BASE_WIDTH - PAD * 2,
      fontSize: 18,
      fontWeight: 500,
      fontFamily: DEFAULT_FONT_FAMILY,
      fill: DEFAULT_FONT_COLOR,
      lineHeight: 1.5,
      splitByGrapheme: false,
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hasControls: false,
      hasBorders: false,
      objectCaching: false,
      noScaleCache: false,
    }),
  );
};

const resolveTextbox = async (
  canvas: fabric.Canvas,
  data: CanvasJSON | null,
  readOnly: boolean,
): Promise<fabric.Textbox | null> => {
  if (data?.objects?.length) {
    await canvas.loadFromJSON(data);
    const existing = canvas.getObjects("Textbox")[0] as fabric.Textbox;
    return existing ? withAlignedRendering(existing) : null;
  }
  // a read-only canvas with no data stays empty. the prompt belongs to the
  // quill, and rendering it here would flash a placeholder letter.
  if (readOnly) return null;
  const textbox = createCompositionTextbox(DEFAULT_INIT_TEXT);
  canvas.add(textbox);
  return textbox;
};

const prepareFont = async (fontFamily: string, fontSize = 18) => {
  try {
    await document.fonts.load(`${fontSize}px "${fontFamily}"`);
  } catch {
    // Ignore font loading failure
  }
  fabric.cache.clearFontCache(fontFamily);
};

export function ComposeCanvas({
  readOnly = false,
  initialData = null,
  style,
  onReady,
  ref,
}: ComposeCanvasProps) {
  // wrapper is the parent div box
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const textboxRef = useRef<fabric.Textbox | null>(null);
  const deferredDataRef = useRef<CanvasJSON | null>(null);
  const logicalSizeRef = useRef({
    width: BASE_WIDTH,
    height: DEFAULT_LOGICAL_HEIGHT,
  });

  // held in a ref so a new callback identity can't re-run the canvas init
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // re-calculates height based on content and applies the zoom transform
  const syncViewport = useCallback(() => {
    if (!(fabricRef.current && wrapperRef.current)) return;
    textboxRef.current?.initDimensions();

    const minHeight = initialData?.canvasHeight ?? DEFAULT_LOGICAL_HEIGHT;
    logicalSizeRef.current.height = measureLogicalContentHeight(
      fabricRef.current,
      minHeight,
    );

    applyResponsiveViewport(
      fabricRef.current,
      wrapperRef.current,
      logicalSizeRef.current.width,
      logicalSizeRef.current.height,
    );

    fabricRef.current.requestRenderAll();
  }, [initialData]);

  // auto focus the cursor into the main textbox no matter the latest element added
  const focusTextbox = useCallback(
    (textbox: fabric.Textbox) => {
      if (readOnly || !fabricRef.current) return;

      fabricRef.current.setActiveObject(textbox);
      textbox.enterEditing();

      // move the cursor to the end of the text
      const textLength = textbox.text?.length ?? 0;
      textbox.selectionStart = textLength;
      textbox.selectionEnd = textLength;

      fabricRef.current.requestRenderAll();
    },
    [readOnly],
  );

  const loadContent = useCallback(
    async (data: CanvasJSON | null) => {
      const canvas = fabricRef.current;
      const wrapper = wrapperRef.current;
      if (!(canvas && wrapper)) return;

      // clean the canvas everytime and set fresh
      canvas.clear();
      canvas.off("mouse:down");

      // restore logical size from prev saved data if available (in case of existing letter)
      logicalSizeRef.current = {
        width: data?.canvasWidth ?? BASE_WIDTH,
        height: data?.canvasHeight ?? DEFAULT_LOGICAL_HEIGHT,
      };

      const textbox = await resolveTextbox(canvas, data, readOnly);

      if (textbox) {
        textboxRef.current = textbox;
        attachTextbox(canvas, textbox, {
          readOnly,
          onChanged: syncViewport,
          onFocusRequest: focusTextbox,
        });
      }

      applyImageControls(canvas, readOnly);

      // NOTE: fabric refreshes fonts once the textbox is rendered after initial focus
      await document.fonts.ready;
      fabric.cache.clearFontCache();
      textbox?.initDimensions();
      textbox?.set("dirty", true);
      syncViewport();

      // the wrapper has its final height now, so the letter can be shown without reflowing
      onReadyRef.current?.();

      // Hack: Fabric needs a small initial delay to mount before it will accept focus.
      // otherwise it goes to the front
      if (textbox && !readOnly) {
        setTimeout(() => focusTextbox(textbox), 200);
      }
    },
    [readOnly, syncViewport, focusTextbox],
  );

  useEffect(() => {
    if (style && textboxRef.current) {
      const textBox = textboxRef.current;
      const nextFont = style.fontFamily || textBox.fontFamily;
      const nextColor = style.fontColor || (textBox.fill as string);

      prepareFont(nextFont).then(() => {
        textBox.fontFamily = nextFont;
        textBox.fill = nextColor;
        textBox.initDimensions();
        textBox.set("dirty", true);
        syncViewport();
        fabricRef.current?.requestRenderAll();
      });
    }
  }, [style, syncViewport]);

  useEffect(() => {
    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let lastWidth = 0;

    const getInitialWidth = async () => {
      if (!wrapperRef.current) return BASE_WIDTH;
      let width = wrapperRef.current.clientWidth;
      if (width === 0) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        width = wrapperRef.current?.clientWidth || BASE_WIDTH;
      }
      return width;
    };

    const initResizeOberver = () => {
      if (!wrapperRef.current) return null;
      const observer = new ResizeObserver(() => {
        const nextWidth = wrapperRef.current?.clientWidth;
        if (!nextWidth || nextWidth === lastWidth) return;
        lastWidth = nextWidth;
        syncViewport();
      });
      observer.observe(wrapperRef.current);
      return observer;
    };

    const initCanvas = async () => {
      // HACK: actual font may change the text-width - small ux improvement
      await document.fonts.ready;

      if (!(wrapperRef.current && canvasRef.current && isMounted)) return;

      const width = await getInitialWidth();

      // init the fabric instance
      const canvas = new fabric.Canvas(canvasRef.current, {
        width,
        height: DEFAULT_LOGICAL_HEIGHT,
        selection: !readOnly,
        preserveObjectStacking: true,
        allowTouchScrolling: true,
        enableRetinaScaling: true,
        objectCaching: false,
      });

      // remove default fabric background to let our CSS show through
      // TODO: provision custom bg (color in scope, but how does img fit?)
      const wrapperEl = canvas.getElement().parentElement;
      if (wrapperEl) wrapperEl.style.background = "transparent";

      fabricRef.current = canvas;

      await loadContent(initialData);

      // sometimes loadData() may be called before the canvas finished the init render
      // so we retry that stashed render right after the init
      if (deferredDataRef.current) {
        await loadContent(deferredDataRef.current);
        deferredDataRef.current = null;
      }

      if (!(isMounted && wrapperRef.current)) return;

      // auto window resizing based width
      lastWidth = wrapperRef.current.clientWidth;
      resizeObserver = initResizeOberver();
    };

    initCanvas().then();

    return () => {
      isMounted = false;
      resizeObserver?.disconnect();
      fabricRef.current?.dispose();
      fabricRef.current = null;
      textboxRef.current = null;
    };
  }, [initialData, loadContent, readOnly, syncViewport]);

  // WHY?: fabric doesn't work like react with state and props based optimized re-renders.
  // everytime we there's a change in the data, we should force the render,
  // so we let the parent Editor component take control of this.
  useImperativeHandle(ref, () => ({
    addImage: (url: string, file: File) => {
      if (!fabricRef.current) return;

      fabric.FabricImage.fromURL(url).then((img) => {
        img.scaleToWidth(Math.min(300, img.width));
        img.set({
          originX: "left",
          originY: "top",
          left: PAD,
          top: PAD,
          noScaleCache: false,
          objectCaching: false,
          // WHY?: after image object clean-up, its src becomes local blob://
          // but browser won't let us parse this blob:// into file afterwards. so we hold a local copy
          _customRawFile: file,
        } as Partial<FabricImageWithFile>);

        fabricRef.current?.add(img);
        fabricRef.current?.setActiveObject(img);

        syncViewport();
        // clean up memory
        URL.revokeObjectURL(url);
      });
    },

    getData: () => {
      if (!fabricRef.current) return { objects: [] };
      syncViewport();

      const json = fabricRef.current.toJSON() as CanvasJSON;
      json.canvasWidth = logicalSizeRef.current.width;
      json.canvasHeight = logicalSizeRef.current.height;
      return json;
    },

    getImages: () => {
      if (!fabricRef.current) return [];
      const images = fabricRef.current.getObjects(
        "Image",
      ) as FabricImageWithFile[];
      return images.map((img) => ({
        src: img.getSrc(),
        file: img._customRawFile,
      }));
    },

    loadData: async (data: CanvasJSON) => {
      // if canvas isn't ready yet, stash the data and let the useEffect pick it up
      if (!fabricRef.current) {
        deferredDataRef.current = data;
        return;
      }
      await loadContent(data);
    },

    getStyle: () => {
      const textBox = textboxRef.current;

      return {
        fontFamily: textBox?.fontFamily || DEFAULT_FONT_FAMILY,
        fontColor: (textBox?.fill as string) || DEFAULT_FONT_COLOR,
      };
    },
  }));

  return (
    <div
      ref={wrapperRef}
      className="relative bg-paper shadow-primary-content rounded-sm w-full outline-none overflow-hidden cursor-text"
      // reserve the height the content will need, so the box never grows under the reader.
      // fabric overwrites this with an explicit height once it has measured.
      style={
        initialData?.canvasWidth && initialData?.canvasHeight
          ? {
              aspectRatio: `${initialData.canvasWidth} / ${initialData.canvasHeight}`,
            }
          : undefined
      }
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{ background: "transparent" }}
      />
    </div>
  );
}

ComposeCanvas.displayName = "ComposeCanvas";
