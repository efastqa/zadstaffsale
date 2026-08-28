import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product } from '../types';
import { playScanSuccessSound, playAddToCartSound } from '../utils/audio';
import { createSingleProductWhatsAppLink } from '../utils/whatsapp';
import { 
  ScanLine, 
  Camera, 
  X, 
  Search, 
  Plus, 
  Check, 
  ExternalLink, 
  MessageCircle, 
  Sparkles,
  AlertCircle,
  Barcode,
  Ban
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  currentEmployeeName?: string;
  currentEmployeeId?: string;
  currentDepartment?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
  currentEmployeeName,
  currentEmployeeId,
  currentDepartment,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'zad-barcode-reader-region';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedProduct(null);
      setScanMessage(null);
      setManualCode('');
      return;
    }
  }, [isOpen]);

  const handleBarcodeFound = (decodedText: string) => {
    const cleanCode = decodedText.trim();
    playScanSuccessSound();
    
    // Find matching product
    const found = products.find(
      (p) => 
        p.barcode.toLowerCase() === cleanCode.toLowerCase() ||
        p.sku.toLowerCase() === cleanCode.toLowerCase() ||
        p.id.toLowerCase() === cleanCode.toLowerCase()
    );

    if (found) {
      setScannedProduct(found);
      setScanMessage(`Matched: ${found.name}`);
    } else {
      setScannedProduct(null);
      setScanMessage(`No staff sale item found for barcode "${cleanCode}".`);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraActive(true);

      // wait for DOM container to mount
      setTimeout(async () => {
        const scanner = new Html5Qrcode(qrRegionId);
        scannerRef.current = scanner;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 180 },
          aspectRatio: 1.333,
        };

        try {
          await scanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              handleBarcodeFound(decodedText);
            },
            () => {
              // ignore frame errors
            }
          );
        } catch (err: unknown) {
          console.error('Camera start error', err);
          setCameraError(
            'Camera permission denied or camera not accessible in preview. You can use the Quick Barcode Test Buttons or manual entry below.'
          );
          setCameraActive(false);
        }
      }, 200);
    } catch (err: unknown) {
      console.error(err);
      setCameraError('Unable to start barcode scanner.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error('Error stopping scanner', e);
      }
    }
    scannerRef.current = null;
    setCameraActive(false);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeFound(manualCode);
  };

  const handleAddToCart = (product: Product) => {
    onAddToCart(product, 1);
    playAddToCartSound();
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-200">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Staff Barcode Scanner</h3>
              <p className="text-[11px] text-slate-300">
                Scan ZAD warehouse items or enter barcode number
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Camera Scanner View */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden relative min-h-[200px] flex flex-col items-center justify-center border border-slate-800 shadow-inner">
            {cameraActive ? (
              <div className="w-full relative">
                <div id={qrRegionId} className="w-full max-w-md mx-auto" />
                <button
                  onClick={stopCamera}
                  className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full hover:bg-red-700 font-medium flex items-center gap-1.5 shadow-xs"
                >
                  <X className="w-3.5 h-3.5" /> Stop Camera
                </button>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-xs">Live Camera Scanner</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                    Use your camera to scan barcodes on stock cartons.
                  </p>
                </div>
                <button
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-full text-xs font-semibold transition-all shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Turn On Camera
                </button>
              </div>
            )}

            {cameraError && (
              <div className="p-3 m-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Quick Barcode Simulator for Demo / Fast Testing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                Quick Test Barcodes (Click to Instant Scan)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleBarcodeFound(p.barcode)}
                  className="p-2.5 bg-slate-50 hover:bg-white hover:border-slate-300 border border-slate-200 rounded-xl text-left transition-all group"
                >
                  <div className="text-[11px] font-bold text-slate-800 line-clamp-1 group-hover:text-slate-900">
                    {p.name}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                      {p.barcode.slice(-6)}
                    </span>
                    <span className="font-bold text-slate-900">QAR {p.staffPrice.toFixed(0)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Barcode Search */}
          <form onSubmit={handleManualSearch} className="relative">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Or Type / Paste Barcode or SKU:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 6291100234012, 8000500003787, ZAD-BEV-1001"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Search className="w-3.5 h-3.5" /> Look Up
              </button>
            </div>
          </form>

          {/* Scan Result Card */}
          {scannedProduct ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs animate-in slide-in-from-bottom-2">
              <div className="flex items-start gap-4">
                <img
                  src={scannedProduct.imageUrl}
                  alt={scannedProduct.name}
                  className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-xs bg-white"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Item Matched
                    </span>
                    <span className="text-xs font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      {scannedProduct.barcode}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug">
                    {scannedProduct.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>{scannedProduct.unit}</span>
                    <span>•</span>
                    {scannedProduct.stock <= 0 ? (
                      <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Sold Out • نفدت الكمية
                      </span>
                    ) : (
                      <span>Stock: <strong className="text-slate-700">{scannedProduct.stock}</strong> left</span>
                    )}
                  </p>

                  <div className="flex items-baseline gap-2 mt-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Staff Price</span>
                      <span className="text-lg font-black text-slate-900">
                        QAR {scannedProduct.staffPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
                    {scannedProduct.stock <= 0 ? (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      >
                        <Ban className="w-4 h-4" /> Sold Out
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAddToCart(scannedProduct)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white transition-all shadow-xs ${
                            addedAnimation
                              ? 'bg-emerald-600 scale-105'
                              : 'bg-slate-900 hover:bg-slate-800'
                          }`}
                        >
                          {addedAnimation ? (
                            <>
                              <Check className="w-4 h-4" /> Added to Cart!
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" /> Add to Staff Cart
                            </>
                          )}
                        </button>

                        <a
                          href={createSingleProductWhatsAppLink(
                            scannedProduct,
                            currentEmployeeName,
                            currentEmployeeId,
                            currentDepartment
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-semibold transition-colors shadow-xs"
                        >
                          <MessageCircle className="w-4 h-4" /> 1-Click WhatsApp Order
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : scanMessage ? (
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 text-center">
              {scanMessage}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>Official ZAD Marketing Staff Sales</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-full transition-colors"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
