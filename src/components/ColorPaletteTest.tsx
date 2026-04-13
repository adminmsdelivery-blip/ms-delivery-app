// Test component to verify new color palette
import React from 'react';

const ColorPaletteTest = () => {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Color Palette Test</h2>
      
      {/* Primary Colors */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Primary Colors</h3>
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-primary-50 p-4 rounded text-center">Primary-50</div>
          <div className="bg-primary-500 p-4 rounded text-white text-center">Primary-500</div>
          <div className="bg-primary-600 p-4 rounded text-white text-center">Primary-600</div>
          <div className="bg-primary-700 p-4 rounded text-white text-center">Primary-700</div>
          <div className="bg-primary-900 p-4 rounded text-white text-center">Primary-900</div>
        </div>
      </div>

      {/* Extended 9-Color Palette */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Extended Color Palette</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-gray p-4 rounded text-white text-center">Slate Gray</div>
          <div className="bg-soft-indigo p-4 rounded text-white text-center">Soft Indigo</div>
          <div className="bg-sky-blue p-4 rounded text-white text-center">Sky Blue</div>
          <div className="bg-mint-green p-4 rounded text-white text-center">Mint Green</div>
          <div className="bg-warm-gold p-4 rounded text-white text-center">Warm Gold</div>
          <div className="bg-peach-orange p-4 rounded text-white text-center">Peach/Orange</div>
          <div className="bg-coral-red p-4 rounded text-white text-center">Coral Red</div>
          <div className="bg-soft-orchid p-4 rounded text-white text-center">Soft Orchid</div>
          <div className="bg-lavender p-4 rounded text-white text-center">Lavender</div>
        </div>
      </div>

      {/* Button Examples */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Button Examples</h3>
        <div className="space-x-4">
          <button className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700">
            Primary Button
          </button>
          <button className="bg-slate-gray text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800">
            Slate Button
          </button>
          <button className="bg-mint-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
            Mint Button
          </button>
          <button className="bg-coral-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700">
            Coral Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPaletteTest;
