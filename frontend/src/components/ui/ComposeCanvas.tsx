import * as fabric from "fabric";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const PAD = 36;
const BASE_WIDTH = 680;
const DEFAULT_LOGICAL_HEIGHT = 900;

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

export type CanvasTools = {
  addImage: (url: string, file: File) => void;
  getData: () => CanvasJSON;
  getJsonData: () => string;
  getImages: () => { src: string; file: File }[];
  loadData: (data: CanvasJSON) => Promise<void>;
};

export interface FabricImageWithFile extends fabric.FabricImage {
  _customRawFile: File;
}

const waitForLayout = (wrapper: HTMLDivElement): Promise<number> => {
  return new Promise((resolve) => {
    const check = () => {
      const width = wrapper.clientWidth || 0;
      if (width > 0) resolve(width);
      else requestAnimationFrame(check);
    };
    check();
  });
};

const createMainTextbox = (
  text: string,
  isReadOnly = false,
): fabric.Textbox => {
  return new fabric.Textbox(text, {
    name: "main-textbox",
    originX: "left",
    originY: "top",
    left: PAD,
    top: PAD,
    width: BASE_WIDTH - PAD * 2,
    fontSize: 18,
    fontWeight: 500,
    fontFamily: "Playfair Display Variable",
    fill: "#000",
    lineHeight: 1.5,
    editable: !isReadOnly,
    selectable: false,
    evented: !isReadOnly,
    hasControls: false,
    hasBorders: false,
    objectCaching: false,
    splitByGrapheme: false,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
  });
};

const fixFabricA11y = () => {
  const textAreas = document.querySelectorAll(
    'textarea[data-fabric="textarea"]',
  );
  for (const area of textAreas) {
    if (!area.getAttribute("aria-label")) {
      area.setAttribute("aria-label", "Canvas text input");
    }
  }
};

const initializeCanvas = (
  el: HTMLCanvasElement,
  width: number,
  height: number,
  readOnly: boolean,
) => {
  const canvas = new fabric.Canvas(el, {
    width,
    height,
    selection: !readOnly,
    preserveObjectStacking: true,
    allowTouchScrolling: true,
    enableRetinaScaling: true,
    objectCaching: false,
  });

  const wrapperEl = canvas.getElement().parentElement;
  if (wrapperEl) wrapperEl.style.background = "transparent";

  return canvas;
};

const getLogicalSize = (data: CanvasJSON | null) => {
  return {
    width: data?.canvasWidth ?? BASE_WIDTH,
    height: data?.canvasHeight ?? DEFAULT_LOGICAL_HEIGHT,
  };
};

const getObjectBottom = (obj: fabric.FabricObject) => {
  const top = obj.top ?? 0;
  const height =
    typeof obj.getScaledHeight === "function"
      ? obj.getScaledHeight()
      : (obj.height ?? 0) * (obj.scaleY ?? 1);

  return top + height;
};

const measureLogicalContentHeight = (
  canvas: fabric.Canvas,
  minimumHeight = DEFAULT_LOGICAL_HEIGHT,
) => {
  const maxBottom = canvas
    .getObjects()
    .reduce((max, obj) => Math.max(max, getObjectBottom(obj)), 0);

  return Math.max(minimumHeight, maxBottom + PAD);
};

const applyResponsiveViewport = (
  canvas: fabric.Canvas,
  wrapper: HTMLDivElement,
  logicalWidth: number,
  logicalHeight: number,
) => {
  const physicalWidth = wrapper.clientWidth || logicalWidth;
  const zoom = physicalWidth / logicalWidth;
  const physicalHeight = Math.max(1, logicalHeight * zoom);

  canvas.setDimensions({
    width: physicalWidth,
    height: physicalHeight,
  });

  wrapper.style.height = `${physicalHeight}px`;
  canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
  canvas.requestRenderAll();
};

const focusTextbox = (
  fCanvas: fabric.Canvas,
  textbox: fabric.Textbox,
  readOnly: boolean,
) => {
  if (readOnly) return;

  fCanvas.setActiveObject(textbox);
  textbox.enterEditing();

  const end = textbox.text?.length ?? 0;
  textbox.selectionStart = end;
  textbox.selectionEnd = end;

  fCanvas.requestRenderAll();
  fixFabricA11y();
};

const findMainTextbox = (canvas: fabric.Canvas): fabric.Textbox | null => {
  const textbox = canvas.getObjects("Textbox")[0];

  return (textbox as fabric.Textbox) ?? null;
};

export const ComposeCanvas = forwardRef<
  CanvasTools,
  { readOnly?: boolean; initialData?: CanvasJSON | null }
>(({ readOnly = false, initialData = null }, ref) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const textboxRef = useRef<fabric.Textbox | null>(null);
  const deferredDataRef = useRef<CanvasJSON | null>(null);
  const logicalSizeRef = useRef({
    width: BASE_WIDTH,
    height: DEFAULT_LOGICAL_HEIGHT,
  });

  const syncViewport = useCallback(() => {
    if (!(fabricRef.current && wrapperRef.current)) return;

    applyResponsiveViewport(
      fabricRef.current,
      wrapperRef.current,
      logicalSizeRef.current.width,
      logicalSizeRef.current.height,
    );
  }, []);

  const updateLogicalHeightFromContent = useCallback(() => {
    if (!fabricRef.current) return;

    logicalSizeRef.current.height = measureLogicalContentHeight(
      fabricRef.current,
      logicalSizeRef.current.height,
    );

    syncViewport();
  }, [syncViewport]);

  const setupTextboxInteractions = useCallback(
    (fCanvas: fabric.Canvas, textbox: fabric.Textbox) => {
      textbox.on("changed", () => {
        updateLogicalHeightFromContent();
      });

      fCanvas.on("mouse:down", (opt) => {
        if (!opt.target || opt.target === textbox) {
          focusTextbox(fCanvas, textbox, readOnly);
        }
      });

      if (!readOnly) {
        setTimeout(() => {
          focusTextbox(fCanvas, textbox, readOnly);
        }, 200);
      }
    },
    [readOnly, updateLogicalHeightFromContent],
  );

  const loadContent = useCallback(
    async (
      canvas: fabric.Canvas,
      data: CanvasJSON | null,
      wrapper: HTMLDivElement,
    ): Promise<fabric.Textbox | null> => {
      const logicalSize = getLogicalSize(data);
      logicalSizeRef.current = logicalSize;

      canvas.clear();

      let textbox: fabric.Textbox | null = null;

      if (data?.objects?.length) {
        await canvas.loadFromJSON(data);
        textbox = findMainTextbox(canvas);
      } else {
        textbox = createMainTextbox("Take a deep breath...", readOnly);
        canvas.add(textbox);
      }

      if (!textbox) return null;

      textbox.selectable = !readOnly;
      textbox.evented = !readOnly;
      textbox.editable = !readOnly;
      textbox.hasBorders = false;
      textbox.lockMovementX = true;
      textbox.lockMovementY = true;
      textbox.lockScalingX = true;
      textbox.lockScalingY = true;
      textbox.lockRotation = true;
      textbox.objectCaching = false;

      logicalSizeRef.current.height = measureLogicalContentHeight(
        canvas,
        logicalSize.height,
      );

      applyResponsiveViewport(
        canvas,
        wrapper,
        logicalSizeRef.current.width,
        logicalSizeRef.current.height,
      );

      if (!(readOnly || data)) {
        focusTextbox(canvas, textbox, readOnly);
      }

      return textbox;
    },
    [readOnly],
  );

  useEffect(() => {
    let isMounted = true;
    let canvas: fabric.Canvas | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let lastWidth = 0;

    const init = async () => {
      await document.fonts.ready;
      if (!(wrapperRef.current && canvasRef.current && isMounted)) return;

      const finalWidth = await waitForLayout(wrapperRef.current);
      if (!(isMounted && canvasRef.current && wrapperRef.current)) return;

      canvas = initializeCanvas(
        canvasRef.current,
        finalWidth,
        DEFAULT_LOGICAL_HEIGHT,
        readOnly,
      );

      fabricRef.current = canvas;

      const textbox = await loadContent(
        canvas,
        initialData,
        wrapperRef.current,
      );

      if (textbox) {
        textboxRef.current = textbox;
        setupTextboxInteractions(canvas, textbox);
      }

      canvas.requestRenderAll();
      fixFabricA11y();

      lastWidth = wrapperRef.current.clientWidth;

      resizeObserver = new ResizeObserver(() => {
        if (!(fabricRef.current && wrapperRef.current)) return;

        const nextWidth = wrapperRef.current.clientWidth;
        if (!nextWidth || nextWidth === lastWidth) return;

        lastWidth = nextWidth;
        syncViewport();
      });

      resizeObserver.observe(wrapperRef.current);

      if (deferredDataRef.current) {
        const data = deferredDataRef.current;
        deferredDataRef.current = null;

        const textbox = await loadContent(canvas, data, wrapperRef.current);
        if (textbox) {
          textboxRef.current = textbox;
          setupTextboxInteractions(canvas, textbox);
        }

        canvas.requestRenderAll();
        fixFabricA11y();
      }
    };

    init();

    return () => {
      isMounted = false;
      resizeObserver?.disconnect();
      canvas?.dispose();
      fabricRef.current = null;
      textboxRef.current = null;
    };
  }, [
    initialData,
    loadContent,
    readOnly,
    setupTextboxInteractions,
    syncViewport,
  ]);

  useImperativeHandle(ref, () => ({
    addImage: (url: string, file: File) => {
      if (!fabricRef.current) return;

      fabric.FabricImage.fromURL(url).then((img) => {
        img.scaleToWidth(Math.min(300, img.width));
        img.set({
          originX: "left",
          originY: "top",
          _customRawFile: file,
          left: PAD,
          top: PAD,
          objectCaching: false,
        } as Partial<FabricImageWithFile>);

        fabricRef.current?.add(img);
        fabricRef.current?.setActiveObject(img);

        if (!fabricRef.current) return;

        logicalSizeRef.current.height = measureLogicalContentHeight(
          fabricRef.current,
          logicalSizeRef.current.height,
        );

        if (wrapperRef.current) {
          applyResponsiveViewport(
            fabricRef.current,
            wrapperRef.current,
            logicalSizeRef.current.width,
            logicalSizeRef.current.height,
          );
        } else {
          fabricRef.current?.requestRenderAll();
        }

        URL.revokeObjectURL(url);
      });
    },

    getData: () => {
      if (!fabricRef.current) return { objects: [] };

      logicalSizeRef.current.height = measureLogicalContentHeight(
        fabricRef.current,
        logicalSizeRef.current.height,
      );

      const json = fabricRef.current.toJSON() as CanvasJSON;
      json.canvasWidth = logicalSizeRef.current.width;
      json.canvasHeight = logicalSizeRef.current.height;

      return json;
    },

    getJsonData: () => {
      if (!fabricRef.current) return "";

      const json = fabricRef.current.toJSON() as CanvasJSON;
      json.canvasWidth = logicalSizeRef.current.width;
      json.canvasHeight = logicalSizeRef.current.height;

      return JSON.stringify(json);
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
      if (!(fabricRef.current && wrapperRef.current)) {
        deferredDataRef.current = data;
        return;
      }

      const textbox = await loadContent(
        fabricRef.current,
        data,
        wrapperRef.current,
      );

      if (textbox) {
        textboxRef.current = textbox;
        setupTextboxInteractions(fabricRef.current, textbox);
      }

      fabricRef.current.requestRenderAll();
      fixFabricA11y();
    },
  }));

  return (
    <div
      ref={wrapperRef}
      className="relative bg-paper shadow-primary-content rounded-sm w-full outline-none overflow-hidden cursor-text"
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{ background: "transparent" }}
      />
    </div>
  );
});

ComposeCanvas.displayName = "ComposeCanvas";
