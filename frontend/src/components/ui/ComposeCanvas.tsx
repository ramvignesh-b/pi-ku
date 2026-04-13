import * as fabric from "fabric";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const PAD = 36;

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
  version: string;
  objects: (FabricObjectJSON | FabricImageJSON)[];
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

/**
 * Wait for the container to have a valid width before initializing the canvas.
 */
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

/**
 * Creates the primary text box for the letter.
 */
const createMainTextbox = (width: number): fabric.Textbox => {
  return new fabric.Textbox("Take a deep breath...", {
    name: "main-textbox",
    originX: "left",
    originY: "top",
    left: PAD,
    top: PAD,
    width: width - PAD * 2,
    fontSize: 16,
    fontWeight: 500,
    fontFamily: "Playfair Display Variable",
    fill: "#000",
    lineHeight: 1.5,
    editable: true,
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

/**
 * Fabric.js creates hidden textareas for input. We add aria-labels for accessibility.
 */
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

/**
 * Handle canvas resizing based on textbox content.
 */
const handleResize = (
  fCanvas: fabric.Canvas,
  textbox: fabric.Textbox,
  wrapper: HTMLDivElement | null,
) => {
  if (!wrapper) return;
  const neededHeight = textbox.top + textbox.height + PAD;
  if (neededHeight > fCanvas.height) {
    const newH = neededHeight + PAD;
    fCanvas.setDimensions({ height: newH });
    wrapper.style.height = `${newH}px`;
  }
};

/**
 * Setup focus and editing for the textbox.
 */
const focusTextbox = (fCanvas: fabric.Canvas, textbox: fabric.Textbox) => {
  fCanvas.setActiveObject(textbox);
  textbox.enterEditing();
  fCanvas.renderAll();
  fixFabricA11y();
};

/**
 * Static canvas creation helper to avoid component dependency issues.
 */
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
  });
  const wrapperEl = canvas.getElement().parentElement;
  if (wrapperEl) wrapperEl.style.background = "transparent";
  return canvas;
};

export const ComposeCanvas = forwardRef<
  CanvasTools,
  { readOnly?: boolean; initialData?: CanvasJSON | null }
>(({ readOnly = false, initialData = null }, ref) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const textboxRef = useRef<fabric.Textbox | null>(null);

  const setupTextboxInteractions = useCallback(
    (fCanvas: fabric.Canvas, textbox: fabric.Textbox) => {
      textbox.on("changed", () =>
        handleResize(fCanvas, textbox, wrapperRef.current),
      );
      fCanvas.on("mouse:down", (opt) => {
        if (!opt.target || opt.target === textbox) {
          focusTextbox(fCanvas, textbox);
        }
      });

      if (!readOnly) {
        setTimeout(() => focusTextbox(fCanvas, textbox), 100);
      }
    },
    [readOnly],
  );

  const loadContent = useCallback(
    async (
      canvas: fabric.Canvas,
      data: CanvasJSON | null,
      width: number,
    ): Promise<fabric.Textbox | null> => {
      if (data) {
        await canvas.loadFromJSON(data);
        if (readOnly) {
          for (const obj of canvas.getObjects()) {
            obj.selectable = false;
            obj.evented = false;
          }
        }
        return null;
      }
      const textbox = createMainTextbox(width);
      canvas.add(textbox);
      return textbox;
    },
    [readOnly],
  );

  useEffect(() => {
    let isMounted = true;
    let canvas: fabric.Canvas | null = null;

    const init = async () => {
      await document.fonts.ready;
      if (!(wrapperRef.current && canvasRef.current && isMounted)) return;

      const finalWidth = await waitForLayout(wrapperRef.current);
      if (!(isMounted && canvasRef.current)) return;

      const initialHeight = Math.max(
        wrapperRef.current.clientHeight || 900,
        600,
      );
      canvas = initializeCanvas(
        canvasRef.current,
        finalWidth,
        initialHeight,
        readOnly,
      );
      fabricRef.current = canvas;

      const textbox = await loadContent(canvas, initialData, finalWidth);
      if (textbox) {
        textboxRef.current = textbox;
        setupTextboxInteractions(canvas, textbox);
      }
      canvas.renderAll();
    };

    init();

    return () => {
      isMounted = false;
      canvas?.dispose();
      fabricRef.current = null;
      textboxRef.current = null;
    };
  }, [initialData, readOnly, setupTextboxInteractions, loadContent]);

  useImperativeHandle(ref, () => ({
    addImage: (url: string, file: File) => {
      if (!fabricRef.current) return;
      fabric.FabricImage.fromURL(url).then((img) => {
        img.scaleToWidth(300);
        img.set({
          _customRawFile: file,
          left: PAD,
          top: PAD,
        } as Partial<FabricImageWithFile>);
        fabricRef.current?.add(img);
        fabricRef.current?.setActiveObject(img);
        fabricRef.current?.requestRenderAll();
        URL.revokeObjectURL(url);
      });
    },
    getData: () => {
      if (!fabricRef.current) return { version: "", objects: [] };
      return fabricRef.current.toJSON() as CanvasJSON;
    },
    getJsonData: () => {
      if (!fabricRef.current) return "";
      return JSON.stringify(fabricRef.current.toJSON());
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
      if (!fabricRef.current) return;
      await fabricRef.current.loadFromJSON(data);
      const textboxes = fabricRef.current.getObjects("Textbox");
      if (textboxes.length > 0) {
        const textbox = textboxes[0] as fabric.Textbox;
        textboxRef.current = textbox;
        setupTextboxInteractions(fabricRef.current, textbox);
      }
      fabricRef.current.renderAll();
    },
  }));

  return (
    <div
      ref={wrapperRef}
      className="relative bg-paper shadow-primary-content rounded-sm w-full outline-none overflow-hidden cursor-text"
      style={{ minHeight: "900px" }}
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
