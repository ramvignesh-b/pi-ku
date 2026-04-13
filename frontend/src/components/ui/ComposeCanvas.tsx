import * as fabric from "fabric";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const PAD = 36;

type CanvasJSON = ReturnType<fabric.Canvas["toJSON"]>;

export type CanvasTools = {
  addImage: (url: string, file: File) => void;
  getData: () => { objects: CanvasJSON["objects"] }; // no-any hack :/
  getJsonData: () => string;
  getImages: () => { src: string; file: File }[];
  loadData: (data: any) => Promise<void>;
};

export interface FabricImageWithFile extends fabric.FabricImage {
  _customRawFile: File;
}

export const ComposeCanvas = forwardRef<
  CanvasTools,
  { readOnly?: boolean; initialData?: any }
>(({ readOnly = false, initialData = null }, ref) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const textboxRef = useRef<fabric.Textbox | null>(null);

  useEffect(() => {
    let isMounted = true;
    let canvas: fabric.Canvas | null = null;

    const init = async () => {
      await document.fonts.ready;
      const waitForLayout = (): Promise<number> => {
        return new Promise((resolve) => {
          const check = () => {
            const wrapperWidth = wrapperRef.current?.clientWidth || 0;
            if (wrapperWidth > 0) resolve(wrapperWidth);
            else requestAnimationFrame(check);
          };
          check();
        });
      };

      const finalWidth = await waitForLayout();
      if (!isMounted || !canvasRef.current || !wrapperRef.current) return;

      const initialHeight = Math.max(
        wrapperRef.current.clientHeight || 900,
        600,
      );

      canvas = new fabric.Canvas(canvasRef.current, {
        width: finalWidth,
        height: initialHeight,
        selection: !readOnly,
        preserveObjectStacking: true,
        allowTouchScrolling: true,
      });

      fabricRef.current = canvas;

      const wrapperEl = canvas.getElement().parentElement;
      if (wrapperEl) wrapperEl.style.background = "transparent";

      if (initialData) {
        await canvas.loadFromJSON(initialData);
        if (readOnly) {
          for (const obj of canvas.getObjects()) {
            obj.selectable = false;
            obj.evented = false;
          }
        }
        canvas.renderAll();
      } else {
        const textbox = new fabric.Textbox("Take a deep breath...", {
          name: "main-textbox",
          originX: "left",
          originY: "top",
          left: PAD,
          top: PAD,
          width: finalWidth - PAD * 2,
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
        });

        textboxRef.current = textbox;
        canvas.add(textbox);

        textbox.on("changed", () => {
          if (!canvas || !wrapperRef.current) return;
          const neededHeight = textbox.top + textbox.height + PAD;
          if (neededHeight > canvas.height) {
            const newH = neededHeight + PAD;
            canvas.setDimensions({ height: newH });
            wrapperRef.current.style.height = `${newH}px`;
          }
        });

        setTimeout(() => {
          if (!isMounted) return;
          canvas?.setActiveObject(textbox);
          textbox.enterEditing();
          canvas?.renderAll();

          const hiddenTextareas = document.querySelectorAll(
            'textarea[data-fabric="textarea"]',
          );
          for (const textArea of hiddenTextareas) {
            if (!textArea.getAttribute("aria-label")) {
              textArea.setAttribute("aria-label", "Canvas text input");
            }
          }
        }, 100);

        canvas.on("mouse:down", (opt) => {
          if (!opt.target || opt.target === textbox) {
            canvas?.setActiveObject(textbox);
            textbox.enterEditing();
            canvas?.renderAll();
          }
        });
      }
    };

    init();

    return () => {
      isMounted = false;
      canvas?.dispose();
      fabricRef.current = null;
      textboxRef.current = null;
    };
  }, [initialData, readOnly]);

  useImperativeHandle(ref, () => ({
    addImage: (url: string, file: File) => {
      if (!fabricRef.current) return;
      fabric.FabricImage.fromURL(url).then((img) => {
        img.scaleToWidth(300);
        img.set({
          _customRawFile: file,
          left: PAD,
          top: PAD,
        });
        fabricRef.current?.add(img);
        fabricRef.current?.setActiveObject(img);
        fabricRef.current?.requestRenderAll();
        URL.revokeObjectURL(url);
      });
    },
    getData: () => {
      if (!fabricRef.current) return { objects: [] };
      return fabricRef.current.toJSON();
    },
    getJsonData: () => {
      if (!fabricRef.current) return "";
      return JSON.stringify(fabricRef.current.toJSON()); // convert to json string
    },
    getImages: () => {
      if (!fabricRef.current) return [];
      const images = fabricRef.current.getObjects(
        "Image",
      ) as fabric.FabricImage[];
      return images.map((img) => ({
        src: img.getSrc(),
        file: (img as any)._customRawFile,
      }));
    },
    loadData: async (data: any) => {
      if (!fabricRef.current) return;
      await fabricRef.current.loadFromJSON(data);

      // find the textbox and restore focus
      const objects = fabricRef.current.getObjects("Textbox");
      if (objects.length > 0) {
        const textbox = objects[0] as fabric.Textbox;
        textbox.lockMovementX = true;
        textbox.lockMovementY = true;
        textbox.hasControls = false;
        textbox.hasBorders = false;
        textboxRef.current = textbox;
        fabricRef.current.setActiveObject(textbox);
        if (textbox.text) {
          // move cursor to end
          textbox.selectionStart = textbox.text.length;
          textbox.selectionEnd = textbox.text.length;
        }
        textbox.enterEditing();
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
