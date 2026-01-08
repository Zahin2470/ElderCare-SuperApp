import { LogoIcon, LogoFavicon } from './LogoIcon';
import { LogoFull, LogoStacked } from './LogoFull';
import { LogoImage, LogoIconOnly, LogoCompact } from './LogoImage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Download, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import AppIcons from './AppIcons';

/**
 * Brand Guidelines and Asset Showcase
 * Display all logo variants, colors, and typography
 */

export default function BrandShowcase() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const brandColors = [
    { name: 'Primary', value: '#4A90E2', var: '--brand-primary' },
    { name: 'Primary Dark', value: '#3569B0', var: '--brand-primary-dark' },
    { name: 'Accent', value: '#FFA726', var: '--brand-accent' },
    { name: 'Success', value: '#32CD99', var: '--brand-success' },
    { name: 'Neutral 900', value: '#1F2D3D', var: '--brand-neutral-900' },
    { name: 'Neutral 100', value: '#F5F9FF', var: '--brand-neutral-100' },
  ];

  const copyColor = (color: string, name: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    toast.success(`Copied ${name}: ${color}`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-[#4A90E2] to-[#3569B0] bg-clip-text text-transparent">
          ElderCare Brand System
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Complete brand identity guidelines for the ElderCare SuperApp platform
        </p>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="logos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logos">Logo System</TabsTrigger>
          <TabsTrigger value="colors">Colors & Type</TabsTrigger>
          <TabsTrigger value="icons">App Icons</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="logos" className="space-y-8 mt-8">
          {/* Full Horizontal */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Full Wordmark (Horizontal)</h3>
                <p className="text-sm text-gray-600">Primary logo for headers and wide spaces</p>
              </div>
              <Badge>1200×400</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <LogoFull size="md" />
              </div>
              <div className="p-8 bg-gradient-to-r from-[#4A90E2] to-[#3569B0] rounded-lg flex items-center justify-center">
                <LogoFull size="md" variant="white" />
              </div>
            </div>
          </div>

          {/* Stacked */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Stacked Variant</h3>
                <p className="text-sm text-gray-600">For square spaces and compact layouts</p>
              </div>
              <Badge>600×600</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <LogoStacked size="sm" />
              </div>
              <div className="p-8 bg-[#3569B0] rounded-lg flex items-center justify-center">
                <LogoStacked size="sm" variant="reversed" />
              </div>
            </div>
          </div>

          {/* Icon Only */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Icon / Monogram</h3>
                <p className="text-sm text-gray-600">AHZ monogram for app icons and small spaces</p>
              </div>
              <Badge>512×512</Badge>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <LogoIcon size={120} />
              </div>
              <div className="p-8 bg-[#3569B0] rounded-lg flex items-center justify-center">
                <LogoIcon size={120} variant="reversed" />
              </div>
              <div className="p-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <LogoIcon size={120} variant="white" />
              </div>
            </div>
          </div>

          {/* Favicon */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Favicon</h3>
                <p className="text-sm text-gray-600">Simplified version for browser tabs</p>
              </div>
              <Badge>64×64</Badge>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <LogoFavicon size={64} />
              </div>
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <LogoFavicon size={32} />
              </div>
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <LogoFavicon size={16} />
              </div>
            </div>
          </div>

          {/* Image */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Official Logo Image</h3>
                <p className="text-sm text-gray-600">High-resolution brand logo with full design</p>
              </div>
              <Badge>Marketing</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <LogoImage size="lg" />
              </div>
              <div className="p-8 bg-gradient-to-br from-[#1a237e] to-[#0d47a1] rounded-lg flex items-center justify-center">
                <LogoImage size="lg" />
              </div>
            </div>
          </div>

          {/* Icon Only */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Icon Only (Cropped)</h3>
                <p className="text-sm text-gray-600">Heart & house icon extracted from main logo</p>
              </div>
              <Badge>Icon</Badge>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <LogoIconOnly size="lg" />
              </div>
              <div className="p-8 bg-[#3569B0] rounded-lg flex items-center justify-center">
                <LogoIconOnly size="lg" />
              </div>
              <div className="p-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <LogoIconOnly size="lg" />
              </div>
            </div>
          </div>

          {/* Compact */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Compact Logo</h3>
                <p className="text-sm text-gray-600">Optimized for sidebars and headers</p>
              </div>
              <Badge>UI</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <LogoCompact size="md" />
              </div>
              <div className="p-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
                <LogoCompact size="md" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-8 mt-8">
          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Primary brand colors and their usage guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {brandColors.map((color) => (
                  <div
                    key={color.value}
                    className="group relative"
                  >
                    <div
                      className="w-full h-32 rounded-lg shadow-md mb-3 cursor-pointer transition-transform hover:scale-105"
                      style={{ backgroundColor: color.value }}
                      onClick={() => copyColor(color.value, color.name)}
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{color.name}</h4>
                        <p className="text-sm text-gray-600 font-mono">{color.value}</p>
                        <p className="text-xs text-gray-500 font-mono">{color.var}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyColor(color.value, color.name)}
                      >
                        {copiedColor === color.value ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gradient Examples */}
              <div className="mt-8">
                <h4 className="font-semibold mb-4">Brand Gradients</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div
                    className="h-24 rounded-lg shadow-md flex items-center justify-center text-white font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #4A90E2 0%, #3569B0 100%)',
                    }}
                  >
                    Primary Gradient (135°)
                  </div>
                  <div
                    className="h-24 rounded-lg shadow-md flex items-center justify-center text-white font-semibold"
                    style={{
                      background: 'linear-gradient(90deg, #4A90E2 0%, #FFA726 100%)',
                    }}
                  >
                    Primary to Accent (90°)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Font system and type scale for consistent text hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Brand Title • Poppins Bold 48/56</p>
                  <h1 className="text-5xl font-bold" style={{ fontFamily: 'system-ui' }}>
                    ElderCare SuperApp
                  </h1>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Brand Wordmark • Poppins SemiBold 36/44</p>
                  <h2 className="text-4xl font-semibold" style={{ fontFamily: 'system-ui' }}>
                    Care. Connect. Comfort.
                  </h2>
                </div>
                
                <div className="p-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Brand Tagline • Inter Regular 16/24</p>
                  <p className="text-base">
                    A comprehensive platform connecting seniors with care services, 
                    community activities, and essential resources.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="icons" className="space-y-8 mt-8">
          <AppIcons />
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-8 mt-8">
          {/* Usage Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Logo Usage Guidelines</CardTitle>
              <CardDescription>
                Best practices for maintaining brand consistency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Do's */}
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Do's
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Maintain minimum clear space around logo</li>
                    <li>✓ Use approved color variants only</li>
                    <li>✓ Scale proportionally (maintain aspect ratio)</li>
                    <li>✓ Use on high contrast backgrounds</li>
                    <li>✓ Ensure minimum size of 32px for icon</li>
                  </ul>
                </div>

                {/* Don'ts */}
                <div>
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center border-2 border-red-700 rounded-full text-xs">✕</span>
                    Don'ts
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✗ Don't distort or skew the logo</li>
                    <li>✗ Don't change colors or add effects</li>
                    <li>✗ Don't rotate or flip the logo</li>
                    <li>✗ Don't place on busy backgrounds</li>
                    <li>✗ Don't recreate or redraw the logo</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Export Assets</CardTitle>
              <CardDescription>
                Ready-to-use assets for different platforms and use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Logo Icon SVG', size: '512×512' },
                  { name: 'Logo Icon PNG 1x', size: '512×512' },
                  { name: 'Logo Icon PNG 2x', size: '1024×1024' },
                  { name: 'Favicon PNG', size: '32×32 & 16×16' },
                  { name: 'Apple Touch Icon', size: '180×180' },
                  { name: 'Android Launcher', size: '512×512' },
                  { name: 'App Store Icon', size: '1024×1024' },
                  { name: 'Splash Screen', size: '1440×1024' },
                ].map((asset) => (
                  <div
                    key={asset.name}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium">{asset.name}</h4>
                      <p className="text-sm text-gray-600">{asset.size}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}