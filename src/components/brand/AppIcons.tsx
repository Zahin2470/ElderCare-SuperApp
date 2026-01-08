import { LogoIcon, LogoFavicon } from './LogoIcon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

/**
 * App Icon Showcase
 * Displays how the logo would appear in various app contexts
 */

export default function AppIcons() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>iOS App Icons</CardTitle>
          <CardDescription>
            Required icon sizes for Apple App Store and iOS devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { size: 1024, name: 'App Store', desc: '1024×1024' },
              { size: 180, name: 'iPhone Pro Max', desc: '180×180' },
              { size: 167, name: 'iPad Pro', desc: '167×167' },
              { size: 152, name: 'iPad', desc: '152×152' },
              { size: 120, name: 'iPhone', desc: '120×120' },
              { size: 87, name: 'iPhone (2x)', desc: '87×87' },
              { size: 80, name: 'iPad (2x)', desc: '80×80' },
              { size: 76, name: 'iPad', desc: '76×76' },
            ].map((icon) => (
              <div key={icon.size} className="flex flex-col items-center space-y-2">
                <div
                  className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden"
                  style={{
                    width: Math.min(icon.size, 120),
                    height: Math.min(icon.size, 120),
                  }}
                >
                  <LogoIcon size={Math.min(icon.size, 120)} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{icon.name}</p>
                  <p className="text-xs text-gray-500">{icon.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Android App Icons</CardTitle>
          <CardDescription>
            Icon sizes for Google Play Store and Android devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Google Play Store */}
            <div>
              <h4 className="font-semibold mb-3">Google Play Store</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden w-32 h-32">
                    <LogoIcon size={128} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Play Store Icon</p>
                    <p className="text-xs text-gray-500">512×512</p>
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="bg-gray-100 rounded-lg shadow-lg overflow-hidden w-32 h-48">
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#4A90E2] to-[#3569B0]">
                      <LogoIcon size={64} variant="white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Feature Graphic</p>
                    <p className="text-xs text-gray-500">1024×500</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Adaptive Icons */}
            <div>
              <h4 className="font-semibold mb-3">Adaptive Icons (Android 8.0+)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { size: 512, name: 'Foreground', desc: '432×432' },
                  { size: 192, name: 'xxxhdpi', desc: '192×192' },
                  { size: 144, name: 'xxhdpi', desc: '144×144' },
                  { size: 96, name: 'xhdpi', desc: '96×96' },
                ].map((icon) => (
                  <div key={icon.size} className="flex flex-col items-center space-y-2">
                    <div className="relative">
                      {/* Background circle to show adaptive clipping */}
                      <div
                        className="rounded-full bg-gradient-to-br from-gray-200 to-gray-300 shadow-lg"
                        style={{
                          width: Math.min(icon.size / 4, 100),
                          height: Math.min(icon.size / 4, 100),
                        }}
                      />
                      {/* Foreground icon */}
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{
                          width: Math.min(icon.size / 4, 100),
                          height: Math.min(icon.size / 4, 100),
                        }}
                      >
                        <LogoIcon size={Math.min(icon.size / 5, 80)} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{icon.name}</p>
                      <p className="text-xs text-gray-500">{icon.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Web Favicons</CardTitle>
          <CardDescription>
            Icons for browser tabs and web app manifests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {[
              { size: 192, name: 'Android Chrome', desc: '192×192' },
              { size: 180, name: 'Apple Touch', desc: '180×180' },
              { size: 96, name: 'Windows Tile', desc: '96×96' },
              { size: 64, name: 'Standard', desc: '64×64' },
              { size: 32, name: 'Browser Tab', desc: '32×32' },
              { size: 16, name: 'Small', desc: '16×16' },
            ].map((icon) => (
              <div key={icon.size} className="flex flex-col items-center space-y-2">
                <div className="bg-white border-2 border-gray-200 rounded shadow-sm flex items-center justify-center p-2">
                  <LogoFavicon size={icon.size > 64 ? 64 : icon.size} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{icon.name}</p>
                  <p className="text-xs text-gray-500">{icon.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Browser Tab Preview */}
          <div className="mt-8">
            <h4 className="font-semibold mb-3">Browser Tab Preview</h4>
            <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
              <div className="bg-white rounded-t-lg border border-gray-300 p-2 max-w-md">
                <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded">
                  <LogoFavicon size={16} />
                  <span className="text-sm text-gray-700">ElderCare SuperApp - Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progressive Web App (PWA)</CardTitle>
          <CardDescription>
            Manifest icons for installable web applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
              <pre className="text-sm text-gray-700 overflow-x-auto">
{`{
  "name": "ElderCare SuperApp",
  "short_name": "ElderCare",
  "description": "Care. Connect. Comfort.",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "theme_color": "#4A90E2",
  "background_color": "#F5F9FF",
  "display": "standalone",
  "start_url": "/"
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
