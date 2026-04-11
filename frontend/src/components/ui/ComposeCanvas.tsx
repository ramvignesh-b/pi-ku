import * as fabric from "fabric";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const PAD = 36;

type CanvasJSON = ReturnType<fabric.Canvas["toJSON"]>;

export type CanvasTools = {
  addImage: (url: string, file: File) => void;
  getData: () => { objects: CanvasJSON["objects"] }; // no-any hack :/
  getJsonData: () => string;
  getImages: () => { src: string; file: File }[];
};

export interface FabricImageWithFile extends fabric.FabricImage {
  _customRawFile: File;
}

export const ComposeCanvas = forwardRef<CanvasTools>((_props, ref) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const textboxRef = useRef<fabric.Textbox | null>(null);

  useEffect(() => {
    let isMounted = true;
    let canvas: fabric.Canvas | null = null;

    const init = async () => {
      // lazy populate
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

      // init canvas
      canvas = new fabric.Canvas(canvasRef.current, {
        width: finalWidth,
        height: initialHeight,
        selection: false,
        preserveObjectStacking: true,
        allowTouchScrolling: true, // for mobile
      });

      fabricRef.current = canvas;

      // transparent background
      const wrapperEl = canvas.getElement().parentElement;
      if (wrapperEl) wrapperEl.style.background = "transparent";

      // the core textbox
      const textbox = new fabric.Textbox("Take a deep breath...", {
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
        objectCaching: false, // for font crispness
        splitByGrapheme: false,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
      });

      textboxRef.current = textbox;
      canvas.add(textbox);

      // automatically adjust height
      textbox.on("changed", () => {
        if (!canvas || !wrapperRef.current) return;
        const neededHeight = textbox.top + textbox.height + PAD;
        if (neededHeight > canvas.height) {
          const newH = neededHeight + PAD;
          canvas.setDimensions({ height: newH });
          wrapperRef.current.style.height = `${newH}px`;
        }
      });

      // auto focus
      setTimeout(() => {
        if (!isMounted) return;
        canvas?.setActiveObject(textbox);
        textbox.enterEditing();
        canvas?.renderAll();

        // Accessibility fix for Fabric.js hidden textarea
        // searching globally in case it is appended to body
        const hiddenTextareas = document.querySelectorAll(
          'textarea[data-fabric="textarea"]',
        );
        hiddenTextareas.forEach((ta) => {
          if (!ta.getAttribute("aria-label")) {
            ta.setAttribute("aria-label", "Canvas text input");
          }
        });
      }, 100);

      canvas.on("mouse:down", (opt) => {
        if (!opt.target || opt.target === textbox) {
          canvas?.setActiveObject(textbox);
          textbox.enterEditing();
          canvas?.renderAll();
        }
      });
    };

    init();

    return () => {
      isMounted = false;
      canvas?.dispose();
      fabricRef.current = null;
      textboxRef.current = null;
    };
  }, []);

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

        URL.revokeObjectURL(url); // cleanup browser upload
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
      ) as FabricImageWithFile[];
      return images.map((img) => ({
        src: (img.getElement() as HTMLImageElement).currentSrc,
        file: img._customRawFile,
      }));
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
