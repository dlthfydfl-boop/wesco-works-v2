'use client';

import { useEffect, useRef } from 'react';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

export function Barcode({ value, width = 2, height = 50, showText = true }: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    import('jsbarcode').then((JsBarcode) => {
      JsBarcode.default(svgRef.current!, value, {
        format: 'CODE128',
        width,
        height,
        displayValue: showText,
        fontSize: 12,
        margin: 5,
        font: 'Arial',
      });
    });
  }, [value, width, height, showText]);

  if (!value) return null;

  return <svg ref={svgRef} />;
}
